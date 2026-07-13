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

if (mode === "layout" || mode === "all") {
  throw new Error("layout checks are added in Task 2");
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Hero content verification passed");
