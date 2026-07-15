# Compatibility SVG Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three schematic pictograms in the compatibility block with the approved detailed “Engineering drawing” SVG set.

**Architecture:** Keep the existing `icon` union and conditional inline-SVG branches in the Astro component. Replace only the SVG geometry and add scoped base/accent classes so all three icons share one visual system without new files, dependencies, or runtime code.

**Tech Stack:** Astro 7, inline SVG, scoped CSS, existing Node verification script, Playwright for visual QA.

## Global Constraints

- Modify only `src/components/features/equipment-process-02.astro`.
- Preserve `icon?: "stove" | "structure" | "route"` and all existing component props.
- Preserve all copy, card layout, numbering, connector, responsive breakpoints, and section order.
- Use `viewBox="0 0 72 72"`, a `1.8` dark-blue base stroke, and `#e76525`/`--color-accent` only for small control marks.
- Keep each SVG decorative with `aria-hidden="true"` and `focusable="false"`.
- Add no libraries, external icon packages, raster images, or JavaScript animation.
- Do not stage, rewrite, or revert the user’s existing changes in `src/components/features/features-grid-icon-01.astro`, `src/components/features/materials-card-grid-01.astro`, `src/pages/index.astro`, or `src/pages/ustanovka-metallicheskih-pechey/index.astro`.

---

### Task 1: Replace the compatibility pictograms with the approved SVG set

**Files:**

- Modify: `src/components/features/equipment-process-02.astro:37-52`
- Modify: `src/components/features/equipment-process-02.astro:156-165`
- Verify: `scripts/verify-compatibility-system.mjs`
- Visual outputs: `artifacts/compatibility-system-desktop.png`, `artifacts/compatibility-system-tablet.png`, `artifacts/compatibility-system-mobile.png`

**Interfaces:**

- Consumes: `Item.icon?: "stove" | "structure" | "route"` and the current conditional rendering branches.
- Produces: three inline SVGs using `equipment-process__icon-base`, `equipment-process__icon-accent`, and `viewBox="0 0 72 72"`.
- Preserves: the existing `.equipment-process__icon` responsive container and all public component props.

- [ ] **Step 1: Run a failing static contract for the approved icon system**

Run:

```powershell
node -e "const fs=require('fs');const s=fs.readFileSync('src/components/features/equipment-process-02.astro','utf8');const n=(s.match(/viewBox=\"0 0 72 72\"/g)||[]).length;if(n!==3)throw new Error('three 72-grid SVGs required');if(!s.includes('equipment-process__icon-accent'))throw new Error('accent geometry required');"
```

Expected: FAIL with `three 72-grid SVGs required` because the current pictograms use a `64×64` grid and have no dedicated accent geometry.

- [ ] **Step 2: Replace the three SVG branches**

Replace the SVG markup inside the existing `stove`, `structure`, and `route` branches with:

```astro
{item.icon === "stove" && (
  <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false">
    <g class="equipment-process__icon-base">
      <path d="M25 20h24v35H25z" />
      <path d="M29 15h16v5M33 15v-4h8v4" />
      <rect x="29.5" y="26" width="15" height="17" rx="1.5" />
      <path d="M32 29h10M25 49h24M29 55l-3 6M45 55l3 6" />
    </g>
    <path class="equipment-process__icon-accent" d="M18 27v17M15.5 29.5 18 27l2.5 2.5M15.5 41.5 18 44l2.5-2.5" />
    <circle class="equipment-process__icon-accent equipment-process__icon-accent--fill" cx="42" cy="48" r="1.5" />
  </svg>
)}
{item.icon === "structure" && (
  <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false">
    <g class="equipment-process__icon-base">
      <path d="M11 33 36 13l25 20v27H11z" />
      <path d="M18 27v33M54 27v33M11 43h50" />
      <path d="M24 60V43h24v17M30 43v17M42 43v17M18 52h6M48 52h6" />
    </g>
    <circle class="equipment-process__icon-accent equipment-process__icon-accent--fill" cx="36" cy="13" r="2" />
  </svg>
)}
{item.icon === "route" && (
  <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false">
    <g class="equipment-process__icon-base">
      <circle cx="14" cy="57" r="3" />
      <path d="M17 57h14V43h13V27h13V13" />
      <path d="m52 18 5-5-5-5M27 38l4 5-4 5" />
    </g>
    <path class="equipment-process__icon-accent" d="M22 57v-5M38 43v-5M51 27v-5" />
    <circle class="equipment-process__icon-accent equipment-process__icon-accent--fill" cx="31" cy="43" r="2" />
  </svg>
)}
```

- [ ] **Step 3: Add the shared base and accent SVG styles**

Replace the current stroke declarations on `.equipment-process__icon svg` and add the three scoped rules below:

```css
.equipment-process__icon svg {
  width: 64px;
  height: 64px;
  overflow: visible;
}

.equipment-process__icon-base,
.equipment-process__icon-accent {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.equipment-process__icon-base {
  stroke: currentColor;
  stroke-width: 1.8;
}

.equipment-process__icon-accent {
  stroke: var(--color-accent, #e76525);
  stroke-width: 1.8;
}

.equipment-process__icon-accent--fill {
  fill: var(--color-accent, #e76525);
}
```

Keep the existing tablet and mobile width/height overrides unchanged; they continue to resize the new `72×72` viewBox without changing geometry.

- [ ] **Step 4: Re-run the static contract**

Run:

```powershell
node -e "const fs=require('fs');const s=fs.readFileSync('src/components/features/equipment-process-02.astro','utf8');const n=(s.match(/viewBox=\"0 0 72 72\"/g)||[]).length;if(n!==3)throw new Error('three 72-grid SVGs required');if(!s.includes('equipment-process__icon-accent'))throw new Error('accent geometry required');"
```

Expected: PASS with exit code `0` and no output.

- [ ] **Step 5: Run the existing structural regression check**

Run:

```powershell
node scripts/verify-compatibility-system.mjs structure
```

Expected: `Compatibility system structure verification passed`.

- [ ] **Step 6: Run Astro validation and the production build**

Run:

```powershell
npm run check
npm run build
```

Expected: Astro reports no errors and the static production build completes successfully.

- [ ] **Step 7: Start the project server in the required background mode**

Run:

```powershell
npx astro dev --background
npx astro dev status
```

Expected: the Astro development server reports as running on its local URL.

- [ ] **Step 8: Visually verify the real block at three widths**

Open the root page and capture `[data-compatibility-system]` at `1440×1000`, `768×1000`, and `390×900`, saving the section screenshots as:

```text
artifacts/compatibility-system-desktop.png
artifacts/compatibility-system-tablet.png
artifacts/compatibility-system-mobile.png
```

At each viewport verify:

- exactly three visible SVG icons;
- equal optical weight and vertical alignment;
- dark-blue base geometry and small orange control marks;
- readable details at `48×48` on mobile;
- unchanged card text, numbering, connector, column count, and section spacing;
- no horizontal page overflow.

Expected: all checks pass. If any detail merges at mobile size, simplify only that detail while retaining the approved motif and repeat Steps 4-8.

- [ ] **Step 9: Rebuild the Graphify knowledge graph after the code edit**

Run:

```powershell
npx graphify hook-rebuild
```

Expected: rebuild completes and `.graphify/.graphify_runtime.json` records `"runtime": "typescript"`. Do not stage `.graphify/branch.json`, `.graphify/worktree.json`, `.graphify/needs_update`, or `.graphify/cache/`.

- [ ] **Step 10: Review and commit only the icon change**

Run:

```powershell
git diff --check -- src/components/features/equipment-process-02.astro
git diff -- src/components/features/equipment-process-02.astro
git add -- src/components/features/equipment-process-02.astro
git commit -m "feat: refine compatibility system icons"
```

Expected: the diff contains only the three SVG branches and their shared styles; the commit succeeds without staging unrelated user changes or generated screenshots.

