import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const expectedTitles = [
  "Осмотр и замеры",
  "Основание",
  "Защита",
  "Установка печи",
  "Дымоход",
  "Кровельный выход",
  "Проверка тяги",
  "Первый запуск",
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
  const [component, page] = await Promise.all([
    readFile("src/components/features/features-grid-icon-01.astro", "utf8"),
    readFile("src/pages/index.astro", "utf8"),
  ]);

  check(component.includes("data-installation-route"), "route section marker is missing");
  check(component.includes('<ol class="features-grid__route">'), "steps must use an ordered list");
  check(component.includes("data-route-step={index + 1}"), "numbered route-step markers are missing");
  check(component.includes("features-grid__number"), "visible step numbers are missing");
  check(component.includes("index === 3 || index === 7"), "milestone steps 04 and 08 are not identified");
  check(!component.includes('<div class="features-grid__icon"'), "generic feature icon markup must be removed");
  check(!component.includes("<script>"), "installation route must not add client-side JavaScript");
  for (const title of expectedTitles) check(page.includes(title), `page data lost step: ${title}`);
}

let browser;

async function openPage(width, height) {
  browser ??= await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator("[data-installation-route]").waitFor({ state: "visible" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  return page;
}

async function routeBoxes(page) {
  return page.locator("[data-installation-route] [data-route-step]").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });

  const desktop = await openPage(1440, 1000);
  const routeList = desktop.locator("[data-installation-route] .features-grid__route");
  const items = routeList.locator(":scope > [data-route-step]");
  check((await routeList.evaluate((element) => element.tagName)) === "OL", "route container must render as OL");
  check((await items.count()) === 8, "route must render exactly eight LI steps");
  check((await items.first().evaluate((element) => element.tagName)) === "LI", "route steps must render as LI");

  const titleTexts = await items.locator("h3").allTextContents();
  check(JSON.stringify(titleTexts) === JSON.stringify(expectedTitles), "step titles or order changed");
  const numberTexts = await items.locator(".features-grid__number").allTextContents();
  check(JSON.stringify(numberTexts) === JSON.stringify(["01", "02", "03", "04", "05", "06", "07", "08"]), "visible numbering is incorrect");

  const desktopBoxes = await routeBoxes(desktop);
  check(uniqueCoordinates(desktopBoxes, "x").length === 4, "1440px route must have four columns");
  check(uniqueCoordinates(desktopBoxes, "y").length === 2, "1440px route must have two rows");

  const markerColors = await items.locator(".features-grid__number").evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );
  check(markerColors[3] === "rgb(231, 101, 37)", "step 04 must use the accent marker");
  check(markerColors[7] === "rgb(231, 101, 37)", "step 08 must use the accent marker");
  check(markerColors.filter((color) => color === "rgb(18, 58, 90)").length === 6, "six regular markers must use the primary color");

  await desktop.locator("[data-installation-route]").screenshot({ path: "artifacts/installation-route-desktop.png" });
  await desktop.close();

  const tablet = await openPage(768, 1000);
  const tabletBoxes = await routeBoxes(tablet);
  check(uniqueCoordinates(tabletBoxes, "x").length === 2, "768px route must have two columns");
  check(uniqueCoordinates(tabletBoxes, "y").length === 4, "768px route must have four rows");
  await tablet.locator("[data-installation-route]").screenshot({ path: "artifacts/installation-route-tablet.png" });
  await tablet.close();

  const mobile = await openPage(390, 900);
  const mobileBoxes = await routeBoxes(mobile);
  check(uniqueCoordinates(mobileBoxes, "x").length === 1, "390px route must have one column");
  check(mobileBoxes.every((box, index) => index === 0 || box.y > mobileBoxes[index - 1].y), "mobile steps must remain in ascending vertical order");
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `390px page overflows horizontally by ${overflow}px`);
  const verticalLine = await mobile.locator(".features-grid__route").evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { content: style.content, width: style.width };
  });
  check(verticalLine.content !== "none" && verticalLine.width === "2px", "mobile vertical route line is missing");
  await mobile.locator("[data-installation-route]").screenshot({ path: "artifacts/installation-route-mobile.png" });
  await mobile.close();
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "layout" || mode === "all") await verifyLayout();

if (browser) await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Installation route ${mode} verification passed`);
