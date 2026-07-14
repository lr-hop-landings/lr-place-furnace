import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "behavior", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function verifyStructure() {
  const [pageSource, component, siteScript] = await Promise.all([
    readFile("src/pages/index.astro", "utf8"),
    readFile("src/components/contacts/contact-form-card-01.astro", "utf8"),
    readFile("src/scripts/site.ts", "utf8"),
  ]);
  const contactStart = pageSource.indexOf('"headline":  "Получите расчёт установки металлической печи"');
  const contactEnd = pageSource.indexOf("\n];", contactStart);
  const contactData = pageSource.slice(contactStart, contactEnd);

  check(contactStart >= 0 && contactEnd > contactStart, "final contact data block not found");
  check(!contactData.includes('"fields"'), "contact fields data remains");
  check(!contactData.includes('"action"'), "unused action data remains");
  check(contactData.includes("Перезвоним, уточним модель печи и особенности места. Если понадобятся фотографии, подскажем, куда их отправить."), "new contact subline is missing");
  check(!component.includes("interface Field"), "Field interface remains");
  check(!component.includes("visibleFields") && !component.includes("fields = []"), "fields component API remains");
  check(!component.includes("contact-card__name-field"), "name field markup or style remains");
  check(!component.includes('name="location"') && !component.includes("Населённый пункт"), "location field remains");
  check(!component.includes('name="stove_model"') && !component.includes("Модель печи"), "stove model field remains");
  check(!component.includes('type="file"') && !component.includes("Фотографии объекта"), "file field remains");
  check(!component.includes("contact_method") && !component.includes("Удобный способ ответа"), "response-method fieldset remains");
  check(!component.includes("<script>"), "duplicate component behavior script remains");
  check(component.includes("Оставьте номер — уточним детали"), "new eyebrow is missing");
  check(component.includes('name="phone" data-final-phone-value'), "normalized phone input is missing");
  check(component.includes('data-final-dialpad tabindex="-1"'), "focusable mobile dialpad is missing");
  check(component.includes('name="consent" value="Да" required'), "required consent is missing");
  check(component.includes("Спасибо! Заявка принята. Мы свяжемся с вами по указанному номеру."), "success copy is stale");
  check((siteScript.match(/const initFinalForms =/g) ?? []).length === 1, "final-form behavior must have one owner");
  check(siteScript.includes("phoneInput && phoneInput.offsetParent !== null ? phoneInput : dialpad"), "visible phone-control focus routing is missing");
  check(siteScript.includes("if (event.defaultPrevented) return;"), "local fallback must ignore invalid submissions");
}

async function verifyBehavior() {
  const browser = await chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await desktop.goto(route, { waitUntil: "networkidle" });
    const desktopSection = desktop.locator(".contact-card");
    const desktopForm = desktopSection.locator("form");
    const desktopPhone = desktopSection.locator("[data-final-phone-input]");
    const desktopHiddenPhone = desktopSection.locator('[name="phone"]');
    const desktopConsent = desktopSection.locator('[name="consent"]');
    const desktopStatus = desktopSection.locator("[data-lead-status]");

    check(await desktopPhone.isVisible(), "desktop: standard phone input must be visible");
    check(!(await desktopSection.locator("[data-final-dialpad]").isVisible()), "desktop: dialpad must be hidden");
    check((await desktopForm.locator('input:not([type="hidden"]):not([type="checkbox"])').count()) === 1, "desktop: phone must be the only contact-data control");
    check((await desktopForm.locator('input[type="file"], fieldset').count()) === 0, "desktop: removed controls remain");

    await desktopPhone.fill("8 921 123-45-67");
    check((await desktopHiddenPhone.inputValue()) === "+79211234567", "desktop: phone normalization failed");
    await desktopPhone.fill("8 921");
    await desktopSection.locator(".contact-card__submit").click();
    check(await desktopStatus.isHidden(), "desktop: invalid submission reached local success fallback");
    check(await desktopPhone.evaluate((element) => document.activeElement === element), "desktop: invalid phone did not receive focus");
    await desktopPhone.fill("8 921 123-45-67");
    await desktopConsent.check();
    await desktopSection.locator(".contact-card__submit").click();
    check(await desktopStatus.isVisible(), "desktop: valid local submission did not show status");
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await mobile.goto(route, { waitUntil: "networkidle" });
    const mobileSection = mobile.locator(".contact-card");
    const mobilePhone = mobileSection.locator("[data-final-phone-input]");
    const dialpad = mobileSection.locator("[data-final-dialpad]");
    const hiddenPhone = mobileSection.locator('[name="phone"]');
    const output = mobileSection.locator("[data-final-dialpad-display]");
    const status = mobileSection.locator("[data-lead-status]");

    check(!(await mobilePhone.isVisible()), "mobile: standard phone input must be hidden");
    check(await dialpad.isVisible(), "mobile: dialpad must be visible");
    check((await dialpad.locator("button").count()) === 12, "mobile: dialpad must contain 12 keys");
    await mobileSection.locator(".contact-card__submit").click();
    check(await status.isHidden(), "mobile: invalid submission reached local success fallback");
    check(await dialpad.evaluate((element) => document.activeElement === element), "mobile: invalid phone did not focus the dialpad");

    for (const digit of [9, 2, 1, 1, 2, 3, 4, 5, 6, 7]) {
      await dialpad.locator(`[data-digit="${digit}"]`).click();
    }
    check((await hiddenPhone.inputValue()) === "+79211234567", "mobile: dialpad did not produce normalized phone");
    await dialpad.locator("[data-backspace]").click();
    check((await hiddenPhone.inputValue()) === "+7921123456", "mobile: backspace did not remove the last digit");
    await dialpad.locator('[data-digit="7"]').click();
    await dialpad.locator("[data-clear]").click();
    check((await hiddenPhone.inputValue()) === "", "mobile: clear did not reset hidden phone");
    check((await output.evaluate((element) => element.value.trim())) === "+7", "mobile: clear did not reset display");
    for (const digit of [9, 2, 1, 1, 2, 3, 4, 5, 6, 7]) {
      await dialpad.locator(`[data-digit="${digit}"]`).click();
    }
    await mobileSection.locator('[name="consent"]').check();
    await mobileSection.locator(".contact-card__submit").click();
    check(await status.isVisible(), "mobile: valid local submission did not show status");
    await mobile.close();
  } finally {
    await browser.close();
  }
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", columns: 2, maxHeight: 900, formPadding: 36 },
      { width: 768, height: 900, name: "tablet", columns: 1, maxHeight: 1450, formPadding: 36 },
      { width: 390, height: 900, name: "mobile", columns: 1, maxHeight: 1450, formPadding: 20 },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
      const section = page.locator(".contact-card");
      const panel = section.locator(".contact-card__panel");
      const form = section.locator(".contact-card__form");
      await section.waitFor({ state: "visible" });

      check((await section.locator("h2").textContent())?.trim() === "Получите расчёт установки металлической печи", `${viewport.name}: headline changed`);
      check((await section.locator(".contact-card__eyebrow").textContent())?.trim() === "Оставьте номер — уточним детали", `${viewport.name}: eyebrow changed`);
      const columnCount = await panel.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
      check(columnCount === viewport.columns, `${viewport.name}: expected ${viewport.columns} panel column(s), received ${columnCount}`);
      const sectionBox = await section.boundingBox();
      const formBox = await form.boundingBox();
      check(Boolean(sectionBox) && sectionBox.height < viewport.maxHeight, `${viewport.name}: contact section remains too tall`);
      check(Boolean(formBox) && formBox.x >= 0 && formBox.x + formBox.width <= viewport.width, `${viewport.name}: form escapes viewport`);
      if (viewport.name === "desktop") check(Boolean(formBox) && formBox.width <= 521, "desktop: form exceeds 520px");
      const formPadding = await form.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingLeft));
      check(formPadding === viewport.formPadding, `${viewport.name}: expected ${viewport.formPadding}px form padding, received ${formPadding}px`);

      if (viewport.name === "desktop") {
        const phoneBox = await section.locator("[data-final-phone-input]").boundingBox();
        check(Boolean(phoneBox) && phoneBox.height >= 54, "desktop: phone target is shorter than 54px");
      } else {
        const dialpad = section.locator("[data-final-dialpad]");
        const keys = dialpad.locator("button");
        const dialpadColumnCount = await dialpad.locator(":scope > div").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        check(dialpadColumnCount === 3, `${viewport.name}: dialpad must use three columns`);
        check(await keys.evaluateAll((elements) => elements.every((element) => element.getBoundingClientRect().height >= 52)), `${viewport.name}: dialpad keys are shorter than 52px`);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);
      await section.screenshot({ path: `artifacts/contact-form-${viewport.name}.png` });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "behavior" || mode === "all") await verifyBehavior();
if (mode === "layout" || mode === "all") await verifyLayout();

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Contact form ${mode} verification passed`);
