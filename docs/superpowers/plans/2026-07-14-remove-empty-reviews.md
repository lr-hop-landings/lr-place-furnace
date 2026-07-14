# Remove Empty Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the empty reviews section so the light document card leads directly into FAQ without publishing placeholder review content.

**Architecture:** Extend the existing section-removal regression before touching the page. Then remove Block15's import, empty data, render, and unused component while shifting FAQ and contact-form indexes once.

**Tech Stack:** Astro 7, Node.js verification scripts, Playwright, npm, Git.

## Global Constraints

- Do not add replacement reviews, fallback copy, CTA, or visual placeholders.
- Keep the content and styling of the document card, FAQ, and contact form unchanged.
- Preserve the order of all remaining sections.
- `.guarantee-certificate` must directly precede `.faq-accordion` at 1440 and 390 px.
- Start and manage the development server only with Astro background commands.

---

### Task 1: Define the empty-reviews removal regression

**Files:**
- Modify: `scripts/verify-section-removal.mjs:11-56`
- Modify: `scripts/verify-section-removal.mjs:88-107`

**Interfaces:**
- Consumes: `removedHeadlines`, `pathExists()`, and the existing desktop/mobile Playwright loop.
- Produces: source, filesystem, DOM adjacency, copy-removal, and overflow assertions that fail while Block15 remains.

- [ ] **Step 1: Add the removed headline and structural assertions**

Append the reviews headline to `removedHeadlines`:

```js
const removedHeadlines = [
  "Здесь рассчитываем установку готовой металлической печи",
  "Монтаж печи в деревянном, каркасном или каменном доме",
  "Из чего складывается расчёт установки",
  "Как проходит установка металлической печи",
  "Отзывы об установке металлических печей",
];
```

Add these checks to `verifyStructure()`:

```js
check(!page.includes('import Block15 from "../components/reviews/reviews-gallery-cards-01.astro"'), "Block15 import remains");
check(!/<Block15\b/.test(page), "Block15 render remains");
check(/<Block16\s+\{\.\.\.blockProps\[9\]\}\s*\/>/.test(page), "Block16 must consume blockProps[9]");
check(/<Block17\s+\{\.\.\.blockProps\[10\]\}\s*\/>/.test(page), "Block17 must consume blockProps[10]");
check(!(await pathExists("src/components/reviews/reviews-gallery-cards-01.astro")), "unused Block15 component remains");
```

Replace the previous Block17 assertion for `blockProps[11]` with the new `blockProps[10]` assertion above.

- [ ] **Step 2: Add DOM transition checks**

Inside the desktop/mobile loop in `verifyLayout()`, add:

```js
const documentCard = page.locator(".guarantee-certificate");
check(
  await documentCard.evaluate((element) => element.nextElementSibling?.classList.contains("faq-accordion")),
  `${viewport.name}: FAQ must immediately follow the document card`,
);
check((await page.locator(".review-cards").count()) === 0, `${viewport.name}: empty reviews block remains`);
```

After reading `bodyText`, add:

```js
check(!bodyText.includes("Без вымышленных цитат"), `${viewport.name}: review fallback copy remains`);
```

- [ ] **Step 3: Verify RED**

Run:

```powershell
npm run test:section-removal
```

Expected: FAIL for the reviews headline/data, Block15 import/render/component, old indexes, remaining `.review-cards`, fallback copy, and missing document-card → FAQ adjacency.

- [ ] **Step 4: Commit the failing regression**

```powershell
git add -- scripts/verify-section-removal.mjs
git commit -m "test: guard empty reviews removal"
```

---

### Task 2: Remove Block15 and verify the direct FAQ transition

**Files:**
- Modify: `src/pages/index.astro:12`
- Modify: `src/pages/index.astro:302-312`
- Modify: `src/pages/index.astro:402-405`
- Delete: `src/components/reviews/reviews-gallery-cards-01.astro`
- Test: `scripts/verify-section-removal.mjs`

**Interfaces:**
- Consumes: the failing assertions from Task 1 and unchanged Block14, Block16, and Block17 data.
- Produces: Block16 at `blockProps[9]`, Block17 at `blockProps[10]`, and direct `.guarantee-certificate` → `.faq-accordion` DOM adjacency.

- [ ] **Step 1: Remove the Block15 import and empty data object**

Delete this import:

```astro
import Block15 from "../components/reviews/reviews-gallery-cards-01.astro";
```

Delete this complete data object:

```js
{
  "headline": "Отзывы об установке металлических печей",
  "subline": "Публикуем только отзывы, которые можно подтвердить источником и согласованием автора.",
  "items": []
},
```

- [ ] **Step 2: Remove the render and shift later indexes**

Replace the final page render with:

```astro
<Block11 {...blockProps[7]} variant="qr-strip" showQr={false} />
<Block14 {...blockProps[8]} />
<Block16 {...blockProps[9]} />
<Block17 {...blockProps[10]} />
```

- [ ] **Step 3: Delete the unused component**

Delete `src/components/reviews/reviews-gallery-cards-01.astro` with `apply_patch`, then run:

```powershell
rg -n "Block15|reviews-gallery-cards-01|Отзывы об установке металлических печей|Без вымышленных цитат" src scripts
```

Expected: only intentional negative assertions and removed-copy entries in `scripts/verify-section-removal.mjs` remain.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:section-removal
npm run test:document-card -- all
```

Expected: both commands PASS on desktop and mobile.

- [ ] **Step 5: Run complete project verification**

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

- [ ] **Step 6: Restore unrelated screenshot noise and commit**

Restore only the known screenshots regenerated by unrelated test suites:

```powershell
git restore -- artifacts/compatibility-system-desktop.png artifacts/compatibility-system-mobile.png artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-mobile.png artifacts/hero-desktop.png artifacts/hero-mobile.png artifacts/installation-route-desktop.png artifacts/installation-route-mobile.png artifacts/quiz-inline-desktop.png artifacts/quiz-inline-mobile.png artifacts/quiz-modal-desktop.png artifacts/quiz-modal-mobile.png
git status --short
```

Expected: only the Block15 page/component deletion remains.

Commit:

```powershell
git add -- src/pages/index.astro src/components/reviews/reviews-gallery-cards-01.astro
git commit -m "refactor: remove empty reviews block"
```
