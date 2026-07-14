import { chromium } from "playwright";
import { access, mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const removedHeadlines = [
  "Здесь рассчитываем установку готовой металлической печи",
  "Монтаж печи в деревянном, каркасном или каменном доме",
  "Из чего складывается расчёт установки",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function verifyStructure() {
  const page = await readFile("src/pages/index.astro", "utf8");

  for (const headline of removedHeadlines) {
    check(!page.includes(headline), `removed data remains: ${headline}`);
  }

  check(!page.includes("comparison-method-table-02.astro"), "comparison import remains");
  check(!page.includes('import Block7 from "../components/features/materials-card-grid-01.astro"'), "Block7 import remains");
  check(!page.includes("pricing-service-table-02.astro"), "pricing import remains");
  check(!/<Block6\b/.test(page), "Block6 render remains");
  check(!/<Block7\b/.test(page), "Block7 render remains");
  check(!/<Block9\b/.test(page), "Block9 render remains");
  check(/<Block5\s+\{\.\.\.blockProps\[4\]\}\s+variant="equipment-lineup"\s*\/>/.test(page), "Block5 wiring changed");
  check(/<Block8\s+\{\.\.\.blockProps\[5\]\}\s*\/>/.test(page), "Block8 must consume blockProps[5]");
  check(/<Block10\s+\{\.\.\.blockProps\[6\]\}\s*\/>/.test(page), "Block10 must consume blockProps[6]");
  check(/<Block11\s+\{\.\.\.blockProps\[7\]\}\s*\/>/.test(page), "Block11 must consume blockProps[7]");
  check(/<Block17\s+\{\.\.\.blockProps\[13\]\}\s*\/>/.test(page), "Block17 must consume blockProps[13]");

  check(!(await pathExists("src/components/comparison/comparison-method-table-02.astro")), "unused comparison component still exists");
  check(!(await pathExists("src/components/pricing/pricing-service-table-02.astro")), "unused pricing component still exists");
  check(await pathExists("src/components/features/materials-card-grid-01.astro"), "Block5 component was removed");
  check(!(await pathExists("artifacts/materials-card-grid-block7-desktop.png")), "obsolete Block7 artifact still exists");
}

async function waitForLineupImages(page) {
  const lineup = page.locator('[data-card-grid-variant="equipment-lineup"]');
  await lineup.scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-card-grid-variant="equipment-lineup"] img')].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop" },
      { width: 390, height: 900, name: "mobile" },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });

      const lineup = page.locator('[data-card-grid-variant="equipment-lineup"]');
      const compatibility = page.locator(".equipment-process");
      await lineup.waitFor({ state: "visible" });
      await waitForLineupImages(page);

      check(await lineup.evaluate((element) => element.nextElementSibling?.classList.contains("equipment-process")), `${viewport.name}: Block8 must immediately follow Block5`);
      check(await compatibility.evaluate((element) => element.nextElementSibling?.classList.contains("cases-emergency")), `${viewport.name}: Block10 must immediately follow Block8`);
      check((await page.locator(".method-comparison").count()) === 0, `${viewport.name}: comparison block remains`);
      check((await page.locator('[data-card-grid-variant="cards"]').count()) === 0, `${viewport.name}: house card grid remains`);
      check((await page.locator(".service-prices").count()) === 0, `${viewport.name}: pricing block remains`);

      const bodyText = await page.locator("body").innerText();
      for (const headline of removedHeadlines) {
        check(!bodyText.includes(headline), `${viewport.name}: removed headline remains: ${headline}`);
      }
      check(!bodyText.includes("Обычная уборка") && !bodyText.includes("Профессионально"), `${viewport.name}: template labels remain`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);

      const region = await lineup.evaluate((element) => {
        const first = element.getBoundingClientRect();
        const third = element.nextElementSibling?.nextElementSibling?.getBoundingClientRect();
        const y = Math.max(0, first.top + window.scrollY);
        const bottom = (third?.bottom ?? first.bottom) + window.scrollY;
        return { x: 0, y, width: document.documentElement.clientWidth, height: bottom - y };
      });
      const artifactPath = `artifacts/section-removal-transition-${viewport.name}.png`;
      const fullPageScreenshot = await page.screenshot({ fullPage: true });
      await sharp(fullPageScreenshot)
        .extract({
          left: Math.floor(region.x),
          top: Math.floor(region.y),
          width: Math.floor(region.width),
          height: Math.ceil(region.height),
        })
        .png()
        .toFile(artifactPath);
      const artifactMetadata = await sharp(artifactPath).metadata();
      check(
        artifactMetadata.height >= Math.floor(region.height),
        `${viewport.name}: transition artifact is clipped to the viewport`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "layout" || mode === "all") await verifyLayout();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Section removal ${mode} verification passed`);
