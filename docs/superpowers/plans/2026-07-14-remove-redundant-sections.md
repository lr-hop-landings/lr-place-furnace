# Redundant Sections Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить со страницы три избыточные секции и соединить линейку печей напрямую с блоком совместимости, а блок совместимости — со сценариями оценки.

**Architecture:** Удаление выполняется в `src/pages/index.astro` на уровне импортов, данных и вызовов компонентов. Два оставшихся без потребителей компонента и устаревший артефакт удаляются, индексы последующих `blockProps` обновляются, а отдельный Node/Playwright-контракт защищает новую последовательность Block5 → Block8 → Block10.

**Tech Stack:** Astro 7, TypeScript в `.astro`, Node.js ESM, Playwright, существующие npm scripts, Git.

## Global Constraints

- Удаляются три секции: сравнение металлической и кирпичной печи, типы домов и таблица формирования стоимости.
- Удалённые секции не заменяются переходными плашками, CTA или новой разметкой.
- Тексты, порядок и адаптивные стили оставшихся блоков не меняются.
- `materials-card-grid-01.astro` сохраняется для варианта `equipment-lineup` Block5.
- Имена оставшихся импортов Block8, Block10–Block17 не переименовываются.
- Работа выполняется коммитами непосредственно в `main` по ранее выбранному пользователем процессу.
- Dev server управляется через `astro dev --background`, `astro dev status`, `astro dev logs` и `astro dev stop`.
- После изменения кода запускается `npx graphify hook-rebuild`; при ошибке отсутствующего executable пакет не устанавливается самовольно.

---

### Task 1: Зафиксировать контракт удаления трёх секций

**Files:**
- Create: `scripts/verify-section-removal.mjs`
- Modify: `package.json`
- Test: `scripts/verify-section-removal.mjs`

**Interfaces:**
- Consumes: `src/pages/index.astro`, файловую структуру компонентов и маршрут `/ustanovka-metallicheskih-pechey/`.
- Produces: npm script `test:section-removal` с режимами `structure`, `layout` и `all`; desktop/mobile артефакты новой последовательности.

- [ ] **Step 1: Добавить npm script**

В `package.json` добавить:

```json
"test:section-removal": "node scripts/verify-section-removal.mjs all"
```

- [ ] **Step 2: Создать статический и браузерный контракт**

Создать `scripts/verify-section-removal.mjs`:

```js
import { chromium } from "playwright";
import { access, mkdir, readFile } from "node:fs/promises";

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:4321";
const route = new URL("/ustanovka-metallicheskih-pechey/", baseURL).href;
const requestedMode = process.argv.at(-1);
const mode = ["structure", "layout", "all"].includes(requestedMode) ? requestedMode : "structure";
const failures = [];

const removedHeadlines = [
  "Здесь рассчитываем установку готовой металлической печи",
  "Монтаж печи в деревянном, каркасном или каменном доме",
  "Из чего складывается расчёт установки",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function verifyStructure() {
  const page = await readFile("src/pages/index.astro", "utf8");

  for (const headline of removedHeadlines) {
    check(!page.includes(headline), `removed data remains: ${headline}`);
  }

  check(!page.includes("comparison-method-table-02.astro"), "comparison import remains");
  check(!page.includes('import Block7 from "../components/features/materials-card-grid-01.astro"'), "Block7 import remains");
  check(!page.includes("pricing-service-table-02.astro"), "pricing import remains");
  check(!/<Block6\b/.test(page), "Block6 render remains");
  check(!/<Block7\b/.test(page), "Block7 render remains");
  check(!/<Block9\b/.test(page), "Block9 render remains");
  check(/<Block5\s+\{\.\.\.blockProps\[4\]\}\s+variant="equipment-lineup"\s*\/>/.test(page), "Block5 wiring changed");
  check(/<Block8\s+\{\.\.\.blockProps\[5\]\}\s*\/>/.test(page), "Block8 must consume blockProps[5]");
  check(/<Block10\s+\{\.\.\.blockProps\[6\]\}\s*\/>/.test(page), "Block10 must consume blockProps[6]");
  check(/<Block11\s+\{\.\.\.blockProps\[7\]\}\s*\/>/.test(page), "Block11 must consume blockProps[7]");
  check(/<Block17\s+\{\.\.\.blockProps\[13\]\}\s*\/>/.test(page), "Block17 must consume blockProps[13]");

  check(!(await pathExists("src/components/comparison/comparison-method-table-02.astro")), "unused comparison component still exists");
  check(!(await pathExists("src/components/pricing/pricing-service-table-02.astro")), "unused pricing component still exists");
  check(await pathExists("src/components/features/materials-card-grid-01.astro"), "Block5 component was removed");
  check(!(await pathExists("artifacts/materials-card-grid-block7-desktop.png")), "obsolete Block7 artifact still exists");
}

async function waitForLineupImages(page) {
  const lineup = page.locator('[data-card-grid-variant="equipment-lineup"]');
  await lineup.scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-card-grid-variant="equipment-lineup"] img')].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function verifyLayout() {
  await mkdir("artifacts", { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1440, height: 1000, name: "desktop" },
      { width: 390, height: 900, name: "mobile" },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });

      const lineup = page.locator('[data-card-grid-variant="equipment-lineup"]');
      const compatibility = page.locator(".equipment-process");
      const cases = page.locator(".cases-emergency");
      await lineup.waitFor({ state: "visible" });
      await waitForLineupImages(page);

      check(await lineup.evaluate((element) => element.nextElementSibling?.classList.contains("equipment-process")), `${viewport.name}: Block8 must immediately follow Block5`);
      check(await compatibility.evaluate((element) => element.nextElementSibling?.classList.contains("cases-emergency")), `${viewport.name}: Block10 must immediately follow Block8`);
      check((await page.locator(".method-comparison").count()) === 0, `${viewport.name}: comparison block remains`);
      check((await page.locator('[data-card-grid-variant="cards"]').count()) === 0, `${viewport.name}: house card grid remains`);
      check((await page.locator(".service-prices").count()) === 0, `${viewport.name}: pricing block remains`);

      const bodyText = await page.locator("body").innerText();
      for (const headline of removedHeadlines) {
        check(!bodyText.includes(headline), `${viewport.name}: removed headline remains: ${headline}`);
      }
      check(!bodyText.includes("Обычная уборка") && !bodyText.includes("Профессионально"), `${viewport.name}: template labels remain`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}: page overflows horizontally by ${overflow}px`);

      const clip = await lineup.evaluate((element) => {
        const first = element.getBoundingClientRect();
        const third = element.nextElementSibling?.nextElementSibling?.getBoundingClientRect();
        const y = first.top + window.scrollY;
        const bottom = (third?.bottom ?? first.bottom) + window.scrollY;
        return { x: 0, y, width: document.documentElement.clientWidth, height: bottom - y };
      });
      await page.screenshot({ path: `artifacts/section-removal-transition-${viewport.name}.png`, clip });
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

console.log(`Section removal ${mode} verification passed`);
```

- [ ] **Step 3: Запустить RED-проверку**

```powershell
npm run test:section-removal -- structure
```

Ожидаемый результат: exit code `1`; проверка перечисляет три оставшихся объекта данных, импорты/вызовы Block6, Block7, Block9, старые индексы, два существующих компонента и устаревший артефакт.

- [ ] **Step 4: Закоммитить тестовый контракт**

```powershell
git add package.json scripts/verify-section-removal.mjs
git commit -m "test: define redundant section removal"
```

---

### Task 2: Удалить секции, данные и неиспользуемые компоненты

**Files:**
- Modify: `src/pages/index.astro`
- Delete: `src/components/comparison/comparison-method-table-02.astro`
- Delete: `src/components/pricing/pricing-service-table-02.astro`
- Delete: `artifacts/materials-card-grid-block7-desktop.png`
- Modify: `scripts/verify-equipment-lineup.mjs`
- Modify: `scripts/verify-social-qr.mjs`
- Test: `scripts/verify-section-removal.mjs`

**Interfaces:**
- Consumes: 17 текущих объектов `blockProps`, импорты Block1–Block17 и существующие контракты Block5/Block11.
- Produces: 14 объектов данных и последовательность вызовов Block1–Block5, Block8, Block10–Block17; Block8 использует `[5]`, Block10 `[6]`, Block11 `[7]`, Block17 `[13]`.

- [ ] **Step 1: Удалить три импорта**

Из `src/pages/index.astro` удалить:

```astro
import Block6 from "../components/comparison/comparison-method-table-02.astro";
import Block7 from "../components/features/materials-card-grid-01.astro";
import Block9 from "../components/pricing/pricing-service-table-02.astro";
```

- [ ] **Step 2: Удалить три объекта `blockProps`**

Полностью удалить объекты, которые идентифицируются этими заголовками:

```text
Здесь рассчитываем установку готовой металлической печи
Монтаж печи в деревянном, каркасном или каменном доме
Из чего складывается расчёт установки
```

Не изменять соседние объекты «Устанавливаем стальные, чугунные печи и печи-камины», «До сметы проверяем совместимость оборудования и дома» и «Какие объекты можно рассчитать».

- [ ] **Step 3: Заменить список вызовов после Block5**

Использовать точную последовательность:

```astro
    <Block5 {...blockProps[4]} variant="equipment-lineup" />
    <Block8 {...blockProps[5]} />
    <Block10 {...blockProps[6]} />
    <Block11 {...blockProps[7]} />
    <Block12 {...blockProps[8]} />
    <Block13 {...blockProps[9]} />
    <Block14 {...blockProps[10]} />
    <Block15 {...blockProps[11]} />
    <Block16 {...blockProps[12]} />
    <Block17 {...blockProps[13]} />
```

- [ ] **Step 4: Удалить два компонента и старый артефакт**

Удалить только:

```text
src/components/comparison/comparison-method-table-02.astro
src/components/pricing/pricing-service-table-02.astro
artifacts/materials-card-grid-block7-desktop.png
```

Файл `src/components/features/materials-card-grid-01.astro` сохранить.

- [ ] **Step 5: Актуализировать equipment-lineup контракт**

В `scripts/verify-equipment-lineup.mjs` заменить статическую проверку Block7:

```js
check(!/<Block7\b/.test(page), "removed Block7 must not render");
```

В `verifyLayout()` удалить:

```js
const defaultGrid = desktop.locator('[data-card-grid-variant="cards"]');
```

Удалить две проверки `defaultGrid`:

```js
check((await defaultGrid.locator(".card-grid__slider.swiper").count()) === 1, "Block7 lost its default Swiper container");
check((await defaultGrid.locator(".card-grid__nav").count()) === 1, "Block7 lost its slider navigation");
```

Удалить снимок отсутствующего Block7:

```js
await defaultGrid.screenshot({ path: "artifacts/materials-card-grid-block7-desktop.png" });
```

- [ ] **Step 6: Актуализировать social QR контракт**

В `scripts/verify-social-qr.mjs` заменить индекс Block11 с `[10]` на `[7]`:

```js
/<Block11\s+\{\.\.\.blockProps\[7\]\}\s*\/>/.test(page)
```

Остальную проверку варианта Block11 оставить без изменений.

- [ ] **Step 7: Запустить GREEN-проверки**

```powershell
npm run test:section-removal -- structure
npm run test:equipment-lineup -- structure
npm run test:social-qr
npm run check
```

Ожидаемый результат: три контракта проходят; Astro сообщает `0 errors`, `0 warnings`, `0 hints`.

- [ ] **Step 8: Закоммитить удаление**

```powershell
git add src/pages/index.astro src/components/comparison/comparison-method-table-02.astro src/components/pricing/pricing-service-table-02.astro artifacts/materials-card-grid-block7-desktop.png scripts/verify-equipment-lineup.mjs scripts/verify-social-qr.mjs
git commit -m "refactor: remove redundant landing sections"
```

---

### Task 3: Проверить новую последовательность и полную регрессию

**Files:**
- Create: `artifacts/section-removal-transition-desktop.png`
- Create: `artifacts/section-removal-transition-mobile.png`
- Test: `scripts/verify-section-removal.mjs`

**Interfaces:**
- Consumes: background dev server на `http://127.0.0.1:4321` и финальную последовательность Block5 → Block8 → Block10.
- Produces: два визуальных артефакта и подтверждённую production-сборку.

- [ ] **Step 1: Проверить background server**

```powershell
npx astro dev status
```

Если сервер не запущен:

```powershell
npx astro dev --background --host 127.0.0.1 --port 4321
```

- [ ] **Step 2: Запустить полный контракт удаления**

```powershell
npm run test:section-removal
```

Ожидаемый результат: `Section removal all verification passed`; созданы desktop/mobile PNG.

- [ ] **Step 3: Осмотреть оба артефакта через `view_image`**

Проверить:

- Block5 непосредственно переходит в Block8;
- Block8 непосредственно переходит в Block10;
- нет пустых секций, старых заголовков и горизонтального overflow;
- изображения печей загружены на обеих ширинах;
- оставшиеся секции не перекрываются.

- [ ] **Step 4: Запустить полный регрессионный набор**

```powershell
npm run test:hero
npm run test:social-qr
npm run test:quiz
npm run test:installation-route
npm run test:equipment-lineup
npm run test:section-removal
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

- [ ] **Step 6: Закоммитить новые визуальные артефакты**

```powershell
git add artifacts/section-removal-transition-desktop.png artifacts/section-removal-transition-mobile.png
git commit -m "test: capture streamlined section flow"
```

- [ ] **Step 7: Подтвердить чистое состояние**

```powershell
git status --short
git log -5 --oneline
```

Ожидаемый результат: рабочее дерево чистое; отдельные коммиты тестового контракта, удаления секций и визуальных артефактов видны в истории.
