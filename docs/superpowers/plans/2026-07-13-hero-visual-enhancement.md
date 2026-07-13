# Hero Visual Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade block 01 into the approved warm engineering hero with a believable installation image, clear CTA hierarchy, responsive composition, and automated desktop/mobile checks.

**Architecture:** Keep the existing Astro component and props contract. Add one generated web image, pass it through the first `blockProps` entry, wrap the existing image/blueprint branches in one media shell, and render shared HTML callouts over either visual. A small Playwright script verifies content, accessibility-critical links, responsive order, overflow, and screenshots without introducing a test-runner dependency.

**Tech Stack:** Astro 7.0.7, component-scoped CSS, Playwright 1.60.0, Python Pillow for deterministic WebP conversion, existing GLightbox integration.

## Global Constraints

- Preserve the current warm off-white, deep blue, orange, and steel palette.
- Keep Manrope and the current calm, expert tone.
- Preserve the headline, accent, supporting copy, phone number, CTA target, and all four benefit facts.
- Retain the existing component API and its blueprint fallback.
- Use a generated photorealistic installation image as the primary visual.
- Desktop uses a two-column composition; mobile places the visual before the copy.
- Moderate composition changes are allowed; no content is removed.
- No new runtime dependency.
- Start the development server only with `npx astro dev --background`; manage it with `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop`.
- After modifying code, run `npx graphify hook-rebuild` and apply the repository Graphify portability rules before staging graph artifacts.

---

## File map

- Create `public/images/metal-stove-installation-hero.webp`: optimized 4:5 documentary-style hero image.
- Create `scripts/verify-hero.mjs`: focused browser verification and screenshot script.
- Modify `package.json`: add the `test:hero` command.
- Modify `src/pages/index.astro`: pass `imageSrc` and `imageAlt` in the first hero props object.
- Modify `src/components/hero/hero-visual-price-01.astro`: shared media shell, technical callouts, responsive visual styling, focus and reduced-motion states.
- Create `artifacts/hero-desktop.png`: reviewed 1440 × 1000 evidence screenshot.
- Create `artifacts/hero-mobile.png`: reviewed 390 × 844 evidence screenshot.

## Task 1: Add the generated visual and semantic hero contract

**Files:**

- Create: `public/images/metal-stove-installation-hero.webp`
- Create: `scripts/verify-hero.mjs`
- Modify: `package.json`
- Modify: `src/pages/index.astro`
- Modify: `src/components/hero/hero-visual-price-01.astro`

**Interfaces:**

- Consumes: existing `Props.imageSrc?: string`, `Props.imageAlt?: string`, `ctaHref`, `pills`, and the GLightbox class contract.
- Produces: `[data-hero-enhanced]`, `.hero-visual__media-shell`, `.hero-visual__callouts`, three `.hero-visual__callout` elements, and `/images/metal-stove-installation-hero.webp`.

- [ ] **Step 1: Add the content-first failing browser check**

Create `scripts/verify-hero.mjs` with this exact initial content:

```js
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const mode = process.argv[2] ?? "content";
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const browser = await chromium.launch({ headless: true });

async function openPage(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator(".hero-visual").waitFor({ state: "visible" });
  return page;
}

async function verifyContent() {
  const page = await openPage(1440, 1000);
  const hero = page.locator("[data-hero-enhanced]");
  check(await hero.count() === 1, "enhanced hero marker is missing");

  const cta = page.locator(".hero-visual__button");
  const phone = page.locator(".hero-visual__phone");
  const image = page.locator(".hero-visual__media img");
  const facts = page.locator(".hero-visual__pills li");
  const callouts = page.locator(".hero-visual__callout");
  const imageCount = await image.count();

  check(await cta.getAttribute("href") === "#estimate-quiz", "CTA target changed");
  check(await phone.getAttribute("href") === "tel:+78123444444", "phone target changed");
  check(await facts.count() === 4, "hero must keep all four benefit facts");
  check(await callouts.count() === 3, "hero must render three technical callouts");
  check(imageCount === 1, "generated hero image is missing");
  if (imageCount === 1) {
    check((await image.getAttribute("src")) === "/images/metal-stove-installation-hero.webp", "generated hero image is not wired");
    check((await image.getAttribute("alt")) === "Металлическая печь с защищённой стеной, основанием и стальным дымоходом", "hero image alt text changed");
  }
  check(await page.locator("h1").count() === 1, "page must keep exactly one h1");
  const componentSource = await readFile("src/components/hero/hero-visual-price-01.astro", "utf8");
  check(componentSource.includes("hero-visual__blueprint"), "blueprint fallback branch was removed");
  await page.close();
}

await verifyContent();

if (mode === "layout" || mode === "all") {
  throw new Error("layout checks are added in Task 2");
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Hero content verification passed");
```

Add this script to `package.json` under `scripts`:

```json
"test:hero": "node scripts/verify-hero.mjs content"
```

- [ ] **Step 2: Start Astro in the required background mode and verify the check fails**

Run:

```powershell
npx astro dev status
npx astro dev --background
npm run test:hero
```

Expected result: the server reports the project URL, and `npm run test:hero` exits with code 1 containing `enhanced hero marker is missing` plus the missing image/callout assertions.

- [ ] **Step 3: Generate the documentary installation source image**

Use the image generation tool with no reference image and this prompt:

```text
Documentary photorealistic interior photograph, vertical 4:5 composition. A correctly installed freestanding dark steel wood-burning stove in a real Russian country-house interior made from warm timber and neutral mineral surfaces. Show a straight insulated stainless-steel chimney, a visible non-combustible wall protection panel, and a dark non-combustible hearth base. Warm natural side light, honest construction materials, calm professional mood, realistic perspective and safety clearances, clean scene with negative space around the stove for three small technical labels. No people, no logos, no brand marks, no text, no watermark, no tools, no open flame outside the closed firebox, no decorative masonry fireplace, no impossible pipe joints.
```

Run `New-Item -ItemType Directory -Force 'artifacts/generated' | Out-Null`, then save the returned source as `artifacts/generated/hero-metal-stove-installation.png`. Inspect it at original resolution before conversion; reject it if the chimney path, wall protection, hearth base, or clearances look physically implausible.

- [ ] **Step 4: Convert the approved source into the exact web asset**

Create `public/images/` if it does not exist, then run this PowerShell/Python conversion:

```powershell
New-Item -ItemType Directory -Force 'public/images' | Out-Null
@'
from pathlib import Path
from PIL import Image

source = Path("artifacts/generated/hero-metal-stove-installation.png")
target = Path("public/images/metal-stove-installation-hero.webp")
image = Image.open(source).convert("RGB")
width, height = image.size
target_ratio = 4 / 5
current_ratio = width / height

if current_ratio > target_ratio:
    crop_width = round(height * target_ratio)
    left = (width - crop_width) // 2
    image = image.crop((left, 0, left + crop_width, height))
elif current_ratio < target_ratio:
    crop_height = round(width / target_ratio)
    top = (height - crop_height) // 2
    image = image.crop((0, top, width, top + crop_height))

image = image.resize((1280, 1600), Image.Resampling.LANCZOS)
image.save(target, "WEBP", quality=88, method=6)
print(f"saved {target} ({target.stat().st_size} bytes)")
'@ | python -
```

Expected result: `public/images/metal-stove-installation-hero.webp` is 1280 × 1600, loads in the local image viewer, and contains no baked-in text.

After the WebP passes visual inspection, remove the temporary source:

```powershell
Remove-Item -LiteralPath 'artifacts/generated/hero-metal-stove-installation.png'
```

- [ ] **Step 5: Pass the existing image props from the page**

Add these keys to the first object in `blockProps` inside `src/pages/index.astro`, immediately after `priceBadge`:

```js
"imageSrc": "/images/metal-stove-installation-hero.webp",
"imageAlt": "Металлическая печь с защищённой стеной, основанием и стальным дымоходом",
```

Do not change the other first-object values.

- [ ] **Step 6: Replace the separate image/fallback branches with one shared media shell**

In `src/components/hero/hero-visual-price-01.astro`, add this constant after the props destructuring:

```js
const callouts = [
  { label: "Защита стены", position: "wall" },
  { label: "Дымоход", position: "chimney" },
  { label: "Основание", position: "base" },
];
```

Add `data-hero-enhanced` to the section and replace the existing image/fallback conditional with this markup:

```astro
<div class="hero-visual__media-shell">
  {imageSrc ? (
    <a
      class="hero-visual__media glightbox"
      href={imageSrc}
      data-gallery="hero-visual"
      data-title={headline}
      aria-label={imageAlt || "Открыть изображение первого экрана"}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        width="1280"
        height="1600"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
    </a>
  ) : (
    <div class="hero-visual__media" aria-label="Инженерная схема установки металлической печи">
      <div class="hero-visual__blueprint" aria-hidden="true">
        <span class="hero-visual__blueprint-label">Согласованный монтажный узел</span>
        <div class="hero-visual__chimney"><i></i><i></i><i></i></div>
        <div class="hero-visual__stove"><b></b><span></span></div>
        <div class="hero-visual__floor"></div>
      </div>
    </div>
  )}
  <ul class="hero-visual__callouts" aria-label="Ключевые элементы монтажного узла">
    {callouts.map((callout) => (
      <li class={`hero-visual__callout hero-visual__callout--${callout.position}`}>
        {callout.label}
      </li>
    ))}
  </ul>
</div>
```

The opening tag becomes:

```astro
<section
  class="hero-visual"
  data-hero-enhanced
  style={backgroundImageSrc ? `--hero-bg-image: url("${backgroundImageSrc}")` : undefined}
>
```

Remove the three old `.hero-visual__note` elements from the blueprint because the shared callout list replaces them.

- [ ] **Step 7: Add the minimal shared-shell CSS needed for the content check**

Add these declarations beside the existing media styles:

```css
.hero-visual__media-shell {
  position: relative;
  min-width: 0;
}

.hero-visual__callouts {
  margin: 0;
  padding: 0;
  list-style: none;
}
```

- [ ] **Step 8: Run the focused check and build**

Run:

```powershell
npm run test:hero
npm run build
```

Expected result: `Hero content verification passed` and Astro completes the static build with exit code 0.

- [ ] **Step 9: Commit the semantic hero and asset**

Run:

```powershell
git add package.json scripts/verify-hero.mjs src/pages/index.astro src/components/hero/hero-visual-price-01.astro public/images/metal-stove-installation-hero.webp
git commit -m "feat: add hero installation visual"
```

Expected result: one commit containing only the focused verifier, hero component/page integration, and optimized web asset. The temporary source PNG has already been removed.

## Task 2: Implement the approved responsive composition

**Files:**

- Modify: `scripts/verify-hero.mjs`
- Modify: `package.json`
- Modify: `src/components/hero/hero-visual-price-01.astro`
- Create: `artifacts/hero-desktop.png`
- Create: `artifacts/hero-mobile.png`

**Interfaces:**

- Consumes: the Task 1 media shell, callout classes, generated WebP, existing design tokens, and existing hero copy props.
- Produces: the approved 57% / 43% desktop balance, media-first mobile order, full-width mobile CTA, light fact cards, visible focus states, and reduced-motion compliance.

- [ ] **Step 1: Extend the verifier with failing responsive checks**

In `scripts/verify-hero.mjs`, replace the temporary `layout checks are added in Task 2` branch with the following function and invocation before `await browser.close()`:

```js
async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });

  const desktop = await openPage(1440, 1000);
  const desktopContent = await desktop.locator(".hero-visual__content").boundingBox();
  const desktopMedia = await desktop.locator(".hero-visual__media-shell").boundingBox();
  const desktopFactStyle = await desktop.locator(".hero-visual__pills li").first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderLeftWidth: style.borderLeftWidth, boxShadow: style.boxShadow };
  });

  check(desktopContent && desktopMedia && desktopContent.x < desktopMedia.x, "desktop content must remain left of media");
  check(desktopContent && desktopMedia && desktopContent.width > desktopMedia.width, "desktop content column must be wider than media");
  check(desktopFactStyle.borderLeftWidth !== "0px", "benefit facts need a visible left rule");
  check(desktopFactStyle.boxShadow === "none", "benefit facts must not use the old hard shadow");
  const desktopButton = await desktop.locator(".hero-visual__button").boundingBox();
  check(desktopButton && desktopButton.y + desktopButton.height < 1000, "primary CTA must remain in the desktop viewport");
  await desktop.locator(".hero-visual__button").focus();
  const focusOutline = await desktop.locator(".hero-visual__button").evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  check(focusOutline.style !== "none" && focusOutline.width >= 3, "primary CTA needs a visible keyboard focus outline");
  await desktop.screenshot({ path: "artifacts/hero-desktop.png", fullPage: false });
  await desktop.close();

  const mobile = await openPage(390, 844);
  const mobileContent = await mobile.locator(".hero-visual__content").boundingBox();
  const mobileMedia = await mobile.locator(".hero-visual__media-shell").boundingBox();
  const mobileButton = await mobile.locator(".hero-visual__button").boundingBox();
  const mobileImageFit = await mobile.locator(".hero-visual__media img").evaluate((element) => getComputedStyle(element).objectFit);
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  check(mobileContent && mobileMedia && mobileMedia.y < mobileContent.y, "mobile media must render before copy");
  check(mobileContent && mobileButton && mobileButton.width >= mobileContent.width * 0.95, "mobile CTA must span the content width");
  check(mobileImageFit === "cover", "mobile image must crop with object-fit cover");
  check(mobileOverflow <= 1, `mobile page overflows horizontally by ${mobileOverflow}px`);

  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.reload({ waitUntil: "networkidle" });
  const reducedMotion = await mobile.locator(".hero-visual__content").evaluate((element) => getComputedStyle(element).animationName);
  check(reducedMotion === "none", "hero motion must be disabled for reduced-motion users");
  await mobile.screenshot({ path: "artifacts/hero-mobile.png", fullPage: false });
  await mobile.close();

  for (const width of [360, 430]) {
    const edgePhone = await openPage(width, 844);
    const overflow = await edgePhone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${width}px page overflows horizontally by ${overflow}px`);
    check(await edgePhone.locator(".hero-visual__pills li").count() === 4, `${width}px viewport lost a benefit fact`);
    await edgePhone.close();
  }
}

if (mode === "layout" || mode === "all") {
  await verifyLayout();
}
```

Change the success line to:

```js
console.log(`Hero ${mode} verification passed`);
```

Change `package.json` to:

```json
"test:hero": "node scripts/verify-hero.mjs all"
```

- [ ] **Step 2: Run the responsive check and confirm the old styling fails**

Run:

```powershell
npm run test:hero
```

Expected result: exit code 1 with at least `benefit facts must not use the old hard shadow` and `mobile image must crop with object-fit cover`.

- [ ] **Step 3: Apply the approved layout, fact, media, and interaction styles**

In the scoped style block of `src/components/hero/hero-visual-price-01.astro`, update the named selectors to these declarations. Keep the existing blueprint stove/chimney/floor drawing declarations unchanged so the fallback still works.

```css
.hero-visual {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(72px, 8vw, 116px) var(--space-4, 16px);
  color: var(--color-text, #152028);
  background: var(--color-background, #f6f4ef);
  background-size: cover;
  background-position: center;
}

.hero-visual::before {
  position: absolute;
  z-index: -1;
  inset: 0 40% 0 0;
  background-image: radial-gradient(rgb(18 58 90 / 13%) 0.7px, transparent 0.7px);
  background-size: 13px 13px;
  mask-image: linear-gradient(90deg, #000, transparent 92%);
  content: "";
}

.hero-visual__inner {
  width: min(100%, var(--container-width, 1180px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr);
  gap: clamp(40px, 6vw, 76px);
  align-items: center;
}

.hero-visual__badge {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  margin-bottom: var(--space-6, 24px);
  padding: 8px 12px;
  border: 1px solid var(--color-border, #d6dee3);
  border-radius: var(--radius-full, 999px);
  background: rgb(255 255 255 / 72%);
  color: var(--color-primary, #123a5a);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.hero-visual__badge::before {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-accent, #e76525);
  box-shadow: 0 0 0 4px rgb(231 101 37 / 14%);
  content: "";
}

.hero-visual__headline {
  margin: 0;
  max-width: 760px;
  color: var(--color-text, #152028);
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(42px, 5.4vw, 70px);
  line-height: 0.98;
  font-weight: 760;
  letter-spacing: -0.055em;
  text-wrap: balance;
}

.hero-visual__subline {
  max-width: 610px;
  margin: var(--space-6, 24px) 0 0;
  color: var(--color-text-muted, #60717d);
  font-size: clamp(16px, 1.45vw, 18px);
  line-height: 1.58;
}

.hero-visual__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  padding: 0 26px;
  border-radius: 10px;
  background: var(--color-accent, #e76525);
  color: var(--color-white, #fff);
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 6px 0 #b84916;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.hero-visual__button:hover {
  transform: translateY(2px);
  box-shadow: 0 4px 0 #b84916;
}

.hero-visual__button:focus-visible,
.hero-visual__phone:focus-visible,
.hero-visual__badge:focus-visible,
.hero-visual__media:focus-visible {
  outline: 3px solid var(--color-accent, #e76525);
  outline-offset: 4px;
}

.hero-visual__pills {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 610px;
  margin: 34px 0 0;
  padding: 0;
  list-style: none;
}

.hero-visual__pills li {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 10px 12px;
  border-left: 2px solid var(--color-primary, #123a5a);
  border-radius: 0 11px 11px 0;
  background: rgb(255 255 255 / 72%);
  color: var(--color-text, #152028);
  font-size: 13px;
  font-weight: 650;
  box-shadow: none;
}

.hero-visual__pills li::before {
  display: grid;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: rgb(231 101 37 / 14%);
  color: var(--color-accent, #e76525);
  font-size: 11px;
  font-weight: 900;
  content: "✓";
}

.hero-visual__media-shell {
  position: relative;
  min-width: 0;
  animation: hero-media-reveal 700ms 120ms both cubic-bezier(.2, .75, .25, 1);
}

.hero-visual__media {
  display: block;
  height: clamp(470px, 45vw, 570px);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: var(--radius-card, 24px);
  color: inherit;
  background: var(--color-primary-dark, #0b1f33);
  text-decoration: none;
  box-shadow: 0 26px 55px rgb(11 31 51 / 22%);
}

.hero-visual__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.hero-visual__callouts {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
  list-style: none;
}

.hero-visual__callout {
  position: absolute;
  z-index: 4;
  padding: 6px 9px;
  border: 1px solid rgb(255 255 255 / 50%);
  border-radius: 999px;
  color: #fff;
  background: rgb(11 31 51 / 86%);
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 5px 18px rgb(0 0 0 / 18%);
}

.hero-visual__callout::after {
  position: absolute;
  top: 50%;
  width: 34px;
  border-top: 1px solid rgb(255 255 255 / 70%);
  content: "";
}

.hero-visual__callout--wall { top: 32%; left: 12px; }
.hero-visual__callout--wall::after { left: 100%; }
.hero-visual__callout--chimney { top: 18%; right: 12px; }
.hero-visual__callout--chimney::after { right: 100%; }
.hero-visual__callout--base { right: 12px; bottom: 10%; }
.hero-visual__callout--base::after { right: 100%; }

.hero-visual__content {
  position: relative;
  z-index: 1;
  animation: hero-copy-reveal 620ms both cubic-bezier(.2, .75, .25, 1);
}

@keyframes hero-copy-reveal {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-media-reveal {
  from { opacity: 0; transform: translateY(18px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 820px) {
  .hero-visual {
    padding-top: 0;
    padding-bottom: 68px;
  }

  .hero-visual::before { inset: 34% 0 0; }

  .hero-visual__inner {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .hero-visual__media-shell { order: -1; margin-inline: -16px; }

  .hero-visual__media {
    height: clamp(270px, 76vw, 390px);
    border-radius: 0 0 22px 22px;
  }

  .hero-visual__content { padding-top: 4px; }

  .hero-visual__headline {
    font-size: clamp(38px, 11vw, 52px);
    line-height: 0.98;
  }

  .hero-visual__actions { gap: 16px; }
  .hero-visual__button { width: 100%; }
  .hero-visual__phone { width: 100%; text-align: center; }
  .hero-visual__pills { margin-top: 28px; }
  .hero-visual__blueprint { min-height: 100%; }
}

@media (max-width: 480px) {
  .hero-visual__pills { grid-template-columns: 1fr; }
  .hero-visual__callout { font-size: 9px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-visual__content,
  .hero-visual__media-shell {
    animation: none;
  }

  .hero-visual__button { transition: none; }
}
```

Delete the superseded `.hero-visual__note` rules. Retain the blueprint internals, but change `.hero-visual__blueprint` to `min-height: 100%; height: 100%;` so the fallback fills the same media frame.

- [ ] **Step 4: Run the full verifier and inspect both screenshots**

Run:

```powershell
npm run test:hero
```

Expected result: `Hero all verification passed` and the two screenshot files exist.

Inspect `artifacts/hero-desktop.png` and `artifacts/hero-mobile.png` at original resolution. Confirm the image crop keeps the entire stove body, the chimney reads as continuous, the callouts point into the image rather than outside it, the headline is not clipped, and the next section does not overlap the hero.

- [ ] **Step 5: Commit the responsive styling and evidence**

Run:

```powershell
git add package.json scripts/verify-hero.mjs src/components/hero/hero-visual-price-01.astro artifacts/hero-desktop.png artifacts/hero-mobile.png
git commit -m "style: refine hero composition"
```

Expected result: one commit containing the responsive CSS, stronger verifier, and reviewed screenshots.

## Task 3: Run project-wide verification and refresh Graphify

**Files:**

- Verify: all tracked files changed by Tasks 1–2
- Potentially update: portable `.graphify` artifacts created by the required hook
- Do not stage: `.graphify/branch.json`, `.graphify/worktree.json`, `.graphify/needs_update`, `.graphify/cache/`

**Interfaces:**

- Consumes: the complete Hero implementation and `npm run test:hero`.
- Produces: passing Astro checks/build, current Graphify state, clean Git worktree, and a final verification commit only when tracked verification artifacts changed.

- [ ] **Step 1: Run focused and project checks**

Run:

```powershell
npm run test:hero
npm run check
npm run build
git diff --check
```

Expected result: hero verification passes, Astro reports no errors, the static build completes, and `git diff --check` prints nothing.

- [ ] **Step 2: Run the project observer validation**

Run:

```powershell
& 'D:\works\lr-wp-ai-agent\scripts\validate-run.ps1' -RunPath 'D:\works\projects\lr-place-furnace'
```

Expected result: no new blocking issue. The existing manual user-data warning may remain because it is outside block 01.

- [ ] **Step 3: Refresh and validate Graphify state**

Run:

```powershell
npx graphify hook-rebuild
```

If `.graphify/graph.json` exists after the hook, run:

```powershell
graphify portable-check .graphify
```

Expected result: the hook completes, `.graphify/.graphify_runtime.json` records `runtime: typescript` when a TypeScript-backed build is produced, and `portable-check` reports repo-relative paths only.

- [ ] **Step 4: Stage only portable verification outputs**

Run:

```powershell
git status --short
```

Stage `observer.report.md`, `observer.summary.json`, `observer.fix-plan.md`, `quality-score.json`, or portable `.graphify` outputs only when the preceding commands changed them. Never stage the forbidden Graphify runtime-state paths listed above.

- [ ] **Step 5: Commit changed verification artifacts or confirm no final artifact commit is needed**

When verification artifacts changed, run `git add` with their explicit paths and commit:

```powershell
git commit -m "chore: refresh hero verification artifacts"
```

When `git status --short` is empty, do not create an empty commit; the two implementation commits already provide the required history.

- [ ] **Step 6: Stop the background server and report the checkpoint**

Run:

```powershell
npx astro dev stop
git status --short
git log -3 --oneline
```

Expected result: Astro reports the background server stopped, Git status is clean, and the log shows the focused Hero commits. Present the desktop/mobile screenshots and ask for visual approval before starting block 02.
