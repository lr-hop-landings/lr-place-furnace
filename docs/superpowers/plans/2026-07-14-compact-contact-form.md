# Compact Phone-Only Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the final lead form to phone, consent, CTA, and microcopy while preserving the desktop phone input, mobile dialpad, shared lead-capture integration, and the site's dark visual language.

**Architecture:** Add one source-and-browser regression script first. Then remove the obsolete page data and component markup, make `src/scripts/site.ts` the single owner of phone behavior, and fix invalid-submit focus/local fallback ordering. Finish by replacing only the component's scoped styles and generating responsive artifacts at 1440, 768, and 390 px.

**Tech Stack:** Astro 7, TypeScript, scoped CSS, native form controls, Node.js verification scripts, Playwright 1.60, npm, Git.

## Global Constraints

- Keep the headline, both telephone links, VK, Telegram, MAX, CTA, consent copy, and microcopy exactly as specified.
- Use the eyebrow `Оставьте номер — уточним детали`.
- Use the subline `Перезвоним, уточним модель печи и особенности места. Если понадобятся фотографии, подскажем, куда их отправить.`
- Remove name, location, stove model, file upload, response-method selection, their data, props, markup, and stale styles.
- Keep the standard `tel` input on desktop and the existing 12-key `3 × 4` dialpad at widths up to 820 px.
- Preserve hidden `quiz_service`, normalized `input[name="phone"]`, required consent, `data-hop-lead-form`, `data-lead-root`, `data-lead-status`, and `data-lead-success`.
- Keep phone normalization at `+7` plus 10 digits and block invalid submissions.
- Use `src/scripts/site.ts` as the only owner of final-form behavior; remove the duplicate component script.
- Do not add dependencies, backend behavior, analytics, policy pages, or changes to the quiz and adjacent blocks.
- Start and manage the development server only with Astro background commands.

---

### Task 1: Add the failing contact-form regression

**Files:**
- Create: `scripts/verify-contact-form.mjs`
- Modify: `package.json:16-18`

**Interfaces:**
- Consumes: `src/pages/index.astro`, `src/components/contacts/contact-form-card-01.astro`, `src/scripts/site.ts`, the running Astro route, and Playwright.
- Produces: `npm run test:contact-form -- structure|behavior|layout|all` and `artifacts/contact-form-{desktop,tablet,mobile}.png`.

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-contact-form.mjs` with:

```js
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
        const columnCount = await dialpad.locator(":scope > div").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        check(columnCount === 3, `${viewport.name}: dialpad must use three columns`);
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
```

- [ ] **Step 2: Add the npm command**

Replace the final scripts entry with:

```json
"test:faq": "node scripts/verify-faq.mjs",
"test:contact-form": "node scripts/verify-contact-form.mjs"
```

- [ ] **Step 3: Verify RED**

Run:

```powershell
npm run test:contact-form -- structure
```

Expected: FAIL for remaining fields/data/component script, old copy, old success message, missing mobile focus routing, and local fallback handling.

- [ ] **Step 4: Commit the failing regression**

```powershell
git add -- package.json scripts/verify-contact-form.mjs
git commit -m "test: define compact contact form behavior"
```

---

### Task 2: Remove extra lead fields and centralize behavior

**Files:**
- Modify: `src/pages/index.astro:348-378`
- Modify: `src/components/contacts/contact-form-card-01.astro:1-149`
- Modify: `src/scripts/site.ts:413-466`
- Test: `scripts/verify-contact-form.mjs`

**Interfaces:**
- Consumes: the final-form data object, `data-final-*` hooks, shared `normalizePhone()`, `initFinalForms()`, and `initLocalFormFallback()`.
- Produces: a phone-only component API, one behavior owner in `site.ts`, correct invalid-focus routing, and a local fallback that only reports valid submissions.

- [ ] **Step 1: Replace the final contact data object**

Replace the final `blockProps` object with:

```js
{
  "headline": "Получите расчёт установки металлической печи",
  "subline": "Перезвоним, уточним модель печи и особенности места. Если понадобятся фотографии, подскажем, куда их отправить.",
  "cta": "Получить расчёт монтажа"
}
```

- [ ] **Step 2: Replace the component frontmatter and section markup**

Keep the existing `<style>` block temporarily, but replace everything before it with:

```astro
---
interface Props {
  headline: string;
  subline?: string;
  cta: string;
}

const { headline, subline, cta } = Astro.props;
---

<section class="contact-card" id="contacts" aria-labelledby="final-cta-title">
  <div class="contact-card__inner">
    <div class="contact-card__panel" data-lead-root>
      <div class="contact-card__copy">
        <p class="contact-card__eyebrow">Оставьте номер — уточним детали</p>
        <h2 id="final-cta-title">{headline}</h2>
        {subline && <p>{subline}</p>}
        <div class="contact-card__phones">
          <a href="tel:+78123444444">+7 (812) 344-44-44</a>
          <a href="tel:88005554510">8 (800) 555-45-10</a>
        </div>
        <div class="contact-card__socials" aria-label="Социальные сети">
          <a href="https://vk.com/lenremont" target="_blank" rel="noopener noreferrer">VK</a>
          <a href="https://t.me/lenremont" target="_blank" rel="noopener noreferrer">Telegram</a>
          <a href="https://max.ru/id471902475874_3_bot" target="_blank" rel="noopener noreferrer">MAX</a>
        </div>
      </div>

      <form class="contact-card__form" data-hop-lead-form novalidate>
        <input type="hidden" name="quiz_service" value="Установка металлической печи" />
        <input type="hidden" name="phone" data-final-phone-value />
        <label class="contact-card__desktop-phone">
          <span>Телефон *</span>
          <input type="tel" data-final-phone-input placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel" />
        </label>
        <div class="contact-card__dialpad" data-final-dialpad tabindex="-1">
          <span>Телефон *</span>
          <output data-final-dialpad-display aria-live="polite">+7</output>
          <div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button type="button" data-digit={digit}>{digit}</button>)}
            <button type="button" data-clear aria-label="Очистить номер">C</button>
            <button type="button" data-digit="0">0</button>
            <button type="button" data-backspace aria-label="Удалить последнюю цифру">⌫</button>
          </div>
        </div>
        <label class="contact-card__consent">
          <input type="checkbox" name="consent" value="Да" required />
          <span>Соглашаюсь на обработку персональных данных. URL политики будет добавлен перед публикацией.</span>
        </label>
        <button class="contact-card__submit" type="submit">{cta}</button>
        <p class="contact-card__microcopy">Без обязательства заказывать монтаж. Точная смета — после получения необходимых параметров.</p>
        <p class="contact-card__status" data-lead-status tabindex="-1" hidden></p>
      </form>
      <div data-lead-success hidden>Спасибо! Заявка принята. Мы свяжемся с вами по указанному номеру.</div>
    </div>
  </div>
</section>
```

Delete the component's complete inline `<script>` block. In the temporary existing styles, delete the three `fieldset` rules and change the mobile selector:

```css
.contact-card__name-field, .contact-card__desktop-phone { display: none !important; }
```

to:

```css
.contact-card__desktop-phone { display: none !important; }
```

- [ ] **Step 3: Route invalid focus to the visible phone control**

In `initFinalForms()`, replace:

```ts
(phoneInput || dialpad)?.focus();
```

with:

```ts
const phoneControl = phoneInput && phoneInput.offsetParent !== null ? phoneInput : dialpad;
phoneControl?.focus();
```

- [ ] **Step 4: Stop the local fallback after invalid submission**

At the start of the `initLocalFormFallback()` submit listener, add the guard before its own `preventDefault()`:

```ts
form.addEventListener("submit", (event) => {
  if (event.defaultPrevented) return;
  event.preventDefault();
  const status = form.closest("[data-lead-root]")?.querySelector<HTMLElement>("[data-lead-status]");
  if (status) {
    status.hidden = false;
    status.textContent = "Тестовый режим: форма валидна. На рабочем сайте заявку перехватит HTML On Page Lead Capture.";
    status.focus();
  }
});
```

- [ ] **Step 5: Verify structural and behavioral GREEN**

Confirm the background server is available with `npx astro dev status`; if stopped, start only with `npx astro dev --background`.

Run:

```powershell
npm run test:contact-form -- structure
npm run test:contact-form -- behavior
npm run check
```

Expected: both contact-form modes pass and Astro check reports 0 errors, 0 warnings, and 0 hints.

- [ ] **Step 6: Commit the phone-only form behavior**

```powershell
git add -- src/pages/index.astro src/components/contacts/contact-form-card-01.astro src/scripts/site.ts
git commit -m "refactor: simplify final form to phone only"
```

---

### Task 3: Style and verify the compact responsive form

**Files:**
- Modify: `src/components/contacts/contact-form-card-01.astro:55-170`
- Create: `artifacts/contact-form-desktop.png`
- Create: `artifacts/contact-form-tablet.png`
- Create: `artifacts/contact-form-mobile.png`
- Test: `scripts/verify-contact-form.mjs`

**Interfaces:**
- Consumes: the phone-only markup and behavior hooks from Task 2.
- Produces: a maximum 520 px desktop card, a two-column desktop panel, stacked tablet/mobile layouts, and a 12-key mobile dialpad with accessible targets.

- [ ] **Step 1: Replace the component style block**

Replace the complete `<style>` block with:

```astro
<style>
  .contact-card {
    padding: 88px var(--space-4, 16px);
    color: #ffffff;
    background: var(--color-primary-dark, #0b1f33);
  }

  .contact-card__inner {
    width: min(100%, var(--container-width, 1200px));
    margin: 0 auto;
  }

  .contact-card__panel {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(420px, 520px);
    gap: clamp(48px, 5vw, 64px);
    align-items: center;
    padding: 56px;
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 28px;
    background:
      radial-gradient(circle at 18% 18%, rgb(255 255 255 / 7%), transparent 26rem),
      rgb(255 255 255 / 4%);
  }

  .contact-card__copy {
    max-width: 560px;
  }

  .contact-card__eyebrow {
    margin: 0 0 16px;
    color: #ffbb91;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .contact-card h2 {
    margin: 0;
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(42px, 5vw, 58px);
    line-height: 1.04;
    letter-spacing: -0.025em;
  }

  .contact-card__copy > p:not(.contact-card__eyebrow) {
    max-width: 520px;
    margin: 24px 0 0;
    color: rgb(255 255 255 / 74%);
    font-size: var(--text-lg, 18px);
    line-height: 1.65;
  }

  .contact-card__phones {
    display: grid;
    gap: 8px;
    margin-top: 32px;
  }

  .contact-card__phones a {
    width: fit-content;
    color: #ffffff;
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(22px, 2.4vw, 31px);
    font-weight: 800;
    text-decoration: none;
  }

  .contact-card__phones a:hover {
    color: #ffbb91;
  }

  .contact-card__socials {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 26px;
  }

  .contact-card__socials a {
    padding: 10px 14px;
    border: 1px solid rgb(255 255 255 / 28%);
    border-radius: 999px;
    color: #ffffff;
    font-weight: 800;
    text-decoration: none;
  }

  .contact-card__socials a:hover {
    border-color: #ffbb91;
    background: rgb(255 255 255 / 6%);
  }

  .contact-card__form {
    display: grid;
    width: 100%;
    max-width: 520px;
    justify-self: end;
    gap: 20px;
    padding: 36px;
    border: 1px solid rgb(255 255 255 / 36%);
    border-radius: 22px;
    color: var(--color-text, #152028);
    background: #ffffff;
    box-shadow: 7px 7px 0 var(--color-accent, #e76525);
  }

  .contact-card__desktop-phone {
    display: grid;
    gap: 9px;
    font-size: 14px;
    font-weight: 800;
  }

  .contact-card__desktop-phone input {
    width: 100%;
    min-height: 56px;
    padding: 13px 15px;
    border: 1px solid var(--color-border, #d6dee3);
    border-radius: 12px;
    color: var(--color-text, #152028);
    background: #ffffff;
  }

  .contact-card__desktop-phone input:focus-visible {
    border-color: var(--color-accent, #e76525);
    outline: 3px solid rgb(231 101 37 / 24%);
    outline-offset: 1px;
  }

  .contact-card__dialpad {
    display: none;
  }

  .contact-card__consent {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    font-size: 13px;
    line-height: 1.5;
  }

  .contact-card__consent input {
    width: 18px;
    height: 18px;
    margin: 2px 0 0;
    accent-color: var(--color-accent, #e76525);
  }

  .contact-card__submit {
    min-height: 58px;
    border: 0;
    border-radius: var(--radius-button, 12px);
    color: #ffffff;
    background: var(--color-accent, #e76525);
    cursor: pointer;
    font-weight: 800;
    transition: background-color 180ms ease, transform 180ms ease;
  }

  .contact-card__submit:hover {
    background: #cf541f;
    transform: translateY(-2px);
  }

  .contact-card__microcopy,
  .contact-card__status {
    margin: 0;
    color: var(--color-text-muted, #60717d);
    font-size: 12px;
    line-height: 1.55;
  }

  .contact-card__status {
    padding: 12px;
    border-radius: 10px;
    color: var(--color-text, #152028);
    background: var(--color-accent-light, #ffefe5);
  }

  [data-lead-success] {
    grid-column: 1 / -1;
    padding: 20px;
    border-radius: 14px;
    color: var(--color-text, #152028);
    background: var(--color-accent-light, #ffefe5);
  }

  @media (max-width: 820px) {
    .contact-card {
      padding: 72px 16px;
    }

    .contact-card__panel {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 36px;
    }

    .contact-card__copy {
      max-width: 620px;
    }

    .contact-card__form {
      justify-self: start;
    }

    .contact-card__desktop-phone {
      display: none;
    }

    .contact-card__dialpad {
      display: grid;
      gap: 10px;
      padding: 14px;
      border: 1px solid var(--color-border, #d6dee3);
      border-radius: 16px;
    }

    .contact-card__dialpad:focus {
      outline: 3px solid var(--color-accent, #e76525);
      outline-offset: 3px;
    }

    .contact-card__dialpad > span {
      font-size: 14px;
      font-weight: 800;
    }

    .contact-card__dialpad output {
      display: grid;
      min-height: 58px;
      place-items: center;
      border-radius: 12px;
      background: var(--color-background, #f6f4ef);
      font-size: 24px;
      font-weight: 800;
    }

    .contact-card__dialpad > div {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .contact-card__dialpad button {
      min-height: 52px;
      border: 1px solid var(--color-border, #d6dee3);
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      font-weight: 800;
    }

    .contact-card__dialpad button:hover {
      border-color: var(--color-accent, #e76525);
      background: var(--color-accent-light, #ffefe5);
    }
  }

  @media (max-width: 560px) {
    .contact-card {
      padding: 64px 16px;
    }

    .contact-card__panel {
      gap: 32px;
      padding: 24px;
      border-radius: 22px;
    }

    .contact-card h2 {
      font-size: clamp(36px, 11vw, 46px);
    }

    .contact-card__copy > p:not(.contact-card__eyebrow) {
      margin-top: 20px;
      font-size: 16px;
    }

    .contact-card__phones {
      margin-top: 26px;
    }

    .contact-card__phones a {
      font-size: 21px;
    }

    .contact-card__form {
      gap: 18px;
      padding: 20px;
      border-radius: 18px;
      box-shadow: 5px 5px 0 var(--color-accent, #e76525);
    }

    .contact-card__dialpad {
      padding: 12px;
    }

    .contact-card__consent {
      font-size: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .contact-card__submit {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Run the complete contact-form verification**

Run:

```powershell
npm run test:contact-form -- all
```

Expected: PASS and three screenshots at `artifacts/contact-form-{desktop,tablet,mobile}.png`.

- [ ] **Step 3: Inspect all three screenshots**

Open each PNG. Confirm the white form card is visually compact, phone is the only contact-data control, desktop columns are balanced, mobile dialpad remains `3 × 4`, the consent/CTA hierarchy is clear, and the dark section has no unused empty panel area or horizontal clipping.

- [ ] **Step 4: Run full project verification**

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
npm run test:faq -- all
npm run test:contact-form -- all
npm run check
npm run build
git diff --check
npx graphify hook-rebuild
```

Expected: all 11 project test commands pass; Astro check reports 0 errors, 0 warnings, and 0 hints; the build emits both routes; `git diff --check` finds no whitespace errors. If Graphify remains unavailable, record the exact npm error without installing an unrelated package.

- [ ] **Step 5: Restore unrelated generated artifacts and commit**

Restore only the known screenshots regenerated by unrelated suites:

```powershell
git restore -- artifacts/compatibility-system-desktop.png artifacts/compatibility-system-mobile.png artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-mobile.png artifacts/hero-desktop.png artifacts/hero-mobile.png artifacts/installation-route-desktop.png artifacts/installation-route-mobile.png artifacts/quiz-contact-mobile.png artifacts/quiz-inline-desktop.png artifacts/quiz-inline-mobile.png artifacts/quiz-modal-desktop.png artifacts/quiz-modal-mobile.png
git status --short
```

Expected: only `src/components/contacts/contact-form-card-01.astro` and the three new `artifacts/contact-form-*.png` files remain uncommitted.

Commit them:

```powershell
git add -- src/components/contacts/contact-form-card-01.astro artifacts/contact-form-desktop.png artifacts/contact-form-tablet.png artifacts/contact-form-mobile.png
git commit -m "style: refine compact final contact form"
```

- [ ] **Step 6: Re-run post-commit smoke verification**

Run:

```powershell
npm run test:contact-form -- all
npm run check
npm run build
git status --short --branch
```

Expected: contact-form verification, Astro check, and production build pass; the worktree is clean and `main` is ahead of `origin/main` by the new commits.
