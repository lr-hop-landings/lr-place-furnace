import { chromium } from "playwright";
import { stat } from "node:fs/promises";
import sharp from "sharp";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "assets", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const assets = [
  "public/images/stoves/steel-stove.webp",
  "public/images/stoves/cast-iron-stove.webp",
  "public/images/stoves/fireplace-stove.webp",
  "public/images/stoves/long-burning-stove.webp",
];

const expectedTitles = ["Стальные печи", "Чугунные печи", "Печи-камины", "Длительного горения"];
const expectedAlts = [
  "Компактная стальная печь с прямоугольным корпусом и стеклянной дверцей",
  "Чугунная печь с литым корпусом и арочной стеклянной дверцей",
  "Металлическая печь-камин с широким панорамным стеклом",
  "Высокая металлическая печь длительного горения со скруглённым корпусом",
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
  const component = await import("node:fs/promises").then(({ readFile }) =>
    readFile("src/components/features/materials-card-grid-01.astro", "utf8"),
  );
  const page = await import("node:fs/promises").then(({ readFile }) => readFile("src/pages/index.astro", "utf8"));

  check(component.includes('variant?: "cards" | "equipment-lineup"'), "typed equipment-lineup variant is missing");
  check(component.includes('variant = "cards"'), "cards must remain the default variant");
  check(component.includes("card-grid--equipment-lineup"), "equipment-lineup section modifier is missing");
  check(component.includes("data-equipment-lineup"), "equipment-lineup marker is missing");
  check(component.includes('<ul class="card-grid__lineup">'), "equipment lineup must use a UL");
  check(component.includes("card-grid__lineup-number"), "catalogue numbers are missing");
  check(/<Block5\s+\{\.\.\.blockProps\[4\]\}\s+variant="equipment-lineup"\s*\/>/.test(page), "Block5 does not activate equipment-lineup");
  check(!/<Block7\b/.test(page), "removed Block7 must not render");
  for (const asset of assets) check(page.includes(`/${asset.replace("public/", "")}`), `page data is missing ${asset}`);
  for (const alt of expectedAlts) check(page.includes(alt), `page data is missing alt text: ${alt}`);
}

async function verifyAssets() {
  let totalSize = 0;
  for (const asset of assets) {
    try {
      const file = await stat(asset);
      totalSize += file.size;
      check(file.size <= 220 * 1024, `${asset} exceeds 220 KB: ${file.size} bytes`);
      const metadata = await sharp(asset).metadata();
      check(metadata.format === "webp", `${asset} must be WebP`);
      check(Boolean(metadata.width && metadata.height), `${asset} dimensions are unavailable`);
      if (metadata.width && metadata.height) {
        check(Math.abs(metadata.width / metadata.height - 0.8) <= 0.01, `${asset} must use a 4:5 ratio`);
      }
    } catch {
      check(false, `${asset} is missing or unreadable`);
    }
  }
  check(totalSize <= 880 * 1024, `render assets exceed 880 KB total: ${totalSize} bytes`);
}

let browser;

async function openPage(width, height) {
  browser ??= await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator('[data-card-grid-variant="equipment-lineup"]').waitFor({ state: "visible" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  return page;
}

async function itemBoxes(page) {
  return page.locator('[data-card-grid-variant="equipment-lineup"] .card-grid__lineup-item').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
}

async function checkLineupImagesLoaded(page, viewportLabel) {
  const states = await page
    .locator('[data-card-grid-variant="equipment-lineup"] img')
    .evaluateAll((images) => images.map((image) => image.complete && image.naturalWidth > 0));
  check(states.every(Boolean), `${viewportLabel} screenshot must wait for all lineup images`);
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
  const { mkdir } = await import("node:fs/promises");
  await mkdir("artifacts", { recursive: true });

  const desktop = await openPage(1440, 1000);
  const lineup = desktop.locator('[data-card-grid-variant="equipment-lineup"]');
  const items = lineup.locator(".card-grid__lineup-item");

  check((await lineup.locator("h2").count()) === 1, "Block5 must contain one H2");
  check((await lineup.locator(".card-grid__lineup").evaluate((element) => element.tagName)) === "UL", "lineup container must be UL");
  check((await items.count()) === 4, "lineup must render four items");
  check((await items.first().evaluate((element) => element.tagName)) === "LI", "lineup items must be LI");
  check((await lineup.locator(".swiper").count()) === 0, "Block5 must not contain Swiper markup");
  check((await lineup.locator(".glightbox").count()) === 0, "Block5 must not contain lightbox links");
  check((await lineup.locator(".card-grid__nav, .swiper-pagination").count()) === 0, "Block5 must not contain slider controls");

  const titles = await items.locator("h3").allTextContents();
  check(JSON.stringify(titles) === JSON.stringify(expectedTitles), "Block5 titles or order changed");
  const alts = await items.locator("img").evaluateAll((images) => images.map((image) => image.alt));
  check(JSON.stringify(alts) === JSON.stringify(expectedAlts), "Block5 alt text changed");
  const objectFits = await items.locator("img").evaluateAll((images) => images.map((image) => getComputedStyle(image).objectFit));
  check(objectFits.every((value) => value === "contain"), "all lineup renders must use object-fit contain");

  const desktopBoxes = await itemBoxes(desktop);
  check(uniqueCoordinates(desktopBoxes, "x").length === 4, "1440px lineup must have four columns");
  check(uniqueCoordinates(desktopBoxes, "y").length === 1, "1440px lineup must have one row");
  check((await lineup.evaluate((element) => getComputedStyle(element).backgroundColor)) === "rgb(11, 31, 51)", "Block5 must use the primary-dark background");

  await waitForLineupImages(desktop);
  await checkLineupImagesLoaded(desktop, "desktop");
  await lineup.screenshot({ path: "artifacts/equipment-lineup-desktop.png" });
  await desktop.close();

  const tablet = await openPage(768, 1000);
  const tabletBoxes = await itemBoxes(tablet);
  check(uniqueCoordinates(tabletBoxes, "x").length === 2, "768px lineup must have two columns");
  check(uniqueCoordinates(tabletBoxes, "y").length === 2, "768px lineup must have two rows");
  await waitForLineupImages(tablet);
  await checkLineupImagesLoaded(tablet, "tablet");
  await tablet.locator('[data-card-grid-variant="equipment-lineup"]').screenshot({ path: "artifacts/equipment-lineup-tablet.png" });
  await tablet.close();

  const mobile = await openPage(390, 900);
  const mobileItems = mobile.locator('[data-card-grid-variant="equipment-lineup"] .card-grid__lineup-item');
  const mobileBoxes = await itemBoxes(mobile);
  check(uniqueCoordinates(mobileBoxes, "x").length === 1, "390px lineup must have one column");
  check(uniqueCoordinates(mobileBoxes, "y").length === 4, "390px lineup must have four rows");
  const firstImage = await mobileItems.first().locator(".card-grid__lineup-visual").boundingBox();
  const firstCopy = await mobileItems.first().locator(".card-grid__lineup-body").boundingBox();
  check(firstImage && firstCopy && firstImage.x < firstCopy.x, "mobile render must remain left of its copy");
  check(firstImage && firstCopy && firstImage.width < firstCopy.width, "mobile copy must remain wider than its render");
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `390px page overflows horizontally by ${overflow}px`);
  await waitForLineupImages(mobile);
  await checkLineupImagesLoaded(mobile, "mobile");
  await mobile.locator('[data-card-grid-variant="equipment-lineup"]').screenshot({ path: "artifacts/equipment-lineup-mobile.png" });
  await mobile.close();
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "assets" || mode === "all") await verifyAssets();
if (mode === "layout" || mode === "all") await verifyLayout();

if (browser) await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Equipment lineup ${mode} verification passed`);
