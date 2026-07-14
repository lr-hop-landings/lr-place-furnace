# Light Document Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate dark company-proof block and turn the remaining light guarantee block into the single responsive document-card section.

**Architecture:** Add a dedicated source-and-browser regression script first. Then remove Block13 and its unused component, shift page data indexes, simplify Block14 to a semantic three-step document list, and finish with responsive styling verified at 1440, 768, and 390 px.

**Tech Stack:** Astro 7, scoped CSS, Node.js verification scripts, Playwright, npm, Git.

## Global Constraints

- Preserve the existing Block14 copy and CTA exactly.
- Remove Block13 and the service-only summary copy without adding replacement promises, documents, assets, or placeholders.
- The second social strip must directly precede `.guarantee-certificate`.
- Render the three document stages as `ol` and `li` in their current order.
- Keep the section responsive without horizontal overflow at 1440, 768, and 390 px.
- Start and manage the development server only with Astro background commands.

---

### Task 1: Add a failing document-card regression

**Files:**
- Create: `scripts/verify-document-card.mjs`
- Modify: `package.json:8-17`

**Interfaces:**
- Consumes: `src/pages/index.astro`, `src/components/guarantees/guarantee-certificate-01.astro`, the running Astro route, and Playwright.
- Produces: `npm run test:document-card -- structure|layout|all` plus three visual artifacts.

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-document-card.mjs` with:

```js
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
  check(/<Block17\s+\{\.\.\.blockProps\[11\]\}\s*\/>/.test(page), "Block17 must consume blockProps[11]");
  check(!page.includes('"summaryTitle"') && !page.includes('"summaryText"'), "service-only summary data remains");
  check(!component.includes("summaryTitle") && !component.includes("summaryText"), "summary API remains");
  check(!component.includes("guarantee-certificate__summary"), "summary markup or styles remain");
  check(component.includes('<ol class="guarantee-certificate__items">'), "document stages must use OL");
  check(component.includes('<li class="guarantee-certificate__item">'), "document stages must use LI");
  check(component.includes("guarantee-certificate__marker"), "number markers are missing");
  check(component.includes('padStart(2, "0")'), "markers must use 01/02/03 format");
  check(component.includes("aria-hidden=\"true\""), "decorative markers must be hidden from assistive technology");
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
```

- [ ] **Step 2: Add the npm command**

Replace the final scripts entry with these two entries:

```json
"test:case-slider": "node scripts/verify-case-slider.mjs all",
"test:document-card": "node scripts/verify-document-card.mjs"
```

- [ ] **Step 3: Verify RED**

Run:

```powershell
npm run test:document-card -- structure
```

Expected: FAIL for the remaining Block13 import/render/component, old indexes, summary API/data, non-list markup, missing markers, and missing focus selector.

- [ ] **Step 4: Commit the failing regression**

```powershell
git add -- package.json scripts/verify-document-card.mjs
git commit -m "test: define light document card behavior"
```

---

### Task 2: Remove Block13 and simplify Block14 semantics

**Files:**
- Modify: `src/pages/index.astro:11-12`
- Modify: `src/pages/index.astro:279-339`
- Modify: `src/pages/index.astro:427-432`
- Modify: `src/components/guarantees/guarantee-certificate-01.astro:1-72`
- Modify: `scripts/verify-section-removal.mjs:47-51`
- Delete: `src/components/trust-bar/trust-company-proof-02.astro`
- Test: `scripts/verify-document-card.mjs`

**Interfaces:**
- Consumes: the structural assertions and unchanged document-stage copy from Task 1.
- Produces: Block14 at `blockProps[8]`, Block17 at `blockProps[11]`, and a semantic three-item ordered list without summary props.

- [ ] **Step 1: Remove Block13 from the page**

Delete this import:

```astro
import Block13 from "../components/trust-bar/trust-company-proof-02.astro";
```

Delete this complete data object:

```js
{
  "eyebrow": "Ответственность компании",
  "headline": "Понятный заказ — от первой сметы до запуска",
  "description": "До начала работ согласуются схема, материалы и стоимость. После монтажа проверяется работа системы и передаются документы.",
  "proofs": [
    {
      "title": "Согласование",
      "text": "Схема и состав работ до начала монтажа."
    },
    {
      "title": "Контроль",
      "text": "Проверка тяги и первый запуск."
    },
    {
      "title": "Документы",
      "text": "Договор, смета и акт по согласованному заказу."
    }
  ],
  "ctaLabel": "Получить расчёт",
  "ctaHref": "#estimate-quiz",
  "phone": "+7 (812) 344-44-44"
},
```

Delete these two fields from the following Block14 object:

```js
"summaryTitle": "Нужны реальные образцы",
"summaryText": "Перед публикацией добавьте обезличенные документы без персональных данных.",
```

Remove `<Block13 {...blockProps[8]} />` and replace the remaining render tail with:

```astro
<Block11 {...blockProps[7]} variant="qr-strip" showQr={false} />
<Block14 {...blockProps[8]} />
<Block15 {...blockProps[9]} />
<Block16 {...blockProps[10]} />
<Block17 {...blockProps[11]} />
```

In `scripts/verify-section-removal.mjs`, replace the old Block13 and Block17 wiring assertions with:

```js
check(/<Block14\s+\{\.\.\.blockProps\[8\]\}\s*\/>/.test(page), "Block14 must consume blockProps[8]");
check(/<Block17\s+\{\.\.\.blockProps\[11\]\}\s*\/>/.test(page), "Block17 must consume blockProps[11]");
```

- [ ] **Step 2: Delete the unused Block13 component**

Delete `src/components/trust-bar/trust-company-proof-02.astro` with `apply_patch`.

- [ ] **Step 3: Remove the summary API and render semantic stages**

Remove `summaryTitle` and `summaryText` from `Props`, the `Astro.props` destructure, and the summary markup. Replace the items wrapper with:

```astro
<ol class="guarantee-certificate__items">
  {items.map((item, index) => (
    <li class="guarantee-certificate__item">
      <span class="guarantee-certificate__marker" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </li>
  ))}
</ol>
```

Remove every `.guarantee-certificate__summary` selector from the current style block so the source regression has no stale API or CSS.

- [ ] **Step 4: Verify structural GREEN**

Run:

```powershell
npm run test:document-card -- structure
npm run test:section-removal
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the structural change**

```powershell
git add -- src/pages/index.astro src/components/guarantees/guarantee-certificate-01.astro src/components/trust-bar/trust-company-proof-02.astro scripts/verify-section-removal.mjs
git commit -m "refactor: keep single document assurance block"
```

---

### Task 3: Style and verify the responsive document card

**Files:**
- Modify: `src/components/guarantees/guarantee-certificate-01.astro:55-190`
- Create: `artifacts/document-card-desktop.png`
- Create: `artifacts/document-card-tablet.png`
- Create: `artifacts/document-card-mobile.png`
- Test: `scripts/verify-document-card.mjs`

**Interfaces:**
- Consumes: `.guarantee-certificate__items`, `.guarantee-certificate__item`, `.guarantee-certificate__marker`, and `.guarantee-certificate__footer` from Task 2.
- Produces: a two-column desktop layout and one-column tablet/mobile layout with a full-width mobile CTA.

- [ ] **Step 1: Replace the component style block**

Replace the complete `<style>` block with:

```astro
<style>
  .guarantee-certificate {
    padding: clamp(72px, 8vw, 112px) var(--space-4, 16px);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #111b24);
  }

  .guarantee-certificate__inner {
    display: grid;
    grid-template-columns: minmax(0, 0.78fr) minmax(460px, 1.12fr);
    gap: clamp(48px, 7vw, 96px);
    align-items: center;
    width: min(100%, var(--container-width, 1180px));
    margin: 0 auto;
  }

  .guarantee-certificate__copy {
    max-width: 470px;
  }

  .guarantee-certificate__copy > p {
    margin: 0 0 14px;
    color: var(--color-primary, #0f4568);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-xs, 12px);
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .guarantee-certificate h2 {
    margin: 0;
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(36px, 4.5vw, 58px);
    line-height: 1.04;
    letter-spacing: -0.02em;
  }

  .guarantee-certificate__copy > span {
    display: block;
    margin-top: 22px;
    color: var(--color-text-muted, #587086);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-lg, 18px);
    line-height: 1.65;
  }

  .guarantee-certificate__card {
    position: relative;
    padding: clamp(32px, 4vw, 48px);
    border: 1px solid rgb(15 69 104 / 28%);
    border-radius: 18px;
    background: #f7f4ee;
    box-shadow: 10px 10px 0 var(--color-primary-dark, #0b1f33);
  }

  .guarantee-certificate__seal {
    position: absolute;
    top: 28px;
    right: 28px;
    display: grid;
    place-items: center;
    width: 62px;
    height: 62px;
    border: 1px solid currentColor;
    border-radius: 50%;
    color: var(--color-accent, #e85d2a);
    font-family: var(--font-heading, sans-serif);
    font-weight: 800;
  }

  .guarantee-certificate__items {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 68px 0 0;
    list-style: none;
  }

  .guarantee-certificate__item {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 18px;
    padding: 22px 0;
    border-top: 1px solid rgb(15 69 104 / 22%);
  }

  .guarantee-certificate__item:last-child {
    border-bottom: 1px solid rgb(15 69 104 / 22%);
  }

  .guarantee-certificate__marker {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--color-primary, #0f4568);
    color: #ffffff;
    font-family: var(--font-heading, sans-serif);
    font-size: 14px;
    font-weight: 800;
  }

  .guarantee-certificate h3 {
    margin: 1px 0 0;
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(19px, 2vw, 22px);
    line-height: 1.2;
  }

  .guarantee-certificate__item p {
    margin: 7px 0 0;
    color: var(--color-text-muted, #587086);
    font-family: var(--font-body, sans-serif);
    line-height: 1.6;
  }

  .guarantee-certificate__footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 18px;
    margin-top: 30px;
  }

  .guarantee-certificate__footer strong {
    display: block;
    font-family: var(--font-heading, sans-serif);
  }

  .guarantee-certificate__footer span {
    display: block;
    margin-top: 4px;
    color: var(--color-text-muted, #587086);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-sm, 14px);
  }

  .guarantee-certificate__footer a {
    display: inline-flex;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    border: 1px solid var(--color-primary, #0f4568);
    border-radius: 12px;
    background: var(--color-primary, #0f4568);
    color: #ffffff;
    font-family: var(--font-body, sans-serif);
    font-weight: 800;
    text-decoration: none;
  }

  .guarantee-certificate__footer a:hover {
    background: var(--color-primary-dark, #0b1f33);
  }

  .guarantee-certificate__footer a:focus-visible {
    outline: 3px solid var(--color-accent, #e85d2a);
    outline-offset: 3px;
  }

  @media (max-width: 860px) {
    .guarantee-certificate__inner {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .guarantee-certificate__copy {
      max-width: 620px;
    }
  }

  @media (max-width: 560px) {
    .guarantee-certificate {
      padding: 64px 16px 72px;
    }

    .guarantee-certificate__copy > span {
      font-size: 16px;
    }

    .guarantee-certificate__card {
      padding: 24px;
      border-radius: 14px;
      box-shadow: 6px 6px 0 var(--color-primary-dark, #0b1f33);
    }

    .guarantee-certificate__seal {
      top: 22px;
      right: 22px;
      width: 52px;
      height: 52px;
    }

    .guarantee-certificate__items {
      padding-top: 64px;
    }

    .guarantee-certificate__item {
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 14px;
      padding: 20px 0;
    }

    .guarantee-certificate__marker {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      font-size: 13px;
    }

    .guarantee-certificate__footer,
    .guarantee-certificate__footer a {
      width: 100%;
    }
  }
</style>
```

- [ ] **Step 2: Run layout verification**

Run:

```powershell
npm run test:document-card -- all
```

Expected: PASS and three screenshots at `artifacts/document-card-{desktop,tablet,mobile}.png`.

- [ ] **Step 3: Inspect all three screenshots**

Open each generated PNG. Confirm the heading/card hierarchy, `01/02/03` order, unobstructed `LR` seal, full-width mobile CTA, intact hard shadow, and direct transition from the preceding social strip.

- [ ] **Step 4: Run full project verification**

Run:

```powershell
npm run test:hero
npm run test:social-qr
npm run test:quiz
npm run test:installation-route
npm run test:equipment-lineup
npm run test:section-removal
npm run test:compatibility-system
npm run test:case-slider
npm run test:document-card -- all
npm run check
npm run build
git diff --check
npx graphify hook-rebuild
```

Expected: every project test passes; `astro check` reports 0 errors, 0 warnings, and 0 hints; the build emits both routes; `git diff --check` finds no whitespace errors. If Graphify remains unavailable, record the exact npm error without installing an unrelated package.

- [ ] **Step 5: Commit the visual implementation**

Restore only the known screenshot files regenerated by unrelated regression suites, then confirm that the intended document-card files remain:

```powershell
git restore -- artifacts/compatibility-system-desktop.png artifacts/compatibility-system-mobile.png artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-mobile.png artifacts/hero-desktop.png artifacts/hero-mobile.png artifacts/installation-route-desktop.png artifacts/installation-route-mobile.png artifacts/quiz-inline-desktop.png artifacts/quiz-inline-mobile.png artifacts/quiz-modal-desktop.png artifacts/quiz-modal-mobile.png
git status --short
```

Expected: only `src/components/guarantees/guarantee-certificate-01.astro` and the three new `artifacts/document-card-*.png` files remain uncommitted.

Commit them:

```powershell
git add -- src/components/guarantees/guarantee-certificate-01.astro artifacts/document-card-desktop.png artifacts/document-card-tablet.png artifacts/document-card-mobile.png
git commit -m "style: refine responsive document card"
```
