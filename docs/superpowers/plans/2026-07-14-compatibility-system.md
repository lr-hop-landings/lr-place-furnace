# Compatibility System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить Block8 в светлую связанную систему из трёх равноправных факторов с горизонтальной desktop/tablet и вертикальной mobile-композицией.

**Architecture:** Существующий однократно используемый `equipment-process-02.astro` сохраняет свой публичный интерфейс и корневой класс, но получает typed `icon`, семантический `<ol>` и встроенные SVG-пиктограммы. Новый Node/Playwright-контракт отдельно защищает структуру, светлый визуальный слой, адаптивную геометрию и последовательность Block5 → Block8 → Block10.

**Tech Stack:** Astro 7, TypeScript в `.astro`, CSS, inline SVG, Node.js ESM, Playwright, Git.

## Global Constraints

- Существующие eyebrow, headline, названия и полные тексты трёх факторов не меняются.
- Новый подзаголовок, CTA, изображения, библиотеки и JavaScript-анимации не добавляются.
- Корневой класс `.equipment-process` и вызов `<Block8 {...blockProps[5]} />` сохраняются.
- Block5, Block10 и порядок Block5 → Block8 → Block10 не меняются.
- Desktop и tablet используют три равные колонки; mobile до 760 px использует одну колонку и вертикальную связь.
- Работа выполняется коммитами непосредственно в `main` по ранее выбранному пользователем процессу.
- Dev server управляется через `astro dev --background`, `astro dev status`, `astro dev logs` и `astro dev stop`.
- После изменения кода запускается `npx graphify hook-rebuild`; при известной ошибке executable сторонний пакет не устанавливается самовольно.

---

### Task 1: Зафиксировать контракт «Связанной системы»

**Files:**
- Create: `scripts/verify-compatibility-system.mjs`
- Modify: `package.json`
- Test: `scripts/verify-compatibility-system.mjs`

**Interfaces:**
- Consumes: `equipment-process-02.astro`, `src/pages/index.astro` и маршрут `/ustanovka-metallicheskih-pechey/`.
- Produces: npm script `test:compatibility-system` с режимами `structure`, `layout` и `all`; три PNG-артефакта.

- [ ] **Step 1: Добавить npm script**

В `package.json` добавить:

```json
"test:compatibility-system": "node scripts/verify-compatibility-system.mjs all"
```

- [ ] **Step 2: Создать полный тестовый контракт**

Создать `scripts/verify-compatibility-system.mjs`:

```js
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const expectedTitles = ["Печь", "Конструкции", "Маршрут"];
const expectedTexts = [
  "Модель, мощность, масса и направление выхода дымохода.",
  "Стены, пол, перекрытия, кровля, балки и стропила.",
  "Высота, конфигурация, обслуживание и внешний вид узла.",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function uniqueCoordinates(boxes, key) {
  return boxes.reduce((values, box) => {
    if (!values.some((value) => Math.abs(value - box[key]) <= 4)) values.push(box[key]);
    return values;
  }, []);
}

async function verifyStructure() {
  const component = await readFile("src/components/features/equipment-process-02.astro", "utf8");
  const page = await readFile("src/pages/index.astro", "utf8");

  check(component.includes('icon?: "stove" | "structure" | "route"'), "typed icon union is missing");
  check(component.includes("data-compatibility-system"), "compatibility marker is missing");
  check(component.includes('<ol class="equipment-process__items">'), "factors must use an OL");
  check(component.includes('<li class="equipment-process__item"'), "factors must use LI elements");
  check(component.includes('aria-hidden="true"'), "decorative icons must be hidden from assistive technology");
  check(component.includes('item.icon === "stove"'), "stove icon branch is missing");
  check(component.includes('item.icon === "structure"'), "structure icon branch is missing");
  check(component.includes('item.icon === "route"'), "route icon branch is missing");
  check((page.match(/"icon":\s+"(?:stove|structure|route)"/g) ?? []).length === 3, "Block8 must define three icons");
  check(page.includes('"icon":  "stove"') && page.includes('"icon":  "structure"') && page.includes('"icon":  "route"'), "Block8 icon values changed");
  check(/<Block8\s+\{\.\.\.blockProps\[5\]\}\s*\/>/.test(page), "Block8 wiring changed");
  check(page.includes("Печь, место и дымоход — единая система"), "eyebrow changed");
  check(page.includes("До сметы проверяем совместимость оборудования и дома"), "headline changed");
  for (const title of expectedTitles) check(page.includes(`"title":  "${title}"`), `title changed: ${title}`);
  for (const text of expectedTexts) check(page.includes(`"text":  "${text}"`), `text changed: ${text}`);
}

async function itemBoxes(page) {
  return page.locator('[data-compatibility-system] .equipment-process__item').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
}

async function openPage(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.locator("[data-compatibility-system]").waitFor({ state: "visible" });
  return page;
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop", columns: 3 },
      { width: 768, height: 1000, name: "tablet", columns: 3 },
      { width: 390, height: 900, name: "mobile", columns: 1 },
    ]) {
      const page = await openPage(browser, viewport.width, viewport.height);
      const section = page.locator("[data-compatibility-system]");
      const list = section.locator(".equipment-process__items");
      const items = section.locator(".equipment-process__item");

      check((await section.locator("h2").count()) === 1, `${viewport.name}: section must contain one H2`);
      check((await list.evaluate((element) => element.tagName)) === "OL", `${viewport.name}: factors container must be OL`);
      check((await items.count()) === 3, `${viewport.name}: section must contain three factors`);
      check((await items.first().evaluate((element) => element.tagName)) === "LI", `${viewport.name}: factor must be LI`);
      check(JSON.stringify(await items.locator("h3").allTextContents()) === JSON.stringify(expectedTitles), `${viewport.name}: titles or order changed`);
      check(JSON.stringify(await items.locator(".equipment-process__copy p").allTextContents()) === JSON.stringify(expectedTexts), `${viewport.name}: copy changed`);
      check((await items.locator("svg").count()) === 3, `${viewport.name}: three icons are required`);
      check((await items.locator('svg[aria-hidden="true"]').count()) === 3, `${viewport.name}: icons must be aria-hidden`);
      check((await section.evaluate((element) => getComputedStyle(element).backgroundColor)) === "rgb(246, 244, 239)", `${viewport.name}: section must use the warm light background`);
      check(await section.evaluate((element) => element.previousElementSibling?.getAttribute("data-card-grid-variant") === "equipment-lineup"), `${viewport.name}: Block5 adjacency changed`);
      check(await section.evaluate((element) => element.nextElementSibling?.classList.contains("cases-emergency")), `${viewport.name}: Block10 adjacency changed`);

      const boxes = await itemBoxes(page);
      check(uniqueCoordinates(boxes, "x").length === viewport.columns, `${viewport.name}: incorrect column count`);
      check(uniqueCoordinates(boxes, "y").length === (viewport.columns === 1 ? 3 : 1), `${viewport.name}: incorrect row count`);
      const connector = await list.evaluate((element) => {
        const style = getComputedStyle(element, "::before");
        return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height), color: style.backgroundColor };
      });
      check(connector.color === "rgb(231, 101, 37)", `${viewport.name}: connector must use the accent color`);
      check(
        viewport.columns === 1 ? connector.height > connector.width : connector.width > connector.height,
        `${viewport.name}: connector orientation is incorrect`,
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);

      await section.screenshot({ path: `artifacts/compatibility-system-${viewport.name}.png` });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "layout" || mode === "all") await verifyLayout();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Compatibility system ${mode} verification passed`);
```

- [ ] **Step 3: Запустить RED-проверку**

```powershell
npm run test:compatibility-system -- structure
```

Ожидаемый результат: exit code `1` с сообщениями об отсутствующих typed icon, `data-compatibility-system`, OL/LI, SVG-ветках и трёх icon-значениях.

- [ ] **Step 4: Закоммитить контракт**

```powershell
git add package.json scripts/verify-compatibility-system.mjs
git commit -m "test: define compatibility system behavior"
```

---

### Task 2: Добавить семантику системы и SVG-пиктограммы

**Files:**
- Modify: `src/components/features/equipment-process-02.astro`
- Modify: `src/pages/index.astro`
- Test: `scripts/verify-compatibility-system.mjs`

**Interfaces:**
- Consumes: `icon?: "stove" | "structure" | "route"` в каждом item Block8.
- Produces: `[data-compatibility-system]`, `<ol class="equipment-process__items">`, три `<li class="equipment-process__item">` и три декоративных inline SVG.

- [ ] **Step 1: Расширить тип Item и default data**

Заменить frontmatter `equipment-process-02.astro` на:

```astro
---
interface Item {
  title: string;
  text: string;
  icon?: "stove" | "structure" | "route";
}

interface Props {
  eyebrow?: string;
  headline?: string;
  items?: Item[];
}

const {
  eyebrow = "Инструменты",
  headline = "Оборудование встроено в процесс, а не показано ради эффекта",
  items = [
    { title: "Диагностика", text: "Выбираем метод после осмотра материалов и источника проблемы.", icon: "stove" },
    { title: "Обработка", text: "Комбинируем механическую очистку, составы, туман или озон.", icon: "structure" },
    { title: "Контроль", text: "Проверяем, что обработка не конфликтует с дальнейшим ремонтом или проживанием.", icon: "route" },
  ],
} = Astro.props;
---
```

- [ ] **Step 2: Заменить markup перед `<style>`**

Использовать:

```astro
<section class="equipment-process" data-compatibility-system>
  <div class="equipment-process__inner">
    <header class="equipment-process__header">
      {eyebrow && <p class="equipment-process__eyebrow">{eyebrow}</p>}
      <h2>{headline}</h2>
    </header>
    <ol class="equipment-process__items">
      {items.map((item, index) => (
        <li class="equipment-process__item" data-icon={item.icon}>
          <span class="equipment-process__marker">{String(index + 1).padStart(2, "0")}</span>
          {item.icon && (
            <div class="equipment-process__icon">
              {item.icon === "stove" && (
                <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                  <path d="M18 14h28v38H18z M23 22h18v18H23z M22 52l-3 6 M42 52l3 6 M26 9h12v5" />
                  <circle cx="37" cy="45" r="1.5" />
                </svg>
              )}
              {item.icon === "structure" && (
                <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                  <path d="M10 30 32 12l22 18v24H10z M18 26v28 M46 26v28 M10 39h44 M24 54V38h16v16" />
                </svg>
              )}
              {item.icon === "route" && (
                <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                  <path d="M12 50h15V30h13V13h12 M46 8l6 5-6 5 M19 24l8 6-8 6" />
                  <circle cx="12" cy="50" r="3" />
                </svg>
              )}
            </div>
          )}
          <div class="equipment-process__copy">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 3: Добавить icon-значения в Block8 data**

В `blockProps[5].items` сохранить текущие `title` и `text`, добавив:

```js
{
  "title": "Печь",
  "text": "Модель, мощность, масса и направление выхода дымохода.",
  "icon": "stove"
},
{
  "title": "Конструкции",
  "text": "Стены, пол, перекрытия, кровля, балки и стропила.",
  "icon": "structure"
},
{
  "title": "Маршрут",
  "text": "Высота, конфигурация, обслуживание и внешний вид узла.",
  "icon": "route"
}
```

- [ ] **Step 4: Запустить GREEN-проверку структуры**

```powershell
npm run test:compatibility-system -- structure
npm run check
```

Ожидаемый результат: `Compatibility system structure verification passed`; Astro сообщает `0 errors`, `0 warnings`, `0 hints`.

- [ ] **Step 5: Закоммитить семантику**

```powershell
git add src/components/features/equipment-process-02.astro src/pages/index.astro
git commit -m "feat: add compatibility system semantics"
```

---

### Task 3: Реализовать светлую связанную композицию

**Files:**
- Modify: `src/components/features/equipment-process-02.astro`
- Create: `artifacts/compatibility-system-desktop.png`
- Create: `artifacts/compatibility-system-tablet.png`
- Create: `artifacts/compatibility-system-mobile.png`
- Test: `scripts/verify-compatibility-system.mjs`

**Interfaces:**
- Consumes: semantic markup и icon-значения из Task 2.
- Produces: светлый 3-column desktop/tablet layout, vertical mobile system и три visual QA-артефакта.

- [ ] **Step 1: Полностью заменить текущий `<style>`**

Использовать:

```css
<style>
  .equipment-process {
    padding: var(--spacing-section, 96px) var(--space-4, 16px);
    background: var(--color-background, #f6f4ef);
    color: var(--color-primary-dark, #0b1f33);
  }

  .equipment-process__inner {
    width: min(100%, var(--container-width, 1180px));
    margin: 0 auto;
  }

  .equipment-process__header {
    max-width: 900px;
    margin-bottom: 56px;
  }

  .equipment-process__eyebrow {
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    margin: 0 0 var(--space-4, 16px);
    color: var(--color-accent, #e76525);
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-xs, 12px);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .equipment-process__eyebrow::before {
    width: 28px;
    height: 2px;
    flex: 0 0 auto;
    background: currentColor;
    content: "";
  }

  .equipment-process h2 {
    margin: 0;
    color: var(--color-primary-dark, #0b1f33);
    font-family: var(--font-heading, sans-serif);
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .equipment-process__items {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4, 16px);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .equipment-process__items::before {
    position: absolute;
    top: 25px;
    right: calc(100% / 6);
    left: calc(100% / 6);
    z-index: 0;
    height: 2px;
    background: var(--color-accent, #e76525);
    content: "";
  }

  .equipment-process__item {
    position: relative;
    z-index: 1;
    min-width: 0;
    min-height: 284px;
    padding: 0 var(--space-6, 24px) var(--space-6, 24px);
    border: 1px solid rgb(11 31 51 / 14%);
    border-radius: 18px;
    background: var(--color-surface, #ffffff);
    box-shadow: 0 14px 34px rgb(11 31 51 / 7%);
  }

  .equipment-process__marker {
    position: relative;
    display: grid;
    width: 52px;
    height: 52px;
    margin: 0 auto;
    place-items: center;
    border: 6px solid var(--color-background, #f6f4ef);
    border-radius: 50%;
    background: var(--color-accent, #e76525);
    color: var(--color-white, #ffffff);
    font-family: var(--font-heading, sans-serif);
    font-size: 0.68rem;
    font-weight: 800;
    transform: translateY(-1px);
  }

  .equipment-process__icon {
    display: grid;
    width: 72px;
    height: 72px;
    margin: var(--space-5, 20px) auto 0;
    place-items: center;
    color: #173a53;
  }

  .equipment-process__icon svg {
    width: 64px;
    height: 64px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .equipment-process__copy {
    margin-top: var(--space-4, 16px);
    text-align: center;
  }

  .equipment-process h3 {
    margin: 0;
    color: var(--color-primary-dark, #0b1f33);
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-xl, 22px);
    line-height: 1.15;
  }

  .equipment-process__copy p {
    max-width: 290px;
    margin: var(--space-3, 12px) auto 0;
    color: var(--color-text-muted, #60717d);
    font-family: var(--font-body, sans-serif);
    font-size: var(--text-sm, 14px);
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    .equipment-process__header {
      margin-bottom: 48px;
    }

    .equipment-process__item {
      min-height: 270px;
      padding-right: var(--space-4, 16px);
      padding-left: var(--space-4, 16px);
    }

    .equipment-process__icon {
      width: 60px;
      height: 60px;
    }

    .equipment-process__icon svg {
      width: 54px;
      height: 54px;
    }

    .equipment-process h3 {
      font-size: 1.15rem;
    }

    .equipment-process__copy p {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 760px) {
    .equipment-process__header {
      margin-bottom: 40px;
    }

    .equipment-process__eyebrow {
      font-size: 0.68rem;
    }

    .equipment-process h2 {
      font-size: clamp(2rem, 10vw, 2.7rem);
    }

    .equipment-process__items {
      grid-template-columns: 1fr;
      gap: var(--space-3, 12px);
      padding-left: 44px;
    }

    .equipment-process__items::before {
      top: 24px;
      right: auto;
      bottom: 24px;
      left: 17px;
      width: 2px;
      height: auto;
    }

    .equipment-process__item {
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr);
      align-items: center;
      min-height: 154px;
      padding: var(--space-4, 16px);
    }

    .equipment-process__marker {
      position: absolute;
      top: 50%;
      left: -44px;
      width: 36px;
      height: 36px;
      margin: 0;
      border-width: 5px;
      font-size: 0.58rem;
      transform: translateY(-50%);
    }

    .equipment-process__icon {
      width: 56px;
      height: 56px;
      margin: 0;
    }

    .equipment-process__icon svg {
      width: 48px;
      height: 48px;
    }

    .equipment-process__copy {
      margin: 0;
      text-align: left;
    }

    .equipment-process h3 {
      font-size: 1.05rem;
    }

    .equipment-process__copy p {
      max-width: none;
      margin-top: var(--space-2, 8px);
      font-size: 0.78rem;
      line-height: 1.52;
    }
  }
</style>
```

- [ ] **Step 2: Проверить background server и запустить layout contract**

```powershell
npx astro dev status
npm run test:compatibility-system -- layout
```

Если сервер не запущен, перед тестом выполнить:

```powershell
npx astro dev --background --host 127.0.0.1 --port 4321
```

Ожидаемый результат: `Compatibility system layout verification passed`; созданы три PNG.

- [ ] **Step 3: Осмотреть три артефакта через `view_image`**

Проверить:

- desktop 1440: три равных модуля, единая горизонтальная линия и полный текст;
- tablet 768: три колонки без переполнения и обрезки;
- mobile 390: три компактные строки, вертикальная линия и полный текст;
- Block8 визуально светлый, без интерактивных affordance и лишней пустоты.

- [ ] **Step 4: Запустить полную регрессию**

```powershell
npm run test:hero
npm run test:social-qr
npm run test:quiz
npm run test:installation-route
npm run test:equipment-lineup
npm run test:section-removal
npm run test:compatibility-system
npm run check
npm run build
```

Ожидаемый результат: все тесты проходят, Astro сообщает `0 errors`, `0 warnings`, `0 hints`, build создаёт два маршрута.

Если браузерные тесты механически изменили ранее отслеживаемые PNG без изменения соответствующих компонентов, восстановить только эти сгенерированные файлы из `HEAD` и повторно проверить `git status --short`.

- [ ] **Step 5: Обновить graphify-граф**

```powershell
npx graphify hook-rebuild
```

При известной ошибке `could not determine executable to run` не устанавливать сторонний пакет и указать ограничение в итоговом отчёте.

- [ ] **Step 6: Закоммитить визуальный слой и артефакты**

```powershell
git add src/components/features/equipment-process-02.astro artifacts/compatibility-system-desktop.png artifacts/compatibility-system-tablet.png artifacts/compatibility-system-mobile.png
git commit -m "style: add responsive compatibility system"
```

- [ ] **Step 7: Подтвердить чистое состояние**

```powershell
git status --short
git log -5 --oneline
```

Ожидаемый результат: рабочее дерево чистое; отдельные коммиты контракта, семантики и visual layer видны в истории.
