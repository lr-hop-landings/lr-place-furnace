import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const mode = process.argv[2] ?? "structure";
const failures = [];

const inlineForm = '[data-quiz-form][data-quiz-instance="inline"]';
const modalForm = '[data-quiz-form][data-quiz-instance="modal"]';

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

async function verifyStructure() {
  const [parent, child, site, page] = await Promise.all([
    readText("src/components/quiz/lead-quiz-modal-01.astro"),
    readText("src/components/quiz/lead-quiz-form.astro"),
    readText("src/scripts/site.ts"),
    readText("src/pages/index.astro"),
  ]);

  check(parent.includes('instance="inline"'), "inline quiz form is missing");
  check(parent.includes('instance="modal"'), "modal quiz form is missing");
  check(child.includes("data-quiz-form"), "shared quiz form marker is missing");
  check(child.includes("data-file-summary"), "shared file summary is missing");
  check(!parent.includes("const initLeadQuiz"), "component still duplicates the quiz controller");
  check(site.includes("interface QuizState"), "shared QuizState is missing");
  check(site.includes("formdata"), "shared file FormData handling is missing");
  check(page.includes('"question":  "Где устанавливаем печь?"'), "quiz questions changed");
  check(page.includes('"question":  "Как вывести дымоход?"'), "quiz questions changed");
}

let browser;

async function openPage(width, height) {
  browser ??= await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator(".lead-quiz").waitFor({ state: "visible" });
  return page;
}

async function chooseAndAdvance(page, form, name, value) {
  await page.locator(`${form} [name="${name}"][value="${value}"]`).check();
  await page.locator(`${form} [data-quiz-next]`).click();
}

async function reachContactStep(page, form = inlineForm) {
  await chooseAndAdvance(page, form, "object_type", "Частный дом");
  await chooseAndAdvance(page, form, "house_type", "Дерево");
  await chooseAndAdvance(page, form, "stove_status", "Уже куплена");
  await chooseAndAdvance(page, form, "services[]", "Установить печь");
  await chooseAndAdvance(page, form, "chimney_route", "Через кровлю");
}

async function verifyBehavior() {
  const page = await openPage(1440, 1000);
  const root = page.locator('[data-lead-quiz="estimate-quiz"]');

  check((await root.locator("[data-quiz-form]").count()) === 2, "quiz must render exactly two forms");
  const ids = await root.locator("[id]").evaluateAll((elements) => elements.map((element) => element.id));
  check(ids.length === new Set(ids).size, "quiz contains duplicate IDs");

  const sectionHeightBefore = await root.evaluate((element) => element.getBoundingClientRect().height);
  await page.locator(`${inlineForm} [name="object_type"][value="Частный дом"]`).check();
  check(await page.locator(`${modalForm} [name="object_type"][value="Частный дом"]`).isChecked(), "inline radio did not mirror to modal");
  await page.locator(`${inlineForm} [data-quiz-next]`).click();
  check((await page.locator('[data-quiz-view="inline"] [data-quiz-step-label]').textContent())?.includes("2 из 6"), "inline step did not advance");
  check((await page.locator('[data-quiz-view="modal"] [data-quiz-step-label]').textContent())?.includes("2 из 6"), "modal step did not synchronize");

  const opener = page.locator("[data-quiz-open]");
  await opener.focus();
  await opener.click();
  const modal = page.locator("[data-quiz-modal]");
  check((await modal.getAttribute("aria-hidden")) === "false", "modal did not open");
  const sectionHeightOpen = await root.evaluate((element) => element.getBoundingClientRect().height);
  check(Math.abs(sectionHeightOpen - sectionHeightBefore) <= 1, `opening modal changed section height by ${sectionHeightOpen - sectionHeightBefore}px`);
  check((await page.locator('[data-quiz-view="modal"] [data-quiz-step-label]').textContent())?.includes("2 из 6"), "modal opened on the wrong step");

  await page.locator(`${modalForm} [name="house_type"][value="Дерево"]`).check();
  check(await page.locator(`${inlineForm} [name="house_type"][value="Дерево"]`).isChecked(), "modal radio did not mirror inline");
  await page.keyboard.press("Escape");
  check((await modal.getAttribute("aria-hidden")) === "true", "Escape did not close modal");
  check(await opener.evaluate((element) => document.activeElement === element), "focus did not return to modal opener");
  const sectionHeightClosed = await root.evaluate((element) => element.getBoundingClientRect().height);
  check(Math.abs(sectionHeightClosed - sectionHeightBefore) <= 1, `closing modal changed section height by ${sectionHeightClosed - sectionHeightBefore}px`);

  await page.locator(`${inlineForm} [data-quiz-next]`).click();
  await chooseAndAdvance(page, inlineForm, "stove_status", "Уже куплена");
  await chooseAndAdvance(page, inlineForm, "services[]", "Установить печь");
  await chooseAndAdvance(page, inlineForm, "chimney_route", "Через кровлю");

  await page.locator(`${inlineForm} [data-phone-input]`).fill("+7 999 111-22-33");
  await page.locator(`${inlineForm} [name="location"]`).fill("Всеволожск");
  check((await page.locator(`${modalForm} [data-phone-input]`).inputValue()) === "+7 999 111-22-33", "phone did not mirror to modal");
  check((await page.locator(`${modalForm} [name="location"]`).inputValue()) === "Всеволожск", "location did not mirror to modal");

  await page.locator(`${inlineForm} [data-file-input]`).setInputFiles({
    name: "stove-room.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("quiz-file"),
  });
  check((await page.locator('[data-quiz-view="modal"] [data-file-summary]').textContent())?.includes("stove-room.jpg"), "file summary did not mirror");
  const modalFiles = await page.locator(modalForm).evaluate((form) =>
    new FormData(form).getAll("photos[]").map((value) => value instanceof File ? value.name : String(value)),
  );
  check(modalFiles.length === 1 && modalFiles[0] === "stove-room.jpg", `modal FormData contains ${modalFiles.length} shared files`);

  await page.locator(`${inlineForm} [name="consent"]`).check();
  await page.evaluate(() => {
    window.__quizSubmitCounts = { inline: 0, modal: 0 };
    document.querySelectorAll("[data-quiz-form]").forEach((form) => {
      form.addEventListener("submit", () => {
        const key = form.getAttribute("data-quiz-instance");
        window.__quizSubmitCounts[key] += 1;
      });
    });
  });
  await page.locator(`${inlineForm} [data-quiz-submit]`).click();
  const submitCounts = await page.evaluate(() => window.__quizSubmitCounts);
  check(submitCounts.inline === 1 && submitCounts.modal === 0, `submit counts are inline=${submitCounts.inline}, modal=${submitCounts.modal}`);

  await page.close();
}

async function focusOutline(page, selector, message) {
  const locator = page.locator(selector).first();
  await locator.focus();
  const outline = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  check(outline.style !== "none" && outline.width >= 3, message);
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });

  const desktop = await openPage(1440, 1000);
  await desktop.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await focusOutline(desktop, "[data-quiz-open]", "modal opener needs a visible focus outline");
  await focusOutline(desktop, `${inlineForm} [name="object_type"]`, "quiz option needs a visible focus outline");
  await desktop.locator(".lead-quiz").screenshot({ path: "artifacts/quiz-inline-desktop.png" });
  await desktop.locator("[data-quiz-open]").click();
  await focusOutline(desktop, "[data-quiz-close]", "modal close needs a visible focus outline");
  await desktop.screenshot({ path: "artifacts/quiz-modal-desktop.png" });
  await desktop.keyboard.press("Escape");
  await desktop.close();

  const mobile = await openPage(390, 900);
  await mobile.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `390px page overflows horizontally by ${overflow}px`);
  await mobile.locator(".lead-quiz").screenshot({ path: "artifacts/quiz-inline-mobile.png" });
  await mobile.locator("[data-quiz-open]").click();
  await mobile.screenshot({ path: "artifacts/quiz-modal-mobile.png" });
  await mobile.keyboard.press("Escape");
  await reachContactStep(mobile);
  await focusOutline(mobile, `${inlineForm} [data-quiz-submit]`, "quiz primary action needs a visible focus outline");
  await mobile.locator('[data-quiz-view="inline"]').screenshot({ path: "artifacts/quiz-contact-mobile.png" });
  await mobile.close();
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "behavior" || mode === "all") await verifyBehavior();
if (mode === "layout" || mode === "all") await verifyLayout();

if (browser) await browser.close();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Quiz ${mode} verification passed`);
