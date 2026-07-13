# Social QR Strip Implementation Plan

> **For Codex:** Use the executing-plans workflow to complete each task in order. Follow test-driven development: write the structural verifier first, run it red, then implement the smallest change that makes it pass.

**Goal:** Restyle only the first social-links block as an icon-button and visible-QR strip on desktop, while hiding QR codes and stacking buttons on mobile without changing the later reuse of the component.

**Architecture:** Add a typed `variant` prop to the existing Astro component. Keep the current `cards` markup and styles as the default branch, and render a dedicated `qr-strip` branch for block 2. Pass `variant="qr-strip"` only from the first component invocation so the second invocation remains backwards-compatible.

**Tech Stack:** Astro 7, scoped component CSS, Node structural verifier, Playwright screenshots, Astro check/build.

---

## Task 1: Add a failing structural verifier

**Files:**

- Create: `scripts/verify-social-qr.mjs`
- Modify: `package.json`

### Step 1: Write the failing test

Create a Node verifier that reads `social-links-cards-01.astro` and `index.astro` and asserts:

- `Props` contains `variant?: "cards" | "qr-strip"`;
- the component exposes a `social-links-cards--qr-strip` modifier;
- the QR strip has dedicated button and QR link classes;
- a mobile media query hides the QR link below 768 px;
- only `Block2` receives `variant="qr-strip"`;
- `Block11` does not receive a variant and therefore keeps the default cards view;
- project QR URLs and social links are still present in page data.

Add `"test:social-qr": "node scripts/verify-social-qr.mjs"` to npm scripts.

### Step 2: Run the verifier to confirm RED

Run: `npm run test:social-qr`

Expected: FAIL because the `variant` prop and QR-strip markup do not exist yet.

### Step 3: Commit the test

```bash
git add scripts/verify-social-qr.mjs package.json
git commit -m "test: define social QR strip behavior"
```

## Task 2: Implement the QR-strip variant

**Files:**

- Modify: `src/components/contacts/social-links-cards-01.astro`
- Modify: `src/pages/index.astro`

### Step 1: Add the typed variant

Extend `Props` with `variant?: "cards" | "qr-strip"` and default it to `cards` during props destructuring.

### Step 2: Add title accent support without changing content data

In the `qr-strip` branch, split the supplied title so the final word «соцсетях» is rendered in an accent span. Keep the complete supplied title readable and do not introduce duplicate copy in `blockProps`.

### Step 3: Render the approved QR-strip structure

For `variant === "qr-strip"` render:

- centered header;
- three semantic articles;
- icon-only brand link with an accessible name;
- separate linked QR surface using the existing item URL and SVG QR source;
- width/height and lazy-loading attributes on QR images.

For the default branch preserve the existing card/details/meta structure.

### Step 4: Add isolated variant styles

Style the modifier so that:

- the section uses the current alternate cream surface and centered typography;
- cards are three equal columns capped near 240 px;
- brand bars are 48 px high with consistent icon sizing;
- QR surfaces are square, light, lightly bordered, and always visible at 768 px and above;
- below 768 px the layout is one column and the entire QR link is `display: none`;
- focus-visible states are clearly drawn;
- default `cards` styles remain unchanged.

### Step 5: Activate the variant for block 2 only

Change the page invocation to:

```astro
<Block2 {...blockProps[1]} variant="qr-strip" />
```

Leave `Block11` unchanged.

### Step 6: Run the focused verifier to confirm GREEN

Run: `npm run test:social-qr`

Expected: PASS.

### Step 7: Run static checks

Run: `npm run check`

Expected: 0 errors, 0 warnings, 0 hints.

### Step 8: Commit the implementation

```bash
git add src/components/contacts/social-links-cards-01.astro src/pages/index.astro
git commit -m "feat: add responsive social QR strip"
```

## Task 3: Visually verify desktop and mobile

**Files:**

- Create: `artifacts/social-qr-desktop.png`
- Create: `artifacts/social-qr-mobile.png`
- Modify if required: `src/components/contacts/social-links-cards-01.astro`

### Step 1: Check the background Astro server

Run: `npx astro dev status`

If it is stopped, run: `npx astro dev --background`

Use the URL reported by Astro rather than assuming a port.

### Step 2: Capture desktop view

Use Playwright at 1440 px wide, navigate to `/ustanovka-metallicheskih-pechey/`, wait for fonts/images, scroll block 2 into view, and save `artifacts/social-qr-desktop.png`.

Verify visually:

- centered title with orange final word;
- three even icon bars;
- three large, crisp QR codes;
- balanced spacing against the Hero above and quiz below.

### Step 3: Capture mobile view

Repeat at 390 px wide and save `artifacts/social-qr-mobile.png`.

Verify visually:

- QR links are absent;
- three bars stack vertically;
- no horizontal overflow;
- section spacing remains compact and readable.

### Step 4: Refine if needed

Make only variant-scoped CSS adjustments, rerun the focused verifier and static checks, and regenerate both screenshots.

### Step 5: Commit visual refinements and evidence

```bash
git add src/components/contacts/social-links-cards-01.astro artifacts/social-qr-desktop.png artifacts/social-qr-mobile.png
git commit -m "style: refine social QR strip"
```

## Task 4: Final verification and graph maintenance

**Files:**

- Modify if generated successfully: `.graphify/*`

### Step 1: Run all relevant project checks

Run:

```bash
npm run test:hero
npm run test:social-qr
npm run check
npm run build
```

Expected: all commands exit successfully.

### Step 2: Attempt the required graph refresh

Run: `npx graphify hook-rebuild`

If the configured Graphify runtime is still unavailable, record the exact failure without installing an unrelated npm package or committing incomplete graph artifacts.

### Step 3: Review the final diff and repository state

Run:

```bash
git diff HEAD~3 --check
git status --short
git log -4 --oneline
```

Expected: no uncommitted implementation changes and no whitespace errors.

### Step 4: Report for block-level approval

Provide the two screenshot paths, verification results, commit hashes, and any Graphify infrastructure warning. Wait for visual approval before starting block 3.
