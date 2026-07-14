# FAQ Accordion Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing 10-question FAQ more compact and visually legible while preserving its copy, order, native accordion behavior, and place before the final contact form.

**Architecture:** Add one source-and-browser regression script before implementation. Then change only the FAQ data's initial `open` flags and the scoped styles of the existing Astro component; retain native `details` / `summary`, allow multiple answers to remain open, and generate responsive visual artifacts at 1440, 768, and 390 px.

**Tech Stack:** Astro 7, scoped CSS, native HTML `details` / `summary`, Node.js verification scripts, Playwright 1.60, npm, Git.

## Global Constraints

- Preserve the existing headline, subline, all 10 questions and answers, and their order exactly.
- Keep FAQ between `.guarantee-certificate` and `.contact-card`.
- Only the first question is open on initial load; opening another question must not automatically close it.
- Keep one column at every viewport and a maximum inner width of 960 px.
- Use 88 px desktop, 72 px tablet, and 64 px mobile vertical section padding.
- Use a 5 px orange active stripe, 4 px desktop hard shadow, and 3 px mobile hard shadow.
- Keep every summary control at least 48 px tall and retain visible keyboard focus.
- Do not add client JavaScript, dependencies, categories, search, new copy, or changes to adjacent blocks and global tokens.
- Respect `prefers-reduced-motion` for the icon transition.
- Start and manage the development server only with Astro background commands.

---

### Task 1: Add the failing FAQ regression

**Files:**
- Create: `scripts/verify-faq.mjs`
- Modify: `package.json:15-17`

**Interfaces:**
- Consumes: `src/pages/index.astro`, `src/components/faq/faq-accordion-01.astro`, the running Astro route, and Playwright.
- Produces: `npm run test:faq -- structure|layout|all` and `artifacts/faq-{desktop,tablet,mobile}.png`.

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-faq.mjs` with:

```js
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];
const questions = [
  "Можно установить печь, которую я уже купил?",
  "Вы занимаетесь кирпичными печами?",
  "Можно поставить металлическую печь в деревянном доме?",
  "Что входит в монтаж под ключ?",
  "Сколько стоит установка?",
  "Сколько времени занимает монтаж?",
  "Можно подключиться к существующему дымоходу?",
  "Вы помогаете выбрать печь?",
  "Нужно заранее делать отверстие под дымоход?",
  "Как отправить фотографии?",
];
const answers = [
  "Да. Пришлите модель, инструкцию или фото шильдика и предполагаемого места.",
  "Да, это отдельное направление. Здесь рассчитывается установка готовых стальных и чугунных печей.",
  "Схема определяется после оценки печи, пола, стен, перекрытий, кровли и маршрута дымохода.",
  "Оценка места, подготовка основания и защиты, установка, дымоход, проходные узлы, проверка тяги, запуск, документы и инструктаж.",
  "Цена зависит от модели, дома, дымохода, проходов, кровли и подготовки места. Точный расчёт — после согласования схемы.",
  "Срок определяется после оценки объекта и фиксируется для конкретного заказа.",
  "Сначала нужно проверить его состояние, сечение, высоту, конфигурацию и совместимость с печью.",
  "Да. При подборе учитываются характеристики дома, режим использования, место и требования к дымоходу.",
  "Нет. Положение прохода определяют после согласования печи и маршрута дымохода.",
  "Через квиз или официальные каналы VK, Telegram и MAX.",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function verifyStructure() {
  const [pageSource, component] = await Promise.all([
    readFile("src/pages/index.astro", "utf8"),
    readFile("src/components/faq/faq-accordion-01.astro", "utf8"),
  ]);
  const faqStart = pageSource.indexOf('"headline":  "Частые вопросы об установке металлических печей"');
  const contactStart = pageSource.indexOf('"headline":  "Получите расчёт установки металлической печи"', faqStart);
  const faqData = pageSource.slice(faqStart, contactStart);

  check(faqStart >= 0 && contactStart > faqStart, "FAQ data block not found");
  check((faqData.match(/"q":/g) ?? []).length === 10, "FAQ must keep exactly 10 questions");
  check((faqData.match(/"open":\s+true/g) ?? []).length === 1, "exactly one FAQ item must be open initially");
  check(faqData.indexOf('"open":  true') > faqData.indexOf(questions[0]), "the first question must be the initially open item");
  check(/<details class="faq-accordion__item" open=\{item\.open\}>/.test(component), "native details rendering changed");
  check(component.includes(".faq-accordion__item[open]"), "open-card style is missing");
  check(component.includes("border-left-color: var(--color-accent"), "orange active stripe is missing");
  check(component.includes("width: min(100%, 960px)"), "FAQ max width must be 960px");
  check(component.includes(".faq-accordion summary:focus-visible"), "summary focus-visible style is missing");
  check(component.includes("@media (prefers-reduced-motion: reduce)"), "reduced-motion handling is missing");
  check(/<Block14\s+\{\.\.\.blockProps\[8\]\}\s*\/>\s*<Block16\s+\{\.\.\.blockProps\[9\]\}\s*\/>\s*<Block17\s+\{\.\.\.blockProps\[10\]\}\s*\/>/.test(pageSource), "FAQ must remain between document and contact blocks");
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", padding: 88, shadow: "4px" },
      { width: 768, height: 900, name: "tablet", padding: 72, shadow: "4px" },
      { width: 390, height: 900, name: "mobile", padding: 64, shadow: "3px" },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });

      const section = page.locator(".faq-accordion");
      const inner = section.locator(".faq-accordion__inner");
      const items = section.locator("details");
      const summaries = items.locator("summary");
      await section.waitFor({ state: "visible" });

      check((await items.count()) === 10, `${viewport.name}: expected 10 FAQ items`);
      check(JSON.stringify(await summaries.locator("span").allTextContents()) === JSON.stringify(questions), `${viewport.name}: question copy or order changed`);
      check(JSON.stringify((await section.locator(".faq-accordion__body").allTextContents()).map((text) => text.trim())) === JSON.stringify(answers), `${viewport.name}: answer copy or order changed`);
      check((await items.evaluateAll((elements) => elements.filter((element) => element.open).length)) === 1, `${viewport.name}: exactly one item must be open initially`);
      check(await items.first().evaluate((element) => element.open), `${viewport.name}: first item must be open initially`);

      const documentSection = page.locator(".guarantee-certificate");
      check(await documentSection.evaluate((element) => element.nextElementSibling?.classList.contains("faq-accordion")), `${viewport.name}: FAQ must follow document card`);
      check(await section.evaluate((element) => element.nextElementSibling?.classList.contains("contact-card")), `${viewport.name}: contact form must follow FAQ`);

      const [sectionStyle, innerBox, firstSummaryBox, firstItemStyle] = await Promise.all([
        section.evaluate((element) => getComputedStyle(element).paddingTop),
        inner.boundingBox(),
        summaries.first().boundingBox(),
        items.first().evaluate((element) => ({ borderLeftColor: getComputedStyle(element).borderLeftColor, boxShadow: getComputedStyle(element).boxShadow })),
      ]);
      check(sectionStyle === `${viewport.padding}px`, `${viewport.name}: expected ${viewport.padding}px vertical padding, received ${sectionStyle}`);
      check(Boolean(innerBox) && innerBox.width <= 961, `${viewport.name}: inner width exceeds 960px`);
      check(Boolean(firstSummaryBox) && firstSummaryBox.height >= 48, `${viewport.name}: summary target is shorter than 48px`);
      check(firstItemStyle.borderLeftColor === "rgb(231, 101, 37)", `${viewport.name}: open item lacks orange stripe`);
      check(firstItemStyle.boxShadow.includes(viewport.shadow), `${viewport.name}: hard shadow size is incorrect`);

      await summaries.nth(1).click();
      check(await items.first().evaluate((element) => element.open), `${viewport.name}: opening another answer closed the first one`);
      check(await items.nth(1).evaluate((element) => element.open), `${viewport.name}: second answer did not open`);
      await summaries.nth(1).click();

      await summaries.nth(1).press("Tab");
      const focusStyle = await summaries.nth(2).evaluate((element) => ({
        outlineStyle: getComputedStyle(element).outlineStyle,
        outlineWidth: getComputedStyle(element).outlineWidth,
      }));
      check(focusStyle.outlineStyle !== "none" && Number.parseFloat(focusStyle.outlineWidth) >= 3, `${viewport.name}: visible focus outline is missing`);

      await page.emulateMedia({ reducedMotion: "reduce" });
      const transitionProperty = await summaries.first().locator("i").evaluate((element) => getComputedStyle(element, "::after").transitionProperty);
      check(transitionProperty === "none", `${viewport.name}: icon transition remains under reduced motion`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.activeElement?.blur());
      await section.screenshot({ path: `artifacts/faq-${viewport.name}.png` });
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

console.log(`FAQ ${mode} verification passed`);
```

- [ ] **Step 2: Add the npm command**

Replace the final scripts entry with these two entries:

```json
"test:document-card": "node scripts/verify-document-card.mjs",
"test:faq": "node scripts/verify-faq.mjs"
```

- [ ] **Step 3: Verify RED**

Run:

```powershell
npm run test:faq -- structure
```

Expected: FAIL because three items are initially open and the refined active, focus, width, and reduced-motion styles do not exist yet.

- [ ] **Step 4: Commit the failing regression**

```powershell
git add -- package.json scripts/verify-faq.mjs
git commit -m "test: define compact faq behavior"
```

---

### Task 2: Implement and verify the compact FAQ

**Files:**
- Modify: `src/pages/index.astro:301-318`
- Modify: `src/components/faq/faq-accordion-01.astro:24-126`
- Create: `artifacts/faq-desktop.png`
- Create: `artifacts/faq-tablet.png`
- Create: `artifacts/faq-mobile.png`
- Test: `scripts/verify-faq.mjs`

**Interfaces:**
- Consumes: the unchanged `FaqItem` / `Props` API and failing regression from Task 1.
- Produces: one initially open native accordion item, a 960 px one-column layout, responsive spacing, explicit open/focus states, and reduced-motion support.

- [ ] **Step 1: Leave only the first item initially open**

In `src/pages/index.astro`, keep `"open": true` on the first question and delete the same property from the second and third question objects. Do not change any question or answer text.

- [ ] **Step 2: Replace the FAQ style block**

Replace the complete `<style>` block in `faq-accordion-01.astro` with:

```astro
<style>
  .faq-accordion {
    padding: 88px var(--space-4, 16px);
    background: var(--color-surface, #ffffff);
  }

  .faq-accordion__inner {
    width: min(100%, 960px);
    margin: 0 auto;
  }

  .faq-accordion__header {
    max-width: 760px;
    margin-bottom: 32px;
  }

  .faq-accordion h2 {
    margin: 0;
    color: var(--color-text, #111b24);
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-3xl, 44px);
    line-height: var(--leading-tight, 1.12);
  }

  .faq-accordion__header p {
    max-width: 680px;
    margin: var(--space-4, 16px) 0 0;
    color: var(--color-text-muted, #587086);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-lg, 18px);
    line-height: 1.6;
  }

  .faq-accordion__items {
    display: grid;
    gap: 14px;
  }

  .faq-accordion__item {
    overflow: hidden;
    border: 1px solid rgb(15 69 104 / 22%);
    border-left: 5px solid transparent;
    border-radius: var(--radius-card, 18px);
    background: var(--color-background, #f7f4ee);
    box-shadow: 4px 4px 0 var(--color-primary-dark, #0b1f33);
    transition: border-color 180ms ease, background-color 180ms ease;
  }

  .faq-accordion__item[open] {
    border-left-color: var(--color-accent, #e76525);
    background: #fff8f2;
  }

  .faq-accordion summary {
    display: flex;
    min-height: 68px;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4, 16px);
    padding: 18px 22px;
    border-radius: calc(var(--radius-card, 18px) - 2px);
    cursor: pointer;
    list-style: none;
    color: var(--color-text, #111b24);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-base, 16px);
    font-weight: var(--font-bold, 700);
    line-height: 1.45;
  }

  .faq-accordion summary::-webkit-details-marker {
    display: none;
  }

  .faq-accordion summary i {
    position: relative;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--color-accent, #e76525);
  }

  .faq-accordion summary i::before,
  .faq-accordion summary i::after {
    content: "";
    position: absolute;
    inset: 50% auto auto 50%;
    width: 14px;
    height: 2px;
    background: var(--color-white, #ffffff);
    transform: translate(-50%, -50%);
    transition: transform 180ms ease;
  }

  .faq-accordion summary i::after {
    transform: translate(-50%, -50%) rotate(90deg) scaleX(1);
  }

  .faq-accordion details[open] summary i::after {
    transform: translate(-50%, -50%) rotate(180deg) scaleX(0);
  }

  .faq-accordion__body {
    max-width: 760px;
    padding: 0 22px 22px;
    color: var(--color-text-muted, #587086);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-base, 16px);
    line-height: var(--leading-relaxed, 1.62);
  }

  .faq-accordion summary:focus-visible {
    outline: 3px solid var(--color-accent, #e76525);
    outline-offset: -4px;
  }

  @media (hover: hover) {
    .faq-accordion__item:hover {
      border-color: rgb(15 69 104 / 44%);
      border-left-color: var(--color-accent, #e76525);
    }
  }

  @media (max-width: 900px) {
    .faq-accordion {
      padding-top: 72px;
      padding-bottom: 72px;
    }
  }

  @media (max-width: 560px) {
    .faq-accordion {
      padding: 64px 16px;
    }

    .faq-accordion__header {
      margin-bottom: 24px;
    }

    .faq-accordion__header p {
      font-size: 16px;
    }

    .faq-accordion__items {
      gap: 12px;
    }

    .faq-accordion__item {
      border-radius: 14px;
      box-shadow: 3px 3px 0 var(--color-primary-dark, #0b1f33);
    }

    .faq-accordion summary {
      min-height: 64px;
      padding: 18px;
      border-radius: 12px;
    }

    .faq-accordion summary i {
      width: 32px;
      height: 32px;
    }

    .faq-accordion__body {
      padding: 0 18px 20px;
      font-size: 15px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .faq-accordion__item,
    .faq-accordion summary i::before,
    .faq-accordion summary i::after {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 3: Verify structural GREEN**

Run:

```powershell
npm run test:faq -- structure
```

Expected: `FAQ structure verification passed`.

- [ ] **Step 4: Run responsive verification and inspect artifacts**

Confirm the background server is available:

```powershell
npx astro dev status
```

If it is stopped, start it only with:

```powershell
npx astro dev --background
```

Run:

```powershell
npm run test:faq -- all
```

Expected: PASS and three screenshots at `artifacts/faq-{desktop,tablet,mobile}.png`.

Open all three PNG files. Confirm the single-column rhythm, one initially open answer, warm active card, 5 px orange stripe, intact compact dark-blue shadow, readable line lengths, unobstructed round controls, and clean transition into the dark contact section.

- [ ] **Step 5: Run full project verification**

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
npm run test:faq -- all
npm run check
npm run build
git diff --check
npx graphify hook-rebuild
```

Expected: all 10 project test commands pass; `astro check` reports 0 errors, 0 warnings, and 0 hints; the build emits both routes; `git diff --check` finds no whitespace errors. If Graphify remains unavailable, record the exact npm error without installing an unrelated package.

- [ ] **Step 6: Restore unrelated generated artifacts and commit**

Restore only the known screenshots regenerated by unrelated suites:

```powershell
git restore -- artifacts/compatibility-system-desktop.png artifacts/compatibility-system-mobile.png artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-mobile.png artifacts/hero-desktop.png artifacts/hero-mobile.png artifacts/installation-route-desktop.png artifacts/installation-route-mobile.png artifacts/quiz-inline-desktop.png artifacts/quiz-inline-mobile.png artifacts/quiz-modal-desktop.png artifacts/quiz-modal-mobile.png
git status --short
```

Expected: only `src/pages/index.astro`, `src/components/faq/faq-accordion-01.astro`, and the three new `artifacts/faq-*.png` files remain uncommitted.

Commit them:

```powershell
git add -- src/pages/index.astro src/components/faq/faq-accordion-01.astro artifacts/faq-desktop.png artifacts/faq-tablet.png artifacts/faq-mobile.png
git commit -m "style: refine responsive faq accordion"
```

- [ ] **Step 7: Re-run post-commit smoke verification**

Run:

```powershell
npm run test:faq -- all
npm run check
npm run build
git status --short --branch
```

Expected: FAQ verification, Astro check, and production build pass; the worktree is clean and `main` is ahead of `origin/main` by the new commits.
