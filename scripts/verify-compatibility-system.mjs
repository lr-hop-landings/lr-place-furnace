import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const expectedTitles = ["Печь", "Конструкции", "Маршрут"];
const expectedTexts = [
  "Модель, мощность, масса и направление выхода дымохода.",
  "Стены, пол, перекрытия, кровля, балки и стропила.",
  "Высота, конфигурация, обслуживание и внешний вид узла.",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function uniqueCoordinates(boxes, key) {
  return boxes.reduce((values, box) => {
    if (!values.some((value) => Math.abs(value - box[key]) <= 4)) values.push(box[key]);
    return values;
  }, []);
}

async function verifyStructure() {
  const component = await readFile("src/components/features/equipment-process-02.astro", "utf8");
  const page = await readFile("src/pages/index.astro", "utf8");

  check(component.includes('icon?: "stove" | "structure" | "route"'), "typed icon union is missing");
  check(component.includes("data-compatibility-system"), "compatibility marker is missing");
  check(component.includes('<ol class="equipment-process__items">'), "factors must use an OL");
  check(component.includes('<li class="equipment-process__item"'), "factors must use LI elements");
  check(component.includes('aria-hidden="true"'), "decorative icons must be hidden from assistive technology");
  check(component.includes('item.icon === "stove"'), "stove icon branch is missing");
  check(component.includes('item.icon === "structure"'), "structure icon branch is missing");
  check(component.includes('item.icon === "route"'), "route icon branch is missing");
  check((page.match(/"icon":\s+"(?:stove|structure|route)"/g) ?? []).length === 3, "Block8 must define three icons");
  check(page.includes('"icon":  "stove"') && page.includes('"icon":  "structure"') && page.includes('"icon":  "route"'), "Block8 icon values changed");
  check(/<Block8\s+\{\.\.\.blockProps\[5\]\}\s*\/>/.test(page), "Block8 wiring changed");
  check(page.includes("Печь, место и дымоход — единая система"), "eyebrow changed");
  check(page.includes("До сметы проверяем совместимость оборудования и дома"), "headline changed");
  for (const title of expectedTitles) check(page.includes(`"title":  "${title}"`), `title changed: ${title}`);
  for (const text of expectedTexts) check(page.includes(`"text":  "${text}"`), `text changed: ${text}`);
}

async function itemBoxes(page) {
  return page.locator('[data-compatibility-system] .equipment-process__item').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
}

async function openPage(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.locator("[data-compatibility-system]").waitFor({ state: "visible" });
  return page;
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", columns: 3 },
      { width: 768, height: 1000, name: "tablet", columns: 3 },
      { width: 390, height: 900, name: "mobile", columns: 1 },
    ]) {
      const page = await openPage(browser, viewport.width, viewport.height);
      const section = page.locator("[data-compatibility-system]");
      const list = section.locator(".equipment-process__items");
      const items = section.locator(".equipment-process__item");

      check((await section.locator("h2").count()) === 1, `${viewport.name}: section must contain one H2`);
      check((await list.evaluate((element) => element.tagName)) === "OL", `${viewport.name}: factors container must be OL`);
      check((await items.count()) === 3, `${viewport.name}: section must contain three factors`);
      check((await items.first().evaluate((element) => element.tagName)) === "LI", `${viewport.name}: factor must be LI`);
      check(JSON.stringify(await items.locator("h3").allTextContents()) === JSON.stringify(expectedTitles), `${viewport.name}: titles or order changed`);
      check(JSON.stringify(await items.locator(".equipment-process__copy p").allTextContents()) === JSON.stringify(expectedTexts), `${viewport.name}: copy changed`);
      check((await items.locator("svg").count()) === 3, `${viewport.name}: three icons are required`);
      check((await items.locator('svg[aria-hidden="true"]').count()) === 3, `${viewport.name}: icons must be aria-hidden`);
      check((await section.evaluate((element) => getComputedStyle(element).backgroundColor)) === "rgb(246, 244, 239)", `${viewport.name}: section must use the warm light background`);
      check(await section.evaluate((element) => element.previousElementSibling?.getAttribute("data-card-grid-variant") === "equipment-lineup"), `${viewport.name}: Block5 adjacency changed`);
      check(await section.evaluate((element) => element.nextElementSibling?.classList.contains("cases-emergency")), `${viewport.name}: Block10 adjacency changed`);

      const boxes = await itemBoxes(page);
      check(uniqueCoordinates(boxes, "x").length === viewport.columns, `${viewport.name}: incorrect column count`);
      check(uniqueCoordinates(boxes, "y").length === (viewport.columns === 1 ? 3 : 1), `${viewport.name}: incorrect row count`);
      const connector = await list.evaluate((element) => {
        const style = getComputedStyle(element, "::before");
        return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height), color: style.backgroundColor };
      });
      check(connector.color === "rgb(231, 101, 37)", `${viewport.name}: connector must use the accent color`);
      check(
        viewport.columns === 1 ? connector.height > connector.width : connector.width > connector.height,
        `${viewport.name}: connector orientation is incorrect`,
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);

      await section.screenshot({ path: `artifacts/compatibility-system-${viewport.name}.png` });
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

console.log(`Compatibility system ${mode} verification passed`);
