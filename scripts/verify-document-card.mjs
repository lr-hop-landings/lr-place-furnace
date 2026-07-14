import { chromium } from "playwright";
import { access, mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];
const stageTitles = ["До работ", "В процессе", "После"];
const stageTexts = [
  "Договор и согласованная смета.",
  "Фото скрытых и проходных узлов.",
  "Акт, согласованные гарантийные условия и инструктаж.",
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
  const [page, component] = await Promise.all([
    readFile("src/pages/index.astro", "utf8"),
    readFile("src/components/guarantees/guarantee-certificate-01.astro", "utf8"),
  ]);

  check(!page.includes('import Block13 from "../components/trust-bar/trust-company-proof-02.astro"'), "Block13 import remains");
  check(!/<Block13\b/.test(page), "Block13 render remains");
  check(!(await pathExists("src/components/trust-bar/trust-company-proof-02.astro")), "unused Block13 component remains");
  check(/<Block14\s+\{\.\.\.blockProps\[8\]\}\s*\/>/.test(page), "Block14 must consume blockProps[8]");
  check(/<Block17\s+\{\.\.\.blockProps\[10\]\}\s*\/>/.test(page), "Block17 must consume blockProps[10]");
  check(!page.includes('"summaryTitle"') && !page.includes('"summaryText"'), "service-only summary data remains");
  check(!component.includes("summaryTitle") && !component.includes("summaryText"), "summary API remains");
  check(!component.includes("guarantee-certificate__summary"), "summary markup or styles remain");
  check(component.includes('<ol class="guarantee-certificate__items">'), "document stages must use OL");
  check(component.includes('<li class="guarantee-certificate__item">'), "document stages must use LI");
  check(component.includes("guarantee-certificate__marker"), "number markers are missing");
  check(component.includes('padStart(2, "0")'), "markers must use 01/02/03 format");
  check(component.includes('aria-hidden="true"'), "decorative markers must be hidden from assistive technology");
  check(component.includes(".guarantee-certificate__footer a:focus-visible"), "CTA focus state is missing");
  check(page.includes("Смета до начала работ, документы после монтажа"), "document-card headline changed");
  check(page.includes("Объём работ, материалы, стоимость и условия должны быть понятны до начала монтажа."), "document-card subline changed");
  check(page.includes('"cta":  "Запросить пример сметы"'), "CTA copy changed");
  check(page.includes('"ctaHref":  "#estimate-quiz"'), "CTA target changed");
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", columns: 2 },
      { width: 768, height: 900, name: "tablet", columns: 1 },
      { width: 390, height: 900, name: "mobile", columns: 1 },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });

      const section = page.locator(".guarantee-certificate");
      const inner = section.locator(".guarantee-certificate__inner");
      const card = section.locator(".guarantee-certificate__card");
      const items = section.locator(".guarantee-certificate__item");
      const cta = section.locator(".guarantee-certificate__footer a");
      await section.waitFor({ state: "visible" });

      check((await page.locator(".company-proof").count()) === 0, `${viewport.name}: company proof remains`);
      const photoSocial = page.locator(".social-links-cards").nth(1);
      check(
        await photoSocial.evaluate((element) => element.nextElementSibling?.classList.contains("guarantee-certificate")),
        `${viewport.name}: document card must immediately follow the photo social strip`,
      );
      check((await items.count()) === 3, `${viewport.name}: expected three document stages`);
      check((await items.evaluateAll((elements) => elements.every((element) => element.tagName === "LI"))), `${viewport.name}: stages must render as LI`);
      check(JSON.stringify(await items.locator("h3").allTextContents()) === JSON.stringify(stageTitles), `${viewport.name}: stage titles changed`);
      check(JSON.stringify(await items.locator("p").allTextContents()) === JSON.stringify(stageTexts), `${viewport.name}: stage texts changed`);
      check((await section.locator(".guarantee-certificate__summary").count()) === 0, `${viewport.name}: summary remains`);
      check((await cta.textContent())?.trim() === "Запросить пример сметы", `${viewport.name}: CTA copy changed`);
      check((await cta.getAttribute("href")) === "#estimate-quiz", `${viewport.name}: CTA target changed`);

      const columnCount = await inner.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
      check(columnCount === viewport.columns, `${viewport.name}: expected ${viewport.columns} layout column(s), received ${columnCount}`);
      const cardBox = await card.boundingBox();
      check(Boolean(cardBox) && cardBox.x >= 0 && cardBox.x + cardBox.width <= viewport.width, `${viewport.name}: card escapes viewport`);
      if (viewport.name === "mobile") {
        const [buttonBox, footerBox] = await Promise.all([cta.boundingBox(), section.locator(".guarantee-certificate__footer").boundingBox()]);
        check(Boolean(buttonBox && footerBox) && Math.abs(buttonBox.width - footerBox.width) <= 1, "mobile: CTA must fill footer width");
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);

      await section.screenshot({ path: `artifacts/document-card-${viewport.name}.png` });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "layout" || mode === "all") await verifyLayout();

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Document card ${mode} verification passed`);
