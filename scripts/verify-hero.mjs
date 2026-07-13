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
  check((await hero.count()) === 1, "enhanced hero marker is missing");

  const cta = page.locator(".hero-visual__button");
  const phone = page.locator(".hero-visual__phone");
  const image = page.locator(".hero-visual__media img");
  const facts = page.locator(".hero-visual__pills li");
  const callouts = page.locator(".hero-visual__callout");
  const imageCount = await image.count();

  check((await cta.getAttribute("href")) === "#estimate-quiz", "CTA target changed");
  check((await phone.getAttribute("href")) === "tel:+78123444444", "phone target changed");
  check((await facts.count()) === 4, "hero must keep all four benefit facts");
  check((await callouts.count()) === 3, "hero must render three technical callouts");
  check(imageCount === 1, "generated hero image is missing");
  if (imageCount === 1) {
    check((await image.getAttribute("src")) === "/images/metal-stove-installation-hero.webp", "generated hero image is not wired");
    check(
      (await image.getAttribute("alt")) ===
        "Металлическая печь с защищённой стеной, основанием и стальным дымоходом",
      "hero image alt text changed",
    );
  }
  check((await page.locator(".hero-visual h1").count()) === 1, "hero must keep exactly one h1");
  const componentSource = await readFile("src/components/hero/hero-visual-price-01.astro", "utf8");
  check(componentSource.includes("hero-visual__blueprint"), "blueprint fallback branch was removed");
  await page.close();
}

await verifyContent();

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
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
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
  check(mobileButton && mobileButton.y + mobileButton.height <= 844, "mobile CTA must fit within the first viewport");
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
    check((await edgePhone.locator(".hero-visual__pills li").count()) === 4, `${width}px viewport lost a benefit fact`);
    await edgePhone.close();
  }
}

if (mode === "layout" || mode === "all") {
  await verifyLayout();
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Hero ${mode} verification passed`);
