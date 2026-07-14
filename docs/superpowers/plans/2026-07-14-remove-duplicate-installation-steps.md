# Remove Duplicate Installation Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant six-step Block12 so the repeated social strip leads directly into the company responsibility section.

**Architecture:** Extend the existing section-removal regression script before changing production code. Then remove Block12's page wiring, data, and now-unused component while shifting the remaining `blockProps` indexes exactly once.

**Tech Stack:** Astro 7, TypeScript-style Astro props, Node.js verification scripts, Playwright, npm, Git.

## Global Constraints

- Do not add replacement content or redesign neighboring sections.
- Keep the content, visual style, and order of all remaining sections unchanged.
- Adjust `blockProps` indexes only where the deleted data object shifts later blocks.
- The second social strip must directly precede the company responsibility section on desktop and mobile.
- Start and manage the development server only with Astro background commands.

---

### Task 1: Define the Block12 removal regression

**Files:**
- Modify: `scripts/verify-section-removal.mjs:9-48`
- Modify: `scripts/verify-section-removal.mjs:78-96`

**Interfaces:**
- Consumes: the existing `removedHeadlines` array, `pathExists()` helper, and Playwright page used by `verifyLayout()`.
- Produces: source, filesystem, DOM adjacency, and responsive assertions that fail while Block12 still exists.

- [ ] **Step 1: Add the removed headline and source checks**

Add the Block12 headline to `removedHeadlines`:

```js
const removedHeadlines = [
  "Здесь рассчитываем установку готовой металлической печи",
  "Монтаж печи в деревянном, каркасном или каменном доме",
  "Из чего складывается расчёт установки",
  "Как проходит установка металлической печи",
];
```

Add these structural assertions inside `verifyStructure()` and update the shifted render indexes:

```js
check(!page.includes('import Block12 from "../components/steps/steps-numbered-grid-01.astro"'), "Block12 import remains");
check(!/<Block12\b/.test(page), "Block12 render remains");
check(!(await pathExists("src/components/steps/steps-numbered-grid-01.astro")), "unused Block12 component still exists");
check(/<Block13\s+\{\.\.\.blockProps\[8\]\}\s*\/>/.test(page), "Block13 must consume blockProps[8]");
check(/<Block17\s+\{\.\.\.blockProps\[12\]\}\s*\/>/.test(page), "Block17 must consume blockProps[12]");
```

Replace the old Block17 assertion for `blockProps[13]` with the new `blockProps[12]` assertion above.

- [ ] **Step 2: Add the DOM adjacency assertion**

Inside the viewport loop in `verifyLayout()`, add:

```js
const photoSocial = page.locator(".social-links-cards").nth(1);
check(
  await photoSocial.evaluate((element) => element.nextElementSibling?.classList.contains("company-proof")),
  `${viewport.name}: company proof must immediately follow the photo social strip`,
);
```

- [ ] **Step 3: Run the regression and verify RED**

Run:

```powershell
npm run test:section-removal
```

Expected: FAIL because the Block12 headline, import, render, component file, old indexes, and `.steps-grid` DOM section still exist.

- [ ] **Step 4: Commit the failing regression**

```powershell
git add -- scripts/verify-section-removal.mjs
git commit -m "test: guard duplicate steps removal"
```

---

### Task 2: Remove Block12 and verify the page transition

**Files:**
- Modify: `src/pages/index.astro:11`
- Modify: `src/pages/index.astro:279-318`
- Modify: `src/pages/index.astro:458-463`
- Delete: `src/components/steps/steps-numbered-grid-01.astro`
- Verify: `scripts/verify-section-removal.mjs`

**Interfaces:**
- Consumes: the failing assertions from Task 1 and the unchanged `blockProps` data for Blocks 1–11 and 13–17.
- Produces: a page with no Block12 where Block13–Block17 consume `blockProps[8]` through `blockProps[12]`.

- [ ] **Step 1: Remove the Block12 import**

Delete:

```astro
import Block12 from "../components/steps/steps-numbered-grid-01.astro";
```

- [ ] **Step 2: Remove the six-step data object**

Delete the complete object whose headline is `Как проходит установка металлической печи`, including its `subline` and six `items`. Leave the preceding social data object and following `Ответственность компании` data object unchanged.

- [ ] **Step 3: Remove the render and shift later indexes**

Replace the tail of the page render with:

```astro
<Block11 {...blockProps[7]} variant="qr-strip" showQr={false} />
<Block13 {...blockProps[8]} />
<Block14 {...blockProps[9]} />
<Block15 {...blockProps[10]} />
<Block16 {...blockProps[11]} />
<Block17 {...blockProps[12]} />
```

- [ ] **Step 4: Delete the unused component**

Delete `src/components/steps/steps-numbered-grid-01.astro`. Confirm no remaining references:

```powershell
rg -n "Block12|steps-numbered-grid-01|Как проходит установка металлической печи" src scripts
```

Expected: only the intentional negative assertions in `scripts/verify-section-removal.mjs` may mention the removed identifiers or headline.

- [ ] **Step 5: Run the targeted regression and verify GREEN**

Run:

```powershell
npm run test:section-removal
```

Expected: PASS for structure and both 1440px/390px layouts, including direct `.social-links-cards` → `.company-proof` adjacency.

- [ ] **Step 6: Run related and full verification**

Run:

```powershell
npm run test:social-qr
npm run test:case-slider
npm run test:hero
npm run test:quiz
npm run test:installation-route
npm run test:equipment-lineup
npm run test:compatibility-system
npm run check
npm run build
git diff --check
npx graphify hook-rebuild
```

Expected: every project test passes; `astro check` reports 0 errors, 0 warnings, and 0 hints; the production build emits both routes; `git diff --check` reports no whitespace errors. If the locally configured Graphify executable remains unavailable, record the exact npm error without installing an unrelated package.

- [ ] **Step 7: Commit the implementation**

```powershell
git add -- src/pages/index.astro src/components/steps/steps-numbered-grid-01.astro
git commit -m "refactor: remove duplicate installation steps"
```
