import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "behavior", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const expectedTitles = [
  "Печь-камин в деревянном доме",
  "Замена старой печи",
  "Уже купленная печь",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function verifyStructure() {
  const component = await readFile("src/components/cases/cases-emergency-slider-02.astro", "utf8");
  const page = await readFile("src/pages/index.astro", "utf8");
  const site = await readFile("src/scripts/site.ts", "utf8");

  check(component.includes("interface CaseItem"), "CaseItem interface is missing");
  for (const field of ["objectType?: string", "location?: string", "task: string", "works: string[]", "status?: string"]) {
    check(component.includes(field), `CaseItem field is missing: ${field}`);
  }
  check(component.includes("data-real-case-slider"), "case-slider root marker is missing");
  check(component.includes('aria-labelledby="case-slider-title"'), "section must reference its heading");
  check(component.includes('id="case-slider-title"'), "case-slider heading id is missing");
  check(component.includes("data-case-state"), "draft/published state marker is missing");
  check(component.includes('data-swiper-counter="true"'), "counter opt-in marker is missing");
  check(component.includes('"slidesPerView":"auto"'), "slidesPerView must be auto");
  check(!component.toLowerCase().includes("autoplay"), "autoplay must not be configured");
  check(component.includes("data-swiper-current"), "current counter node is missing");
  check(component.includes("data-swiper-total"), "total counter node is missing");
  check(component.includes('aria-label="Предыдущий кейс"'), "previous button label is missing");
  check(component.includes('aria-label="Следующий кейс"'), "next button label is missing");
  check(component.includes("Фото объекта будет добавлено"), "honest photo placeholder is missing");
  check(component.includes('loading="lazy"'), "case images must be lazy loaded");
  check(!component.includes("filter: grayscale"), "real photos must keep natural color");
  check(!component.includes('href="#'), "Block10 must not contain a CTA link");

  check(page.includes('"eyebrow":  "Реализованные объекты"'), "Block10 eyebrow changed");
  check(page.includes('"headline":  "Монтажи, где важна"'), "Block10 headline changed");
  check(page.includes('"accent":  "каждая деталь"'), "Block10 accent changed");
  check((page.match(/"status":\s+"Карточка кейса готовится"/g) ?? []).length === 3, "all draft cases need honest status");
  for (const title of expectedTitles) check(page.includes(`"title":  "${title}"`), `case title changed: ${title}`);
  check(/<Block10\s+\{\.\.\.blockProps\[6\]\}\s*\/>/.test(page), "Block10 wiring changed");

  check(site.includes("Keyboard"), "Swiper Keyboard module is missing");
  check(site.includes("data-swiper-current"), "counter synchronization is missing");
  check(site.includes('slider.on("slideChange"'), "counter must react to slide changes");
}

async function openPage(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.locator("[data-real-case-slider]").waitFor({ state: "visible" });
  return page;
}

async function verifyBehavior() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await openPage(browser, 1440, 1000);
    const section = page.locator("[data-real-case-slider]");
    const slider = section.locator(".swiper");
    const current = section.locator("[data-swiper-current]");
    const total = section.locator("[data-swiper-total]");
    const next = section.locator(".swiper-button-next");
    const previous = section.locator(".swiper-button-prev");

    await slider.waitFor({ state: "visible" });
    check(
      (await section.locator("h2").textContent())?.replace(/\s+/g, " ").trim() ===
        "Монтажи, где важна каждая деталь",
      "case heading parts must have semantic whitespace",
    );
    await page.waitForFunction(() => document.querySelector("[data-real-case-slider] .swiper")?.classList.contains("swiper-initialized"));
    check((await current.textContent())?.trim() === "01", "counter must start at 01");
    check((await total.textContent())?.trim() === "03", "counter total must be 03");
    check((await next.count()) === 1 && (await previous.count()) === 1, "slider needs one previous and one next button");
    check(await next.isEnabled(), "next case button must be enabled initially");

    await next.click();
    await page.waitForFunction(() => document.querySelector("[data-swiper-current]")?.textContent?.trim() === "02");
    check((await current.textContent())?.trim() === "02", "counter must advance after next click");

    await previous.focus();
    await previous.press("Enter");
    await page.waitForFunction(() => document.querySelector("[data-swiper-current]")?.textContent?.trim() === "01");
    check((await current.textContent())?.trim() === "01", "keyboard activation must move to previous case");

    const runtime = await slider.evaluate((element) => ({
      ready: element.dataset.swiperReady,
      autoplay: element.swiper?.params?.autoplay ?? false,
      keyboard: element.swiper?.params?.keyboard?.enabled ?? false,
    }));
    check(runtime.ready === "true", "case slider must use shared initialization");
    check(runtime.autoplay === false, "runtime autoplay must stay disabled");
    check(runtime.keyboard === true, "runtime keyboard navigation must be enabled");
    await page.close();
  } finally {
    await browser.close();
  }
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", vertical: false },
      { width: 768, height: 1000, name: "tablet", vertical: false },
      { width: 390, height: 900, name: "mobile", vertical: true },
    ]) {
      const page = await openPage(browser, viewport.width, viewport.height);
      const section = page.locator("[data-real-case-slider]");
      const slider = section.locator(".cases-emergency__slider");
      const cards = section.locator(".cases-emergency__card");
      await page.waitForFunction(() => document.querySelector("[data-real-case-slider] .swiper")?.classList.contains("swiper-initialized"));

      check((await section.locator("h2").count()) === 1, `${viewport.name}: section needs one H2`);
      check((await cards.count()) === 3, `${viewport.name}: section needs three draft cases`);
      check(JSON.stringify(await cards.locator("h3").allTextContents()) === JSON.stringify(expectedTitles), `${viewport.name}: case titles or order changed`);
      check((await section.evaluate((element) => getComputedStyle(element).backgroundColor)) === "rgb(11, 31, 51)", `${viewport.name}: dark section background changed`);
      check(await section.evaluate((element) => element.previousElementSibling?.hasAttribute("data-compatibility-system")), `${viewport.name}: Block8 adjacency changed`);
      check(await section.evaluate((element) => element.nextElementSibling?.classList.contains("social-links-cards")), `${viewport.name}: Block11 adjacency changed`);

      const sectionBox = await section.boundingBox();
      const sliderBox = await slider.boundingBox();
      const firstBox = await cards.nth(0).boundingBox();
      const nextBox = await cards.nth(1).boundingBox();
      check(Boolean(sectionBox && sliderBox && firstBox && nextBox), `${viewport.name}: slider boxes are unavailable`);
      if (sliderBox && firstBox && nextBox) {
        const ratio = firstBox.width / sliderBox.width;
        check(ratio >= (viewport.vertical ? 0.86 : 0.72), `${viewport.name}: active case is too narrow (${ratio.toFixed(2)})`);
        check(ratio <= (viewport.vertical ? 0.96 : 0.90), `${viewport.name}: active case hides the next case (${ratio.toFixed(2)})`);
        check(nextBox.x < viewport.width && nextBox.x + nextBox.width > viewport.width, `${viewport.name}: next case edge must be visible`);
      }

      const columns = await cards.nth(0).evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
      check(columns === (viewport.vertical ? 1 : 2), `${viewport.name}: case card orientation is incorrect`);
      const titleFontSize = await cards.nth(0).locator("h3").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      check(viewport.name !== "desktop" || titleFontSize <= 40, `${viewport.name}: case title is too large (${titleFontSize}px)`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);
      check((await section.locator('.cases-emergency__placeholder-icon[aria-hidden="true"]').count()) === 3, `${viewport.name}: placeholder icons must be decorative`);

      await section.screenshot({ path: `artifacts/case-slider-${viewport.name}.png` });
      await page.close();
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

console.log(`Case slider ${mode} verification passed`);
