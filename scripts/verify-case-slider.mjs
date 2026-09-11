import fs from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const requestedMode = process.argv.at(-1);
const mode = ["structure", "behavior", "layout", "all"].includes(requestedMode)
  ? requestedMode
  : "structure";
const failures = [];
const executableCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = executableCandidates.find((candidate) => fs.existsSync(candidate));

const pages = [
  {
    name: "installation",
    path: "/",
    heading: "Как меняется монтаж в зависимости от дома",
    pageFile: "src/pages/index.astro",
    wiring: "<Block10 {...blockProps[6]} />",
  },
  {
    name: "repair",
    path: "/remont-i-restavratsiya-pechey/",
    heading: "Что ремонтируют в кирпичных и металлических печах",
    pageFile: "src/pages/remont-i-restavratsiya-pechey.astro",
    wiring: "<CaseSlider {...cases} />",
  },
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function verifyStructure() {
  const component = await readFile("src/components/cases/cases-emergency-slider-02.astro", "utf8");
  const site = await readFile("src/scripts/site.ts", "utf8");

  check(component.includes("interface CaseItem"), "CaseItem interface is missing");
  for (const field of ["objectType?: string", "location?: string", "task: string", "works: string[]", "imageSrc?: string"]) {
    check(component.includes(field), `CaseItem field is missing: ${field}`);
  }
  check(component.includes("data-real-case-slider"), "case-slider root marker is missing");
  check(component.includes('aria-labelledby="case-slider-title"'), "section must reference its heading");
  check(component.includes('id="case-slider-title"'), "case-slider heading id is missing");
  check(component.includes('"slidesPerView":"auto"'), "slidesPerView must be auto");
  check(!component.toLowerCase().includes("autoplay"), "autoplay must not be configured");
  check(component.includes('loading="lazy"'), "case images must be lazy loaded");
  check(component.includes('href="#estimate-quiz"'), "case CTA must lead to the estimate quiz");

  for (const pageConfig of pages) {
    const page = await readFile(pageConfig.pageFile, "utf8");
    check(page.includes(pageConfig.wiring), `${pageConfig.name}: case slider wiring changed`);
  }

  check(site.includes("Keyboard"), "Swiper Keyboard module is missing");
  check(site.includes("swiperReady"), "shared Swiper initialization is missing");
}

async function openPage(browser, pageConfig, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(new URL(pageConfig.path, baseURL).href, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.locator("[data-real-case-slider]").waitFor({ state: "visible" });
  await page.waitForFunction(() =>
    document.querySelector("[data-real-case-slider] .swiper")?.classList.contains("swiper-initialized"),
  );
  return page;
}

async function verifyBehavior() {
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    for (const pageConfig of pages) {
      const page = await openPage(browser, pageConfig, 1440, 1000);
      const section = page.locator("[data-real-case-slider]");
      const slider = section.locator(".swiper");
      const cards = section.locator(".cases-emergency__card");
      const titles = (await cards.locator("h3").allTextContents()).map((title) => title.trim());
      const imageSources = await cards.locator("img").evaluateAll((images) =>
        images.map((image) => image.getAttribute("src")),
      );

      check(
        (await section.locator("h2").textContent())?.replace(/\s+/g, " ").trim() === pageConfig.heading,
        `${pageConfig.name}: unexpected section heading`,
      );
      check((await cards.count()) === 9, `${pageConfig.name}: expected nine case cards`);
      check(new Set(titles).size === 9, `${pageConfig.name}: case titles must be unique`);
      check(imageSources.length === 9, `${pageConfig.name}: every case needs an image`);
      check(new Set(imageSources).size === 9, `${pageConfig.name}: case images must not repeat`);
      check((await section.locator('.cases-emergency__cta[href="#estimate-quiz"]').count()) === 9, `${pageConfig.name}: every card needs the estimate CTA`);

      const runtime = await slider.evaluate((element) => ({
        ready: element.dataset.swiperReady,
        autoplay: element.swiper?.params?.autoplay ?? false,
        keyboard: element.swiper?.params?.keyboard?.enabled ?? false,
        activeIndex: element.swiper?.activeIndex ?? 0,
      }));
      check(runtime.ready === "true", `${pageConfig.name}: slider must use shared initialization`);
      check(runtime.autoplay === false, `${pageConfig.name}: autoplay must stay disabled`);
      check(runtime.keyboard === true, `${pageConfig.name}: keyboard navigation must be enabled`);

      await slider.evaluate((element) => element.swiper?.slideNext(0));
      const nextIndex = await slider.evaluate((element) => element.swiper?.activeIndex ?? 0);
      check(nextIndex > runtime.activeIndex, `${pageConfig.name}: slider does not advance`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    for (const pageConfig of pages) {
      for (const viewport of [
        { width: 1440, height: 1000, name: "desktop" },
        { width: 390, height: 900, name: "mobile" },
      ]) {
        const page = await openPage(browser, pageConfig, viewport.width, viewport.height);
        const section = page.locator("[data-real-case-slider]");
        const firstCard = section.locator(".cases-emergency__card").first();

        await section.scrollIntoViewIfNeeded();
        check((await section.locator("h2").count()) === 1, `${pageConfig.name}/${viewport.name}: section needs one H2`);
        check((await firstCard.boundingBox()) !== null, `${pageConfig.name}/${viewport.name}: first card is not visible`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(overflow <= 1, `${pageConfig.name}/${viewport.name}: page overflows horizontally by ${overflow}px`);

        await section.screenshot({ path: `artifacts/case-slider-${pageConfig.name}-${viewport.name}.png` });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "behavior" || mode === "all") await verifyBehavior();
if (mode === "layout" || mode === "all") await verifyLayout();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Case slider ${mode} verification passed for both pages`);
