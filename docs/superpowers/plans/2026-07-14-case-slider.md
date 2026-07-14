# Real Case Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить Block10 в адаптивный слайдер реальных монтажных кейсов с крупным активным слайдом, видимым краем следующего, честными фотозаглушками и доступной навигацией.

**Architecture:** Существующий Astro-компонент сохраняет корневой класс и Swiper-инфраструктуру, но получает модель реального кейса, семантическую карточку и собственные элементы управления. Общий `initSliders()` расширяется универсальной синхронизацией числового счётчика и модулем Keyboard; отдельный Node/Playwright-контракт защищает структуру, поведение, адаптивную геометрию и порядок Block8 → Block10 → Block11.

**Tech Stack:** Astro 7, TypeScript, scoped CSS, Swiper 12 (`A11y`, `Keyboard`, `Navigation`, `Pagination`), Node.js, Playwright, Git.

## Global Constraints

- Работать в `D:\works\projects\lr-place-furnace` и коммитить непосредственно в текущую ветку `main`, как ранее согласовано с пользователем.
- Dev-сервер запускать только командой `astro dev --background`; управлять им через `astro dev status`, `astro dev logs`, `astro dev stop`.
- Не добавлять runtime-зависимости и не заменять Swiper.
- Не добавлять autoplay, CTA, модальное окно, lightbox или отдельную страницу кейса.
- Не менять Block8 и Block11; сохранить последовательность Block8 → Block10 → Block11.
- Не выдавать черновые данные и заглушки за выполненные реальные проекты.
- Реальные фотографии не обесцвечивать; использовать `loading="lazy"`, `object-fit: cover` и содержательный `alt`.
- Desktop: активная карточка занимает примерно 72–78% области слайдера, справа виден следующий кейс.
- Tablet: сохраняется горизонтальная карточка и видимый следующий кейс.
- Mobile: карточка становится вертикальной, справа остаётся небольшой фрагмент следующей.
- После изменения code-файлов выполнить `npx graphify hook-rebuild`; если локальный `npx` снова не найдёт executable, сохранить точный текст ошибки в отчёте и не устанавливать случайный пакет.
- Для Astro-компонентов и локальных scoped-стилей следовать официальным руководствам: [Components](https://docs.astro.build/en/basics/astro-components/) и [Styles and CSS](https://docs.astro.build/en/guides/styling/).

## File Map

- Create: `scripts/verify-case-slider.mjs` — единый structure/behavior/layout-контракт Block10 и создание визуальных артефактов.
- Modify: `package.json` — команда `test:case-slider`.
- Modify: `src/components/cases/cases-emergency-slider-02.astro` — typed-модель кейса, семантика, заглушка, навигация и весь локальный визуал.
- Modify: `src/pages/index.astro` — честные черновые данные Block10 и обновлённая заголовочная зона.
- Modify: `src/scripts/site.ts` — Keyboard module и общий числовой счётчик для Swiper с маркером `data-swiper-counter`.
- Create: `artifacts/case-slider-desktop.png` — desktop-эталон.
- Create: `artifacts/case-slider-tablet.png` — tablet-эталон.
- Create: `artifacts/case-slider-mobile.png` — mobile-эталон.
- Modify: `artifacts/section-removal-transition-desktop.png` — актуальный переход Block8 → Block10 после редизайна.
- Modify: `artifacts/section-removal-transition-mobile.png` — мобильный переход Block8 → Block10.

---

### Task 1: Define the case-slider contract

**Files:**
- Create: `scripts/verify-case-slider.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: background site at `SITE_URL ?? "http://127.0.0.1:4321"`, route `/ustanovka-metallicheskih-pechey/`, current Block8 and Block11 root classes.
- Produces: `npm run test:case-slider -- structure|behavior|layout|all`; screenshots `artifacts/case-slider-{desktop,tablet,mobile}.png`.

- [ ] **Step 1: Add the package script**

Replace the last test-script line with this valid trailing pair in `package.json`:

```json
"test:compatibility-system": "node scripts/verify-compatibility-system.mjs all",
"test:case-slider": "node scripts/verify-case-slider.mjs all"
```

- [ ] **Step 2: Write the complete failing contract**

Create `scripts/verify-case-slider.mjs`:

```js
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "behavior", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const expectedTitles = [
  "Печь-камин в деревянном доме",
  "Замена старой печи",
  "Уже купленная печь",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function verifyStructure() {
  const component = await readFile("src/components/cases/cases-emergency-slider-02.astro", "utf8");
  const page = await readFile("src/pages/index.astro", "utf8");
  const site = await readFile("src/scripts/site.ts", "utf8");

  check(component.includes("interface CaseItem"), "CaseItem interface is missing");
  for (const field of ["objectType?: string", "location?: string", "task: string", "works: string[]", "status?: string"]) {
    check(component.includes(field), `CaseItem field is missing: ${field}`);
  }
  check(component.includes("data-real-case-slider"), "case-slider root marker is missing");
  check(component.includes('aria-labelledby="case-slider-title"'), "section must reference its heading");
  check(component.includes('id="case-slider-title"'), "case-slider heading id is missing");
  check(component.includes("data-case-state"), "draft/published state marker is missing");
  check(component.includes('data-swiper-counter="true"'), "counter opt-in marker is missing");
  check(component.includes('"slidesPerView":"auto"'), "slidesPerView must be auto");
  check(!component.toLowerCase().includes("autoplay"), "autoplay must not be configured");
  check(component.includes("data-swiper-current"), "current counter node is missing");
  check(component.includes("data-swiper-total"), "total counter node is missing");
  check(component.includes('aria-label="Предыдущий кейс"'), "previous button label is missing");
  check(component.includes('aria-label="Следующий кейс"'), "next button label is missing");
  check(component.includes("Фото объекта будет добавлено"), "honest photo placeholder is missing");
  check(component.includes('loading="lazy"'), "case images must be lazy loaded");
  check(!component.includes("filter: grayscale"), "real photos must keep natural color");
  check(!component.includes('href="#'), "Block10 must not contain a CTA link");

  check(page.includes('"eyebrow":  "Реализованные объекты"'), "Block10 eyebrow changed");
  check(page.includes('"headline":  "Монтажи, где важна"'), "Block10 headline changed");
  check(page.includes('"accent":  "каждая деталь"'), "Block10 accent changed");
  check((page.match(/"status":\s+"Карточка кейса готовится"/g) ?? []).length === 3, "all draft cases need honest status");
  for (const title of expectedTitles) check(page.includes(`"title":  "${title}"`), `case title changed: ${title}`);
  check(/<Block10\s+\{\.\.\.blockProps\[6\]\}\s*\/>/.test(page), "Block10 wiring changed");

  check(site.includes("Keyboard"), "Swiper Keyboard module is missing");
  check(site.includes("data-swiper-current"), "counter synchronization is missing");
  check(site.includes('slider.on("slideChange"'), "counter must react to slide changes");
}

async function openPage(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.locator("[data-real-case-slider]").waitFor({ state: "visible" });
  return page;
}

async function verifyBehavior() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await openPage(browser, 1440, 1000);
    const section = page.locator("[data-real-case-slider]");
    const slider = section.locator(".swiper");
    const current = section.locator("[data-swiper-current]");
    const total = section.locator("[data-swiper-total]");
    const next = section.locator(".swiper-button-next");
    const previous = section.locator(".swiper-button-prev");

    await slider.waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("[data-real-case-slider] .swiper")?.classList.contains("swiper-initialized"));
    check((await current.textContent())?.trim() === "01", "counter must start at 01");
    check((await total.textContent())?.trim() === "03", "counter total must be 03");
    check((await next.count()) === 1 && (await previous.count()) === 1, "slider needs one previous and one next button");
    check(await next.isEnabled(), "next case button must be enabled initially");

    await next.click();
    await page.waitForFunction(() => document.querySelector("[data-swiper-current]")?.textContent?.trim() === "02");
    check((await current.textContent())?.trim() === "02", "counter must advance after next click");

    await previous.focus();
    await previous.press("Enter");
    await page.waitForFunction(() => document.querySelector("[data-swiper-current]")?.textContent?.trim() === "01");
    check((await current.textContent())?.trim() === "01", "keyboard activation must move to previous case");

    const runtime = await slider.evaluate((element) => ({
      ready: element.dataset.swiperReady,
      autoplay: element.swiper?.params?.autoplay ?? false,
      keyboard: element.swiper?.params?.keyboard?.enabled ?? false,
    }));
    check(runtime.ready === "true", "case slider must use shared initialization");
    check(runtime.autoplay === false, "runtime autoplay must stay disabled");
    check(runtime.keyboard === true, "runtime keyboard navigation must be enabled");
    await page.close();
  } finally {
    await browser.close();
  }
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", vertical: false },
      { width: 768, height: 1000, name: "tablet", vertical: false },
      { width: 390, height: 900, name: "mobile", vertical: true },
    ]) {
      const page = await openPage(browser, viewport.width, viewport.height);
      const section = page.locator("[data-real-case-slider]");
      const slider = section.locator(".cases-emergency__slider");
      const cards = section.locator(".cases-emergency__card");
      await page.waitForFunction(() => document.querySelector("[data-real-case-slider] .swiper")?.classList.contains("swiper-initialized"));

      check((await section.locator("h2").count()) === 1, `${viewport.name}: section needs one H2`);
      check((await cards.count()) === 3, `${viewport.name}: section needs three draft cases`);
      check(JSON.stringify(await cards.locator("h3").allTextContents()) === JSON.stringify(expectedTitles), `${viewport.name}: case titles or order changed`);
      check((await section.evaluate((element) => getComputedStyle(element).backgroundColor)) === "rgb(11, 31, 51)", `${viewport.name}: dark section background changed`);
      check(await section.evaluate((element) => element.previousElementSibling?.hasAttribute("data-compatibility-system")), `${viewport.name}: Block8 adjacency changed`);
      check(await section.evaluate((element) => element.nextElementSibling?.classList.contains("social-links-cards")), `${viewport.name}: Block11 adjacency changed`);

      const sectionBox = await section.boundingBox();
      const sliderBox = await slider.boundingBox();
      const firstBox = await cards.nth(0).boundingBox();
      const nextBox = await cards.nth(1).boundingBox();
      check(Boolean(sectionBox && sliderBox && firstBox && nextBox), `${viewport.name}: slider boxes are unavailable`);
      if (sliderBox && firstBox && nextBox) {
        const ratio = firstBox.width / sliderBox.width;
        check(ratio >= (viewport.vertical ? 0.86 : 0.72), `${viewport.name}: active case is too narrow (${ratio.toFixed(2)})`);
        check(ratio <= (viewport.vertical ? 0.96 : 0.90), `${viewport.name}: active case hides the next case (${ratio.toFixed(2)})`);
        check(nextBox.x < viewport.width && nextBox.x + nextBox.width > viewport.width, `${viewport.name}: next case edge must be visible`);
      }

      const columns = await cards.nth(0).evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
      check(columns === (viewport.vertical ? 1 : 2), `${viewport.name}: case card orientation is incorrect`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);
      check((await section.locator(".cases-emergency__placeholder-icon[aria-hidden=\"true\"]").count()) === 3, `${viewport.name}: placeholder icons must be decorative`);

      await section.screenshot({ path: `artifacts/case-slider-${viewport.name}.png` });
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
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Case slider ${mode} verification passed`);
```

- [ ] **Step 3: Run the structure contract and confirm RED**

Run:

```powershell
npm run test:case-slider -- structure
```

Expected: exit code `1`; failures include missing `objectType`, `data-real-case-slider`, `slidesPerView:auto`, honest status, Keyboard module and counter synchronization.

- [ ] **Step 4: Commit the failing contract**

```powershell
git add package.json scripts/verify-case-slider.mjs
git commit -m "test: define real case slider behavior"
```

---

### Task 2: Add honest real-case semantics and draft data

**Files:**
- Modify: `src/components/cases/cases-emergency-slider-02.astro:1-64`
- Modify: `src/pages/index.astro:226-270`

**Interfaces:**
- Consumes: existing Block10 props, three current scenario titles, shared Swiper HTML conventions.
- Produces: `CaseItem` with `objectType`, `location`, `task`, `works`, `result`, `status`, image fields; root `[data-real-case-slider]`; counter/nav DOM consumed by Task 3; class hooks consumed by Task 4.

- [ ] **Step 1: Replace the component frontmatter and template**

Replace lines 1–64 of `cases-emergency-slider-02.astro` with:

```astro
---
interface CaseItem {
  title: string;
  objectType?: string;
  location?: string;
  task: string;
  works: string[];
  result?: string;
  status?: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface Props {
  eyebrow?: string;
  headline?: string;
  accent?: string;
  subline?: string;
  items?: CaseItem[];
}

const {
  eyebrow = "Реализованные объекты",
  headline = "Монтажи, где важна",
  accent = "каждая деталь",
  subline = "Готовим реальные карточки объектов с фотографиями, составом работ и результатом.",
  items = [],
} = Astro.props;

const formatIndex = (index: number) => String(index + 1).padStart(2, "0");
const total = String(items.length).padStart(2, "0");
---

<section class="cases-emergency" data-real-case-slider aria-labelledby="case-slider-title">
  <div class="cases-emergency__inner">
    <header class="cases-emergency__header">
      {eyebrow && <p class="cases-emergency__eyebrow">{eyebrow}</p>}
      <h2 id="case-slider-title">{headline}{accent && <span>{accent}</span>}</h2>
      {subline && <p class="cases-emergency__subline">{subline}</p>}
    </header>

    <div
      class="cases-emergency__slider swiper"
      data-swiper-counter="true"
      data-swiper-options='{"slidesPerView":"auto","spaceBetween":24,"keyboard":{"enabled":true,"onlyInViewport":true}}'
    >
      <div class="swiper-wrapper">
        {items.map((item, index) => (
          <article
            class="cases-emergency__card swiper-slide"
            data-case-state={item.imageSrc ? "published" : "draft"}
          >
            <div class="cases-emergency__image">
              {item.imageSrc ? (
                <img src={item.imageSrc} alt={item.imageAlt ?? item.title} loading="lazy" />
              ) : (
                <div class="cases-emergency__placeholder">
                  <svg class="cases-emergency__placeholder-icon" viewBox="0 0 64 48" aria-hidden="true" focusable="false">
                    <rect x="3" y="3" width="58" height="42" rx="6" fill="none" stroke="currentColor" stroke-width="2" />
                    <circle cx="46" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="2" />
                    <path d="m9 38 14-14 9 9 7-7 16 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>Фото объекта будет добавлено</span>
                </div>
              )}
            </div>

            <div class="cases-emergency__content">
              <div class="cases-emergency__topline">
                <span class="cases-emergency__index">Кейс {formatIndex(index)}</span>
                <div class="cases-emergency__meta">
                  {item.objectType && <span>{item.objectType}</span>}
                  {item.location && <span>{item.location}</span>}
                </div>
              </div>
              <h3>{item.title}</h3>
              <div class="cases-emergency__task">
                <span>Задача</span>
                <p>{item.task}</p>
              </div>
              {item.works.length > 0 ? (
                <div class="cases-emergency__works">
                  <span>Выполнили</span>
                  <ul>{item.works.map((work) => <li>{work}</li>)}</ul>
                </div>
              ) : (
                <p class="cases-emergency__draft-status">{item.status ?? "Карточка кейса готовится"}</p>
              )}
              {item.result && <p class="cases-emergency__result"><span>Результат</span>{item.result}</p>}
            </div>
          </article>
        ))}
      </div>

      <div class="cases-emergency__controls">
        <p class="cases-emergency__counter" aria-live="polite" aria-atomic="true">
          <span data-swiper-current>01</span><span aria-hidden="true"> / </span><span data-swiper-total>{total}</span>
        </p>
        <div class="cases-emergency__arrows">
          <button class="swiper-button-prev" type="button" aria-label="Предыдущий кейс">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h9" /></svg>
          </button>
          <button class="swiper-button-next" type="button" aria-label="Следующий кейс">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6m6-6H7" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
```

Keep the existing `<style>` block temporarily. It will look incorrect until Task 4, but Task 2 is scoped to semantics and data.

- [ ] **Step 2: Replace only the Block10 data object**

In `src/pages/index.astro`, replace the object whose eyebrow is `Сценарии для оценки` with:

```json
{
  "eyebrow": "Реализованные объекты",
  "headline": "Монтажи, где важна",
  "accent": "каждая деталь",
  "subline": "Готовим реальные карточки объектов с фотографиями, составом работ и результатом.",
  "items": [
    {
      "title": "Печь-камин в деревянном доме",
      "objectType": "Деревянный дом",
      "task": "Подготовить место и вывести дымоход через кровлю.",
      "works": [],
      "status": "Карточка кейса готовится"
    },
    {
      "title": "Замена старой печи",
      "objectType": "Замена оборудования",
      "task": "Оценить демонтаж и состояние существующего дымохода.",
      "works": [],
      "status": "Карточка кейса готовится"
    },
    {
      "title": "Уже купленная печь",
      "objectType": "Подбор комплектации",
      "task": "Проверить совместимость печи с домом и собрать комплектацию.",
      "works": [],
      "status": "Карточка кейса готовится"
    }
  ]
}
```

Match the file's existing indentation/formatting; do not reformat unrelated `blockProps`.

- [ ] **Step 3: Run the structure test and identify the remaining expected failure**

```powershell
npm run test:case-slider -- structure
```

Expected: exit code `1`; component and page assertions pass, while `site.ts` still fails the Keyboard/counter assertions.

- [ ] **Step 4: Run Astro type checking**

```powershell
npm run check
```

Expected: `0 errors`, `0 warnings`, `0 hints`.

- [ ] **Step 5: Commit semantic markup and honest data**

```powershell
git add src/components/cases/cases-emergency-slider-02.astro src/pages/index.astro
git commit -m "feat: add real case slider semantics"
```

---

### Task 3: Add shared numeric progress and keyboard support

**Files:**
- Modify: `src/scripts/site.ts:1-32`
- Test: `scripts/verify-case-slider.mjs`

**Interfaces:**
- Consumes: `.swiper[data-swiper-counter="true"]`, `[data-swiper-current]`, `[data-swiper-total]`, existing JSON options.
- Produces: shared Swiper instance with `Keyboard`; zero-padded `01 / 03` counter synchronized on `slideChange` and `slidesLengthChange`.

- [ ] **Step 1: Register Keyboard and synchronize optional counters**

Change the Swiper imports and `initSliders()` setup in `src/scripts/site.ts` to this exact shape:

```ts
import Swiper from "swiper";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import GLightbox from "glightbox";

const formatSliderNumber = (value: number) => String(value).padStart(2, "0");

const initSliders = () => {
  document.querySelectorAll<HTMLElement>(".swiper").forEach((element) => {
    if (element.dataset.swiperReady === "true") return;
    element.dataset.swiperReady = "true";
    let options = {};
    try {
      options = JSON.parse(element.dataset.swiperOptions || "{}");
    } catch {
      options = {};
    }

    const slider = new Swiper(element, {
      modules: [A11y, Keyboard, Navigation, Pagination],
      watchOverflow: true,
      a11y: { enabled: true },
      navigation: {
        nextEl: element.querySelector<HTMLElement>(".swiper-button-next"),
        prevEl: element.querySelector<HTMLElement>(".swiper-button-prev"),
      },
      pagination: {
        el: element.querySelector<HTMLElement>(".swiper-pagination"),
        clickable: true,
      },
      ...options,
    });

    if (element.dataset.swiperCounter === "true") {
      const current = element.querySelector<HTMLElement>("[data-swiper-current]");
      const total = element.querySelector<HTMLElement>("[data-swiper-total]");
      const syncCounter = () => {
        if (current) current.textContent = formatSliderNumber(slider.realIndex + 1);
        if (total) total.textContent = formatSliderNumber(slider.slides.length);
      };
      syncCounter();
      slider.on("slideChange", syncCounter);
      slider.on("slidesLengthChange", syncCounter);
    }
  });
};
```

Leave all functions after `initSliders()` unchanged.

- [ ] **Step 2: Run structure GREEN**

```powershell
npm run test:case-slider -- structure
```

Expected: `Case slider structure verification passed`.

- [ ] **Step 3: Run behavior GREEN**

```powershell
npm run test:case-slider -- behavior
```

Expected: `Case slider behavior verification passed`; clicking next changes `01` to `02`, Enter on previous changes it back to `01`, runtime autoplay is false and keyboard is enabled.

- [ ] **Step 4: Verify types and build**

```powershell
npm run check
npm run build
```

Expected: Astro reports no diagnostics; build completes and generates two routes.

- [ ] **Step 5: Commit accessible slider controls**

```powershell
git add src/scripts/site.ts
git commit -m "feat: add accessible case slider controls"
```

---

### Task 4: Implement the responsive visual system and verify the page

**Files:**
- Modify: `src/components/cases/cases-emergency-slider-02.astro:after template`
- Create: `artifacts/case-slider-desktop.png`
- Create: `artifacts/case-slider-tablet.png`
- Create: `artifacts/case-slider-mobile.png`
- Modify: `artifacts/section-removal-transition-desktop.png`
- Modify: `artifacts/section-removal-transition-mobile.png`

**Interfaces:**
- Consumes: semantic class hooks and Swiper behavior from Tasks 2–3; shared design tokens in `src/styles/style.css`.
- Produces: dark portfolio section, 72–78% desktop active slide, horizontal tablet card, vertical mobile card, visible next-case edge and stable screenshots.

- [ ] **Step 1: Replace the component style block**

Replace the entire existing `<style>` block in `cases-emergency-slider-02.astro` with:

```astro
<style>
  .cases-emergency {
    position: relative;
    overflow: hidden;
    padding: var(--spacing-section, 96px) var(--space-4, 16px);
    color: var(--color-white, #ffffff);
    background:
      radial-gradient(circle at 88% 10%, rgb(231 101 37 / 14%), transparent 27rem),
      var(--color-primary-dark, #0b1f33);
  }

  .cases-emergency::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    opacity: 0.16;
    background-image: radial-gradient(rgb(255 255 255 / 35%) 0.7px, transparent 0.7px);
    background-size: 18px 18px;
    -webkit-mask-image: linear-gradient(to bottom, #000, transparent 72%);
    mask-image: linear-gradient(to bottom, #000, transparent 72%);
  }

  .cases-emergency__inner {
    position: relative;
    width: min(100%, var(--container-width, 1200px));
    margin: 0 auto;
  }

  .cases-emergency__header {
    max-width: 830px;
    margin-bottom: clamp(2rem, 5vw, 4rem);
  }

  .cases-emergency__eyebrow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1rem;
    color: #ffad7d;
    font-size: var(--text-xs, 0.75rem);
    font-weight: 800;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .cases-emergency__eyebrow::before {
    width: 2rem;
    height: 2px;
    content: "";
    background: var(--color-accent, #e76525);
  }

  .cases-emergency h2 {
    margin: 0;
    color: var(--color-white, #fff);
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(2.6rem, 5.4vw, 4.9rem);
    font-weight: 800;
    line-height: 0.98;
    letter-spacing: -0.045em;
    text-wrap: balance;
  }

  .cases-emergency h2 span {
    display: block;
    color: #ffad7d;
  }

  .cases-emergency__subline {
    max-width: 690px;
    margin: 1.25rem 0 0;
    color: rgb(255 255 255 / 68%);
    font-size: clamp(1rem, 1.5vw, 1.125rem);
    line-height: 1.65;
  }

  .cases-emergency__slider {
    overflow: visible;
  }

  .cases-emergency__slider .swiper-wrapper {
    align-items: stretch;
  }

  .cases-emergency__card {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(310px, 0.85fr);
    width: min(900px, calc(100vw - 220px));
    min-height: 520px;
    height: auto;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 16%);
    border-radius: clamp(1.25rem, 2vw, 2rem);
    color: var(--color-text, #152028);
    background: var(--color-surface, #fff);
    box-shadow: 0 28px 70px rgb(0 0 0 / 24%);
  }

  .cases-emergency__image {
    min-width: 0;
    min-height: 100%;
    background: #e9e5dc;
  }

  .cases-emergency__image img,
  .cases-emergency__placeholder {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  .cases-emergency__image img {
    display: block;
    object-fit: cover;
  }

  .cases-emergency__placeholder {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1rem;
    padding: 2rem;
    color: var(--color-primary, #123a5a);
    text-align: center;
    background:
      linear-gradient(145deg, rgb(18 58 90 / 9%), rgb(231 101 37 / 13%)),
      repeating-linear-gradient(135deg, transparent 0 26px, rgb(11 31 51 / 3%) 26px 27px),
      #e9e5dc;
  }

  .cases-emergency__placeholder-icon {
    width: clamp(3.5rem, 8vw, 5rem);
    opacity: 0.55;
  }

  .cases-emergency__placeholder span {
    max-width: 15rem;
    font-size: 0.875rem;
    font-weight: 800;
    line-height: 1.4;
  }

  .cases-emergency__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    padding: clamp(1.5rem, 3vw, 2.5rem);
  }

  .cases-emergency__topline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: auto;
  }

  .cases-emergency__index {
    flex: 0 0 auto;
    color: var(--color-accent, #e76525);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .cases-emergency__meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.375rem;
  }

  .cases-emergency__meta span {
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--color-border, #d6dee3);
    border-radius: var(--radius-pill, 999px);
    color: var(--color-text-muted, #60717d);
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .cases-emergency h3 {
    margin: clamp(2.2rem, 6vw, 4.5rem) 0 1.4rem;
    color: var(--color-primary-dark, #0b1f33);
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(1.75rem, 3vw, 2.8rem);
    line-height: 1.02;
    letter-spacing: -0.035em;
  }

  .cases-emergency__task,
  .cases-emergency__works {
    display: grid;
    grid-template-columns: 5.25rem minmax(0, 1fr);
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #d6dee3);
  }

  .cases-emergency__task > span,
  .cases-emergency__works > span,
  .cases-emergency__result > span {
    color: var(--color-text-muted, #60717d);
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .cases-emergency__task p,
  .cases-emergency__works ul,
  .cases-emergency__result,
  .cases-emergency__draft-status {
    margin: 0;
  }

  .cases-emergency__task p,
  .cases-emergency__works li {
    color: var(--color-text, #152028);
    line-height: 1.55;
  }

  .cases-emergency__works {
    margin-top: 1rem;
  }

  .cases-emergency__works ul {
    padding-left: 1.1rem;
  }

  .cases-emergency__draft-status {
    margin-top: 1rem;
    padding: 0.85rem 1rem;
    border-radius: 0.75rem;
    color: var(--color-primary, #123a5a);
    background: var(--color-accent-light, #ffefe5);
    font-size: 0.875rem;
    font-weight: 800;
  }

  .cases-emergency__result {
    display: grid;
    grid-template-columns: 5.25rem minmax(0, 1fr);
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #d6dee3);
    color: var(--color-primary, #123a5a);
    font-weight: 800;
    line-height: 1.5;
  }

  .cases-emergency__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1.5rem;
  }

  .cases-emergency__counter {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    margin: 0;
    color: rgb(255 255 255 / 42%);
    font-size: 0.875rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .cases-emergency__counter [data-swiper-current] {
    color: var(--color-white, #fff);
    font-size: 1.5rem;
  }

  .cases-emergency__arrows {
    display: flex;
    gap: 0.75rem;
  }

  .cases-emergency .swiper-button-prev,
  .cases-emergency .swiper-button-next {
    position: static;
    display: grid;
    width: 3rem;
    height: 3rem;
    margin: 0;
    place-items: center;
    border: 1px solid rgb(255 255 255 / 34%);
    border-radius: 50%;
    color: var(--color-white, #fff);
    background: transparent;
    transition: color 180ms ease, border-color 180ms ease, background 180ms ease, transform 180ms ease;
  }

  .cases-emergency .swiper-button-prev::after,
  .cases-emergency .swiper-button-next::after {
    display: none;
  }

  .cases-emergency .swiper-button-prev svg,
  .cases-emergency .swiper-button-next svg {
    width: 1.35rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .cases-emergency .swiper-button-prev:hover,
  .cases-emergency .swiper-button-next:hover {
    border-color: var(--color-accent, #e76525);
    color: var(--color-white, #fff);
    background: var(--color-accent, #e76525);
    transform: translateY(-2px);
  }

  .cases-emergency .swiper-button-disabled {
    opacity: 0.32;
  }

  @media (max-width: 899px) {
    .cases-emergency__card {
      grid-template-columns: minmax(0, 1.18fr) minmax(260px, 0.82fr);
      width: calc(100% - 72px);
      min-height: 480px;
    }

    .cases-emergency h3 {
      margin-top: 2.5rem;
    }

    .cases-emergency__task,
    .cases-emergency__works,
    .cases-emergency__result {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }
  }

  @media (max-width: 640px) {
    .cases-emergency {
      padding-right: 1rem;
      padding-left: 1rem;
    }

    .cases-emergency__header {
      margin-bottom: 2rem;
    }

    .cases-emergency h2 {
      font-size: clamp(2.35rem, 12vw, 3.45rem);
    }

    .cases-emergency__card {
      grid-template-columns: 1fr;
      width: calc(100% - 28px);
      min-height: 0;
    }

    .cases-emergency__image {
      min-height: 0;
      aspect-ratio: 4 / 3;
    }

    .cases-emergency__content {
      padding: 1.25rem;
    }

    .cases-emergency__topline {
      flex-direction: column;
      margin-bottom: 0;
    }

    .cases-emergency__meta {
      justify-content: flex-start;
    }

    .cases-emergency h3 {
      margin: 1.75rem 0 1rem;
      font-size: clamp(1.65rem, 8vw, 2.2rem);
    }

    .cases-emergency__controls {
      margin-top: 1.25rem;
    }

    .cases-emergency .swiper-button-prev,
    .cases-emergency .swiper-button-next {
      width: 2.75rem;
      height: 2.75rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cases-emergency .swiper-button-prev,
    .cases-emergency .swiper-button-next {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Run layout verification and inspect all three screenshots**

```powershell
npm run test:case-slider -- layout
```

Expected: `Case slider layout verification passed` and three new PNG files.

Inspect:

```powershell
# Use the workspace image viewer, not a text command:
# artifacts/case-slider-desktop.png
# artifacts/case-slider-tablet.png
# artifacts/case-slider-mobile.png
```

Confirm visually:

- desktop has one dominant horizontal card and a meaningful right-hand preview;
- tablet copy remains readable without collapsing into a tall narrow column;
- mobile card is vertical and the next edge remains visible;
- header no longer dominates the whole section;
- placeholders are clearly neutral and do not resemble real project photos;
- navigation is aligned and does not overlap content.

- [ ] **Step 3: Run the complete case-slider contract**

```powershell
npm run test:case-slider
```

Expected: `Case slider all verification passed`.

- [ ] **Step 4: Run the full project regression suite**

```powershell
$commands = @(
  'npm run test:hero',
  'npm run test:social-qr',
  'npm run test:quiz',
  'npm run test:installation-route',
  'npm run test:equipment-lineup',
  'npm run test:section-removal',
  'npm run test:compatibility-system',
  'npm run test:case-slider',
  'npm run check',
  'npm run build'
)
foreach ($command in $commands) {
  Invoke-Expression $command
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: every verification prints `passed`; Astro reports `0 errors`, `0 warnings`, `0 hints`; build generates two routes.

- [ ] **Step 5: Restore unrelated screenshot noise and retain legitimate transitions**

Run `git status --short`. Tests may regenerate pixel-level differences in old screenshots. Restore only artifacts whose source block did not change:

```powershell
git restore -- artifacts/equipment-lineup-desktop.png artifacts/equipment-lineup-mobile.png artifacts/hero-desktop.png artifacts/hero-mobile.png artifacts/installation-route-desktop.png artifacts/installation-route-mobile.png artifacts/quiz-inline-desktop.png artifacts/quiz-inline-mobile.png artifacts/quiz-modal-desktop.png
```

Do not restore:

- `artifacts/case-slider-desktop.png`;
- `artifacts/case-slider-tablet.png`;
- `artifacts/case-slider-mobile.png`;
- `artifacts/section-removal-transition-desktop.png`;
- `artifacts/section-removal-transition-mobile.png`.

- [ ] **Step 6: Refresh Graphify and check the final diff**

```powershell
npx graphify hook-rebuild
git diff --check
git status --short
```

Expected: Graphify rebuilds the project graph. If it instead prints `npm error could not determine executable to run`, record that known environment failure without installing anything. If Graphify succeeds and changes `.graphify/`, run `graphify portable-check .graphify`, exclude `.graphify/branch.json`, `.graphify/worktree.json`, `.graphify/needs_update` and `.graphify/cache/`, and handle portable tracked graph updates in a separate `chore: refresh graphify index` commit. `git diff --check` must exit `0`; the Block10 visual commit must contain only the component and the five intended artifacts.

- [ ] **Step 7: Commit the visual implementation and artifacts**

```powershell
git add src/components/cases/cases-emergency-slider-02.astro artifacts/case-slider-desktop.png artifacts/case-slider-tablet.png artifacts/case-slider-mobile.png artifacts/section-removal-transition-desktop.png artifacts/section-removal-transition-mobile.png
git commit -m "style: add responsive real case slider"
```

- [ ] **Step 8: Confirm the repository is clean**

```powershell
git status --short
git log -5 --oneline
```

Expected: no status output; the latest commits are contract, semantics, controls and visual implementation in that order.
