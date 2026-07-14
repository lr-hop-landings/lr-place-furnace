# Equipment Lineup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Block 5 into a dark, responsive equipment lineup with four consistent local stove renders while preserving Block 7's existing card-slider behavior.

**Architecture:** Add an explicit `equipment-lineup` variant to the shared Astro component and activate it only for Block 5. Keep the default Swiper/lightbox branch intact for Block 7, store four optimized WebP renders in `public`, and use one Playwright/Sharp verifier for source contracts, assets, responsive geometry, accessibility, regression protection, and screenshots.

**Tech Stack:** Astro 7, scoped CSS, Node.js ESM, Playwright 1.60, Sharp 0.34 through Astro, OpenAI image generation, npm scripts, Git.

## Global Constraints

- Preserve Block 5's current headline, subline, item order, names, and full descriptions from `blockProps[4]`.
- Add four local, brand-neutral 4:5 product renders under `public/images/stoves/`; use no external runtime URLs.
- Keep all four renders visually consistent: three-quarter view, matching scale and light, dark studio background, restrained orange firebox glow, no people, interiors, logos, labels, or watermarks.
- Keep each final WebP at or below 220 KB and all four at or below 880 KB total.
- Activate `variant="equipment-lineup"` only on Block 5; Block 7 must remain the default `cards` variant with its current Swiper and lightbox markup.
- The lineup branch uses no Swiper classes, carousel navigation, pagination, lightbox links, client script, hover animation, or click affordance.
- Desktop at 1440 px shows four columns; tablet at 768 px shows 2×2; mobile at 390 px shows four horizontal rows with the render left and complete text right.
- Use one `<h2>`, one `<ul>`, four `<li>`, unique alt text, and decorative `aria-hidden` catalogue numbers 01–04.
- Start or manage the dev server only with `astro dev --background`, `astro dev status`, `astro dev logs`, and `astro dev stop`.
- After code changes, run `npx graphify hook-rebuild`; if the repository's known `could not determine executable to run` error repeats, record it without installing another graphify package.

---

## File Structure

- Create `scripts/verify-equipment-lineup.mjs`: source, asset, layout, accessibility, regression, and screenshot verification.
- Modify `package.json`: expose `test:equipment-lineup`.
- Create `public/images/stoves/steel-stove.webp`: compact welded-steel stove render.
- Create `public/images/stoves/cast-iron-stove.webp`: heavier cast-iron stove render.
- Create `public/images/stoves/fireplace-stove.webp`: wide-glass fireplace stove render.
- Create `public/images/stoves/long-burning-stove.webp`: tall rounded long-burning stove render.
- Modify `src/components/features/materials-card-grid-01.astro`: add the isolated `equipment-lineup` markup and styles while preserving the default branch.
- Modify `src/pages/index.astro`: add image paths/alt text to Block 5 and activate its variant; leave Block 7's call unchanged.
- Create `artifacts/equipment-lineup-desktop.png`: 1440 px Block 5 reference.
- Create `artifacts/equipment-lineup-tablet.png`: 768 px Block 5 reference.
- Create `artifacts/equipment-lineup-mobile.png`: 390 px Block 5 reference.
- Create `artifacts/materials-card-grid-block7-desktop.png`: default-variant regression reference.

### Task 1: Define the equipment-lineup verification contract

**Files:**
- Create: `scripts/verify-equipment-lineup.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the running page at `SITE_URL` or `http://127.0.0.1:4321`, route `/ustanovka-metallicheskih-pechey/`, the shared component source, and four WebP paths.
- Produces: `npm run test:equipment-lineup -- <structure|assets|layout|all>` and four PNG artifacts in layout mode.

- [ ] **Step 1: Add the npm command**

Add this entry to the existing `scripts` object in `package.json`:

```json
"test:equipment-lineup": "node scripts/verify-equipment-lineup.mjs all"
```

- [ ] **Step 2: Write the failing verifier**

Create `scripts/verify-equipment-lineup.mjs` with this complete content:

```js
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
  check(/<Block7\s+\{\.\.\.blockProps\[6\]\}\s*\/>/.test(page) && !/<Block7[^>]*variant=/.test(page), "Block7 must keep the default variant");
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

async function verifyLayout() {
  const { mkdir } = await import("node:fs/promises");
  await mkdir("artifacts", { recursive: true });

  const desktop = await openPage(1440, 1000);
  const lineup = desktop.locator('[data-card-grid-variant="equipment-lineup"]');
  const defaultGrid = desktop.locator('[data-card-grid-variant="cards"]');
  const items = lineup.locator(".card-grid__lineup-item");

  check((await lineup.locator("h2").count()) === 1, "Block5 must contain one H2");
  check((await lineup.locator(".card-grid__lineup").evaluate((element) => element.tagName)) === "UL", "lineup container must be UL");
  check((await items.count()) === 4, "lineup must render four items");
  check((await items.first().evaluate((element) => element.tagName)) === "LI", "lineup items must be LI");
  check((await lineup.locator(".swiper").count()) === 0, "Block5 must not contain Swiper markup");
  check((await lineup.locator(".glightbox").count()) === 0, "Block5 must not contain lightbox links");
  check((await lineup.locator(".card-grid__nav, .swiper-pagination").count()) === 0, "Block5 must not contain slider controls");
  check((await defaultGrid.locator(".card-grid__slider.swiper").count()) === 1, "Block7 lost its default Swiper container");
  check((await defaultGrid.locator(".card-grid__nav").count()) === 1, "Block7 lost its slider navigation");

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

  await lineup.screenshot({ path: "artifacts/equipment-lineup-desktop.png" });
  await defaultGrid.screenshot({ path: "artifacts/materials-card-grid-block7-desktop.png" });
  await desktop.close();

  const tablet = await openPage(768, 1000);
  const tabletBoxes = await itemBoxes(tablet);
  check(uniqueCoordinates(tabletBoxes, "x").length === 2, "768px lineup must have two columns");
  check(uniqueCoordinates(tabletBoxes, "y").length === 2, "768px lineup must have two rows");
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
```

- [ ] **Step 3: Run the structure test and verify the expected failure**

```powershell
npm run test:equipment-lineup -- structure
```

Expected: exit code 1 with failures including `typed equipment-lineup variant is missing`, `Block5 does not activate equipment-lineup`, and missing asset paths/alt text.

- [ ] **Step 4: Commit the failing contract**

```powershell
git add package.json scripts/verify-equipment-lineup.mjs
git commit -m "test: define equipment lineup behavior"
```

### Task 2: Generate and optimize the four stove renders

**Files:**
- Create: `public/images/stoves/steel-stove.webp`
- Create: `public/images/stoves/cast-iron-stove.webp`
- Create: `public/images/stoves/fireplace-stove.webp`
- Create: `public/images/stoves/long-burning-stove.webp`
- Test: `scripts/verify-equipment-lineup.mjs`

**Interfaces:**
- Consumes: the image-generation tool and the exact shared art direction below.
- Produces: four 960×1200 WebP files, each no larger than 220 KB, with matching background, camera, scale, and lighting.

- [ ] **Step 1: Load the required image-generation skill**

Read `C:/Users/User/.codex/skills/.system/imagegen/SKILL.md` completely before calling the image-generation tool. Use the tool for generation and edits; do not synthesize or edit these product images with Python.

- [ ] **Step 2: Generate the steel stove source image**

Use this prompt without adding brand references:

```text
Photorealistic premium studio product render of one compact freestanding welded-steel wood-burning stove, full object visible from chimney collar to slim metal feet, rectangular matte black steel body, clean rectangular glass firebox door, subtle realistic warm orange ember glow behind the glass, three-quarter front view from slightly above, centered with generous empty space, dark navy-to-charcoal seamless studio background, soft controlled rim light from upper left, restrained industrial mood, realistic metal materials, no room or interior, no floor props, no people, no logos, no text, no labels, no watermark. Vertical 4:5 composition. This is one member of a consistent four-image equipment catalogue.
```

Copy the accepted local file from the image tool's returned `output_hint` to `C:/Users/User/AppData/Local/Temp/lr-furnace-steel-stove.png`, then inspect that exact staging file with `view_image`. Reject and regenerate if the stove is cropped, branded, contains text, or lacks a readable steel rectangular body.

- [ ] **Step 3: Generate the cast-iron stove source image**

Use the accepted steel render as the visual reference and this prompt:

```text
Create the second image in the exact same photorealistic studio catalogue style, camera angle, scale, background, and lighting as the reference. One heavy freestanding cast-iron wood stove, full object visible from chimney collar to feet, matte black cast body with subtle ribs and a substantial frame, arched or softly rounded glass firebox door, restrained warm orange ember glow, three-quarter front view from slightly above, centered with generous empty space, dark navy-to-charcoal seamless studio background, realistic cast-metal texture. No room, no props, no people, no logos, no text, no labels, no watermark. Vertical 4:5 composition.
```

Copy the accepted result to `C:/Users/User/AppData/Local/Temp/lr-furnace-cast-iron-stove.png`. Inspect it and reject it if it cannot be visually distinguished from the steel stove.

- [ ] **Step 4: Generate the fireplace stove source image**

Use an accepted prior render as the visual reference and this prompt:

```text
Create the third image in the exact same photorealistic studio catalogue style, camera angle, scale, background, and lighting as the reference. One freestanding metal fireplace stove with a noticeably wider low rectangular body and broad panoramic glass firebox window, full object visible including chimney collar and feet, matte black metal, restrained warm orange ember glow across the wide glass, three-quarter front view from slightly above, centered with generous empty space, dark navy-to-charcoal seamless studio background, realistic metal and glass. No room, no props, no people, no logos, no text, no labels, no watermark. Vertical 4:5 composition.
```

Copy the accepted result to `C:/Users/User/AppData/Local/Temp/lr-furnace-fireplace-stove.png`. Inspect it and reject it if the panoramic window and wider body are not immediately clear.

- [ ] **Step 5: Generate the long-burning stove source image**

Use an accepted prior render as the visual reference and this prompt:

```text
Create the fourth image in the exact same photorealistic studio catalogue style, camera angle, scale, background, and lighting as the reference. One tall freestanding long-burning metal stove with an elongated vertical body and distinctly rounded or cylindrical side surfaces, full object visible including top chimney collar and feet, matte charcoal-black metal, compact glass door with restrained warm orange ember glow, three-quarter front view from slightly above, centered with generous empty space, dark navy-to-charcoal seamless studio background, realistic metal. No room, no props, no people, no logos, no text, no labels, no watermark. Vertical 4:5 composition.
```

Copy the accepted result to `C:/Users/User/AppData/Local/Temp/lr-furnace-long-burning-stove.png`. Inspect it and reject it if the tall rounded silhouette is not distinct from the other three types.

- [ ] **Step 6: Convert the accepted sources to deterministic WebP assets**

Create the destination directory:

```powershell
New-Item -ItemType Directory -Force 'public/images/stoves' | Out-Null
```

Run these four deterministic conversions:

```powershell
node --input-type=module -e "import sharp from 'sharp'; await sharp('C:/Users/User/AppData/Local/Temp/lr-furnace-steel-stove.png').resize(960,1200,{fit:'cover',position:'center'}).webp({quality:82,effort:6}).toFile('public/images/stoves/steel-stove.webp')"
node --input-type=module -e "import sharp from 'sharp'; await sharp('C:/Users/User/AppData/Local/Temp/lr-furnace-cast-iron-stove.png').resize(960,1200,{fit:'cover',position:'center'}).webp({quality:82,effort:6}).toFile('public/images/stoves/cast-iron-stove.webp')"
node --input-type=module -e "import sharp from 'sharp'; await sharp('C:/Users/User/AppData/Local/Temp/lr-furnace-fireplace-stove.png').resize(960,1200,{fit:'cover',position:'center'}).webp({quality:82,effort:6}).toFile('public/images/stoves/fireplace-stove.webp')"
node --input-type=module -e "import sharp from 'sharp'; await sharp('C:/Users/User/AppData/Local/Temp/lr-furnace-long-burning-stove.png').resize(960,1200,{fit:'cover',position:'center'}).webp({quality:82,effort:6}).toFile('public/images/stoves/long-burning-stove.webp')"
```

If any file exceeds 220 KB, rerun only its exact command with `quality:78` and the same input/output paths.

- [ ] **Step 7: Run the asset contract**

```powershell
npm run test:equipment-lineup -- assets
```

Expected: `Equipment lineup assets verification passed`.

- [ ] **Step 8: Inspect all final WebP files together**

Use `view_image` on all four WebP paths and confirm identical background family, camera height, object scale, and restrained glow. Confirm the silhouettes remain distinct according to the design spec.

- [ ] **Step 9: Commit the render assets**

```powershell
git add public/images/stoves/steel-stove.webp public/images/stoves/cast-iron-stove.webp public/images/stoves/fireplace-stove.webp public/images/stoves/long-burning-stove.webp
git commit -m "feat: add stove equipment renders"
```

### Task 3: Add the isolated component variant and Block 5 data

**Files:**
- Modify: `src/components/features/materials-card-grid-01.astro`
- Modify: `src/pages/index.astro`
- Test: `scripts/verify-equipment-lineup.mjs`

**Interfaces:**
- Consumes: `variant?: "cards" | "equipment-lineup"`, item `image`, and item `imageAlt`.
- Produces: `[data-card-grid-variant="equipment-lineup"]`, `[data-equipment-lineup]`, `.card-grid__lineup`, four `.card-grid__lineup-item` elements, and the unchanged default Swiper branch.

- [ ] **Step 1: Extend the shared component's types and props**

Replace the component frontmatter with:

```astro
---
interface Item {
  name: string;
  text: string;
  price?: string;
  image?: string;
  imageAlt?: string;
}

interface Props {
  headline: string;
  subline?: string;
  items: Item[];
  label?: string;
  variant?: "cards" | "equipment-lineup";
}

const { headline, subline, items, label = "Стоимость", variant = "cards" } = Astro.props;
const isEquipmentLineup = variant === "equipment-lineup";
---
```

- [ ] **Step 2: Replace the complete component markup before `<style>`**

Use this markup while keeping the existing style block for the next task:

```astro
<section
  class:list={["card-grid", { "card-grid--equipment-lineup": isEquipmentLineup }]}
  data-card-grid-variant={variant}
  data-equipment-lineup={isEquipmentLineup ? "" : undefined}
>
  <div class="card-grid__inner">
    <header class="card-grid__header">
      {isEquipmentLineup && <p class="card-grid__eyebrow">Готовые металлические печи</p>}
      <h2>{headline}</h2>
      {subline && <p class="card-grid__subline">{subline}</p>}
    </header>

    {isEquipmentLineup ? (
      <ul class="card-grid__lineup">
        {items.map((item, index) => (
          <li class="card-grid__lineup-item">
            <div class="card-grid__lineup-visual">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.imageAlt ?? item.name}
                  width="960"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div class="card-grid__lineup-body">
              <span class="card-grid__lineup-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <div
        class="card-grid__slider swiper"
        data-swiper-options='{"slidesPerView":1,"spaceBetween":20,"breakpoints":{"680":{"slidesPerView":2},"1040":{"slidesPerView":3}}}'
      >
        <div class="card-grid__items swiper-wrapper">
          {items.map((item) => (
            <article class="card-grid__card swiper-slide">
              {item.image ? (
                <a class="card-grid__image glightbox" href={item.image} data-gallery="card-grid" data-title={item.name}>
                  <img src={item.image} alt={item.imageAlt ?? item.name} loading="lazy" />
                </a>
              ) : (
                <div class="card-grid__image" aria-label="Плейсхолдер изображения">
                  <div class="card-grid__image-placeholder"></div>
                </div>
              )}
              <div class="card-grid__body">
                <h3>{item.name}</h3>
                <p>{item.text}</p>
                {item.price && (
                  <div class="card-grid__footer">
                    <span>{label}</span>
                    <strong>{item.price}</strong>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        <div class="card-grid__nav" aria-label="Card slider controls">
          <button class="swiper-button-prev" type="button" aria-label="Предыдущая карточка">Назад</button>
          <button class="swiper-button-next" type="button" aria-label="Следующая карточка">Вперед</button>
        </div>
        <div class="swiper-pagination"></div>
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 3: Add Block 5 image paths and exact alt text**

In `blockProps[4].items`, add these fields to the corresponding four objects without changing their existing `name` or `text`:

```js
{
  "name": "Стальные печи",
  "text": "Уточняем мощность, массу и выход дымового патрубка.",
  "image": "/images/stoves/steel-stove.webp",
  "imageAlt": "Компактная стальная печь с прямоугольным корпусом и стеклянной дверцей"
},
{
  "name": "Чугунные печи",
  "text": "Учитываем массу оборудования и требования к основанию.",
  "image": "/images/stoves/cast-iron-stove.webp",
  "imageAlt": "Чугунная печь с литым корпусом и арочной стеклянной дверцей"
},
{
  "name": "Печи-камины",
  "text": "Согласуем технический узел и композицию в интерьере.",
  "image": "/images/stoves/fireplace-stove.webp",
  "imageAlt": "Металлическая печь-камин с широким панорамным стеклом"
},
{
  "name": "Длительного горения",
  "text": "Проверяем требования производителя к монтажу и дымоходу.",
  "image": "/images/stoves/long-burning-stove.webp",
  "imageAlt": "Высокая металлическая печь длительного горения со скруглённым корпусом"
}
```

- [ ] **Step 4: Activate the variant only on Block 5**

Change the Block 5 call to:

```astro
<Block5 {...blockProps[4]} variant="equipment-lineup" />
```

Keep Block 7 exactly:

```astro
<Block7 {...blockProps[6]} />
```

- [ ] **Step 5: Run the structure and asset contracts**

```powershell
npm run test:equipment-lineup -- structure
npm run test:equipment-lineup -- assets
```

Expected: both modes pass.

- [ ] **Step 6: Run Astro validation**

```powershell
npm run check
```

Expected: zero errors, warnings, and hints.

- [ ] **Step 7: Commit the variant and data wiring**

```powershell
git add src/components/features/materials-card-grid-01.astro src/pages/index.astro
git commit -m "feat: add equipment lineup variant"
```

### Task 4: Implement the approved responsive visual system

**Files:**
- Modify: `src/components/features/materials-card-grid-01.astro`
- Create: `artifacts/equipment-lineup-desktop.png`
- Create: `artifacts/equipment-lineup-tablet.png`
- Create: `artifacts/equipment-lineup-mobile.png`
- Create: `artifacts/materials-card-grid-block7-desktop.png`
- Test: `scripts/verify-equipment-lineup.mjs`

**Interfaces:**
- Consumes: the variant markup and four optimized WebP assets from Tasks 2–3.
- Produces: a 4×1 dark lineup, 2×2 tablet grid, four mobile media rows, and an unchanged default card slider.

- [ ] **Step 1: Preserve the default styles and append the lineup styles**

Append the following CSS immediately before the current closing `</style>` in `materials-card-grid-01.astro`:

```css
  .card-grid--equipment-lineup {
    color: var(--color-white, #ffffff);
    background: var(--color-primary-dark, #0b1f33);
  }

  .card-grid--equipment-lineup .card-grid__header {
    max-width: 820px;
    margin-bottom: 0;
  }

  .card-grid__eyebrow {
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    margin: 0 0 var(--space-4, 16px);
    color: var(--color-accent, #e76525);
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-xs, 12px);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .card-grid__eyebrow::before {
    width: 28px;
    height: 2px;
    flex: 0 0 auto;
    background: currentColor;
    content: "";
  }

  .card-grid--equipment-lineup h2 {
    color: var(--color-white, #ffffff);
    line-height: var(--leading-tight, 1.04);
    letter-spacing: -0.035em;
  }

  .card-grid--equipment-lineup .card-grid__subline {
    max-width: 700px;
    margin-top: var(--space-4, 16px);
    color: rgb(255 255 255 / 70%);
    line-height: var(--leading-relaxed, 1.65);
  }

  .card-grid__lineup {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 56px 0 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 16%);
    border-radius: var(--radius-card, 24px);
    background:
      linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
      linear-gradient(90deg, rgb(255 255 255 / 5%) 1px, transparent 1px),
      linear-gradient(145deg, #153a54, #0b263a);
    background-size: 32px 32px, 32px 32px, auto;
    list-style: none;
  }

  .card-grid__lineup-item {
    min-width: 0;
    border-right: 1px solid rgb(255 255 255 / 14%);
  }

  .card-grid__lineup-item:last-child {
    border-right: 0;
  }

  .card-grid__lineup-visual {
    height: clamp(240px, 22vw, 310px);
    padding: 20px 18px 0;
    border-bottom: 1px solid rgb(255 255 255 / 28%);
  }

  .card-grid__lineup-visual img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  .card-grid__lineup-body {
    padding: var(--space-5, 20px) var(--space-5, 20px) var(--space-6, 24px);
  }

  .card-grid__lineup-number {
    display: block;
    margin-bottom: var(--space-3, 12px);
    color: var(--color-accent, #e76525);
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-xs, 12px);
    font-weight: 800;
  }

  .card-grid--equipment-lineup .card-grid__lineup h3 {
    margin: 0 0 var(--space-3, 12px);
    color: var(--color-white, #ffffff);
    font-size: var(--text-lg, 18px);
    line-height: 1.2;
  }

  .card-grid__lineup-body p {
    margin: 0;
    color: rgb(255 255 255 / 68%);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-sm, 14px);
    line-height: 1.55;
  }

  @media (max-width: 1023px) {
    .card-grid__lineup {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .card-grid__lineup-item:nth-child(2) {
      border-right: 0;
    }

    .card-grid__lineup-item:nth-child(-n + 2) {
      border-bottom: 1px solid rgb(255 255 255 / 14%);
    }

    .card-grid__lineup-visual {
      height: 300px;
    }
  }

  @media (max-width: 640px) {
    .card-grid__eyebrow {
      margin-bottom: var(--space-3, 12px);
      font-size: 0.68rem;
    }

    .card-grid--equipment-lineup h2 {
      font-size: clamp(2rem, 10vw, 2.55rem);
    }

    .card-grid--equipment-lineup .card-grid__subline {
      font-size: var(--text-base, 16px);
      line-height: 1.6;
    }

    .card-grid__lineup {
      grid-template-columns: 1fr;
      gap: var(--space-3, 12px);
      margin-top: 40px;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: none;
    }

    .card-grid__lineup-item,
    .card-grid__lineup-item:nth-child(2),
    .card-grid__lineup-item:nth-child(-n + 2),
    .card-grid__lineup-item:last-child {
      display: grid;
      grid-template-columns: minmax(104px, 34%) minmax(0, 1fr);
      min-height: 148px;
      overflow: hidden;
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 16px;
      background: rgb(255 255 255 / 5%);
    }

    .card-grid__lineup-visual {
      height: 100%;
      min-height: 148px;
      padding: 8px;
      border-right: 1px solid rgb(255 255 255 / 12%);
      border-bottom: 0;
      background: linear-gradient(145deg, #183e58, #0b283b);
    }

    .card-grid__lineup-body {
      align-self: center;
      padding: var(--space-4, 16px);
    }

    .card-grid__lineup-number {
      margin-bottom: var(--space-2, 8px);
      font-size: 0.66rem;
    }

    .card-grid--equipment-lineup .card-grid__lineup h3 {
      margin-bottom: var(--space-2, 8px);
      font-size: 1rem;
    }

    .card-grid__lineup-body p {
      font-size: 0.78rem;
      line-height: 1.5;
    }
  }
```

- [ ] **Step 2: Confirm the background server and run the complete feature test**

```powershell
npx astro dev status
```

If no server is running, start exactly:

```powershell
npx astro dev --background --host 127.0.0.1 --port 4321
```

Then run:

```powershell
npm run test:equipment-lineup
```

Expected: `Equipment lineup all verification passed` and four PNG artifacts.

- [ ] **Step 3: Inspect all four generated artifacts**

- `artifacts/equipment-lineup-desktop.png`: four equal products on one scene, complete copy, consistent render scale, no card shadows.
- `artifacts/equipment-lineup-tablet.png`: 2×2 grid with correct divider edges and no clipping.
- `artifacts/equipment-lineup-mobile.png`: four horizontal media rows, full copy, readable titles, and no overflow.
- `artifacts/materials-card-grid-block7-desktop.png`: Block 7 retains its existing light card-slider composition and controls.

- [ ] **Step 4: Run Astro and production validation**

```powershell
npm run check
npm run build
```

Expected: zero Astro errors, warnings, and hints; production build completes with two pages.

- [ ] **Step 5: Commit the responsive styling and reviewed screenshots**

```powershell
git add src/components/features/materials-card-grid-01.astro artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-tablet.png artifacts/equipment-lineup-mobile.png artifacts/materials-card-grid-block7-desktop.png
git commit -m "style: add responsive equipment lineup"
```

### Task 5: Run full regression and graph maintenance

**Files:**
- Verify: Blocks 1–5, shared `materials-card-grid-01.astro`, Block 7 default variant, and the Astro build.
- Potentially generated by checks: tracked screenshot artifacts; restore only unrelated regenerated test noise.

**Interfaces:**
- Consumes: all commits from Tasks 1–4.
- Produces: evidence that Block 5 meets the spec and Blocks 1–4 plus Block 7 remain stable.

- [ ] **Step 1: Run all feature checks**

```powershell
npm run test:hero
npm run test:social-qr
npm run test:quiz
npm run test:installation-route
npm run test:equipment-lineup
```

Expected: all five commands pass. If older tests regenerate tracked screenshots without source changes, restore only those unrelated PNGs after confirming their diffs are test noise.

- [ ] **Step 2: Run final Astro checks**

```powershell
npm run check
npm run build
```

Expected: zero diagnostics and a successful two-page build.

- [ ] **Step 3: Rebuild graphify**

```powershell
npx graphify hook-rebuild
```

Expected in a healthy environment: success. If `npm error could not determine executable to run` repeats, do not install another package; record the warning in the handoff.

- [ ] **Step 4: Verify repository state and history**

```powershell
git status --short
git log -10 --oneline
```

Expected: no unintended modifications; the latest history contains the test, render, variant, and responsive-style commits for Block 5. Do not commit `.graphify/branch.json`, `.graphify/worktree.json`, `.graphify/needs_update`, or `.graphify/cache/`.
