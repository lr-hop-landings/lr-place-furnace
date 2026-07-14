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
  const firstItemStart = faqData.indexOf(questions[0]);
  const secondItemStart = faqData.indexOf(questions[1]);
  const firstItemData = faqData.slice(firstItemStart, secondItemStart);

  check(faqStart >= 0 && contactStart > faqStart, "FAQ data block not found");
  check((faqData.match(/"q":/g) ?? []).length === 10, "FAQ must keep exactly 10 questions");
  check((faqData.match(/"open":\s+true/g) ?? []).length === 1, "exactly one FAQ item must be open initially");
  check(firstItemData.includes('"open":  true'), "the first question must be the initially open item");
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
        items.first().evaluate((element) => ({
          borderLeftColor: getComputedStyle(element).borderLeftColor,
          boxShadow: getComputedStyle(element).boxShadow,
        })),
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

      await summaries.nth(2).focus();
      const focusStyle = await summaries.nth(2).evaluate((element) => ({
        outlineStyle: getComputedStyle(element).outlineStyle,
        outlineWidth: getComputedStyle(element).outlineWidth,
      }));
      check(focusStyle.outlineStyle !== "none" && Number.parseFloat(focusStyle.outlineWidth) >= 3, `${viewport.name}: visible focus outline is missing`);

      await page.emulateMedia({ reducedMotion: "reduce" });
      const transitionDuration = await summaries.first().locator("i").evaluate((element) => getComputedStyle(element, "::after").transitionDuration);
      check(transitionDuration === "0s", `${viewport.name}: icon transition remains under reduced motion`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);
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
