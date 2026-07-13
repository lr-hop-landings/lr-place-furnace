# Dual-Render Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the complete installation quiz inline and in a modal at the same time, with synchronized steps, values and files, while keeping the inline section height stable when the modal opens.

**Architecture:** Extract the repeated form markup into a focused Astro child component and render it twice from the existing public block component. Replace the duplicated inline/global scripts with one controller in `src/scripts/site.ts`; the controller owns one state object per quiz root and mirrors it into both HTML forms.

**Tech Stack:** Astro 7, TypeScript DOM APIs, scoped CSS, Playwright 1.60, Node structural checks.

## Global Constraints

- Preserve all existing questions, option values, field names, copy props and `data-hop-lead-form` integration.
- Render exactly two complete forms: `inline` and `modal`; do not move one form between containers.
- Keep private values and `File[]` in memory only; persist only the explicit safe field allowlist in `sessionStorage`.
- Opening or closing the modal must not change the inline section height by more than one pixel.
- Do not add dependencies or change the external lead-capture service.
- Remove the inline `initLeadQuiz` script from the Astro component; `src/scripts/site.ts` is the only controller source.

---

### Task 1: Define the dual-render behavior with a failing verifier

**Files:**

- Create: `scripts/verify-quiz.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: `SITE_URL`, defaulting to `http://127.0.0.1:4321`.
- Produces: `npm run test:quiz`, with modes `structure`, `behavior`, `layout`, and `all`.

- [ ] **Step 1: Write the structural and browser verifier**

Implement a verifier with this mode contract:

```js
const mode = process.argv[2] ?? "structure";
if (mode === "structure" || mode === "all") await verifyStructure();
if (mode === "behavior" || mode === "all") await verifyBehavior();
if (mode === "layout" || mode === "all") await verifyLayout();
```

`verifyStructure()` must read the parent component, child component and `site.ts`, then assert:

```js
check(parent.includes('instance="inline"'), "inline quiz form is missing");
check(parent.includes('instance="modal"'), "modal quiz form is missing");
check(child.includes("data-quiz-form"), "shared quiz form marker is missing");
check(child.includes("data-file-summary"), "shared file summary is missing");
check(!parent.includes("const initLeadQuiz"), "component still duplicates the quiz controller");
check(site.includes("interface QuizState"), "shared QuizState is missing");
```

`verifyBehavior()` must use Playwright at 1440×1000 and assert:

- there are exactly two `[data-quiz-form]` elements;
- all IDs under the quiz root are unique;
- selecting a radio inline checks the matching modal radio;
- advancing inline updates both step labels;
- opening the modal preserves the current step and section height;
- selecting an option in the modal mirrors inline;
- closing by Escape preserves state and returns focus;
- a file selected in one form appears once in `new FormData(otherForm)`;
- phone and location values mirror;
- submitting the active form fires one submit on it and zero on the other form.

`verifyLayout()` must save:

```text
artifacts/quiz-inline-desktop.png
artifacts/quiz-modal-desktop.png
artifacts/quiz-inline-mobile.png
artifacts/quiz-modal-mobile.png
artifacts/quiz-contact-mobile.png
```

It must also assert no horizontal overflow at 390 px and visible focus outlines for modal-open, close, option and primary action controls.

- [ ] **Step 2: Add the npm script**

Add:

```json
"test:quiz": "node scripts/verify-quiz.mjs all"
```

- [ ] **Step 3: Run the verifier to prove RED**

Run: `node scripts/verify-quiz.mjs structure`

Expected: FAIL because the child component, two instances and shared state do not exist.

- [ ] **Step 4: Commit the test contract**

```bash
git add scripts/verify-quiz.mjs package.json
git commit -m "test: define dual-render quiz behavior"
```

### Task 2: Extract and render two complete Astro forms

**Files:**

- Create: `src/components/quiz/lead-quiz-form.astro`
- Modify: `src/components/quiz/lead-quiz-modal-01.astro`

**Interfaces:**

- Consumes: the existing `steps`, `submitText`, `privacyText`, quiz ID and five stable field names.
- Produces: two forms marked `data-quiz-form` and `data-quiz-instance="inline|modal"`, with unique instance-prefixed IDs.

- [ ] **Step 1: Create the focused child component**

Define the exact props and prefix:

```astro
---
interface QuizStep { question: string; options: string[]; }
interface Props {
  instance: "inline" | "modal";
  quizId: string;
  steps: QuizStep[];
  submitText: string;
  privacyText: string;
}
const { instance, quizId, steps, submitText, privacyText } = Astro.props;
const prefix = `${quizId}-${instance}`;
const stepNames = ["object_type", "house_type", "stove_status", "services[]", "chimney_route"];
---
```

Render one complete panel containing:

```astro
<div class="lead-quiz-form" data-quiz-view={instance} data-lead-root>
  <div class="lead-quiz-form__topline">
    <p data-quiz-step-label>Шаг 1 из 6</p>
    {instance === "inline" && <button type="button" data-quiz-open>Открыть в большом окне</button>}
  </div>
  <div class="lead-quiz-form__progress" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="1">
    <span data-quiz-progress></span>
  </div>
  <form id={`${prefix}-form`} data-quiz-form data-quiz-instance={instance} data-hop-lead-form novalidate>
    <!-- all five question fieldsets, the contact fieldset and actions -->
  </form>
  <div data-lead-status tabindex="-1" hidden></div>
  <div data-lead-success hidden>Спасибо! Данные получены. Мы изучим параметры и свяжемся выбранным способом.</div>
</div>
```

For each control, derive IDs from `prefix`, step index and option index. Add `data-phone-input`, `data-phone-value`, `data-dialpad`, `data-file-input`, `data-file-summary`, `data-quiz-back`, `data-quiz-next` and `data-quiz-submit` to the same functional elements as the current component.

- [ ] **Step 2: Add child-scoped form styles**

Implement the shared white card, progress, option, field, dialpad, action and focus styles in the child component. Use these exact layout rules:

```css
.lead-quiz-form { padding: clamp(20px, 3vw, 30px); border-radius: 20px; background: var(--color-surface); color: var(--color-text); }
.lead-quiz-form__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.lead-quiz-form__option:has(input:checked) { border-color: var(--color-accent); background: var(--color-accent-light); }
@media (max-width: 760px) {
  .lead-quiz-form__options, .lead-quiz-form__fields { grid-template-columns: 1fr; }
  .lead-quiz-form__desktop-phone, .lead-quiz-form__name-field { display: none; }
  .lead-quiz-form__dialpad { display: grid; }
}
```

Every interactive control must have a `:focus-visible` outline of at least 3 px.

- [ ] **Step 3: Refactor the parent into section + two mounts**

Import the child and render it twice:

```astro
<div class="lead-quiz__layout">
  <div class="lead-quiz__copy">...</div>
  <QuizForm instance="inline" quizId={id} steps={steps} submitText={submitText} privacyText={privacyText} />
</div>
<div class="lead-quiz__modal" data-quiz-modal aria-hidden="true">
  <div class="lead-quiz__dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-modal-title`}>
    <h2 id={`${id}-modal-title`} class="visually-hidden">Расчёт монтажа</h2>
    <button type="button" data-quiz-close aria-label="Закрыть квиз">×</button>
    <QuizForm instance="modal" quizId={id} steps={steps} submitText={submitText} privacyText={privacyText} />
  </div>
</div>
```

Delete the old form markup and the entire inline `<script>`. Keep parent styles only for the dark section, two-column layout, copy, modal overlay and dialog.

- [ ] **Step 4: Run the structural verifier**

Run: `node scripts/verify-quiz.mjs structure`

Expected: structural markup checks pass; behavior remains red until Task 3.

- [ ] **Step 5: Run Astro type checking**

Run: `npm run check`

Expected: 0 errors, 0 warnings, 0 hints.

- [ ] **Step 6: Commit the component boundary**

```bash
git add src/components/quiz/lead-quiz-form.astro src/components/quiz/lead-quiz-modal-01.astro
git commit -m "refactor: render inline and modal quiz forms"
```

### Task 3: Implement the shared controller and file-safe submission

**Files:**

- Modify: `src/scripts/site.ts`
- Test: `scripts/verify-quiz.mjs`

**Interfaces:**

- Consumes: both `[data-quiz-form]` instances from Task 2.
- Produces: one `QuizState` per `[data-lead-quiz]` and synchronized view rendering.

- [ ] **Step 1: Define shared state and view adapters**

Add these types near `initLeadQuiz`:

```ts
interface QuizState {
  currentStep: number;
  values: Map<string, string | string[]>;
  files: File[];
  phoneDigits: string;
  submitted: boolean;
}

interface QuizView {
  form: HTMLFormElement;
  instance: "inline" | "modal";
  steps: HTMLElement[];
  progress: HTMLElement | null;
  progressRoot: HTMLElement | null;
  stepLabel: HTMLElement | null;
  backButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
  submitButton: HTMLButtonElement | null;
  fileInput: HTMLInputElement | null;
  fileSummary: HTMLElement | null;
}
```

Build `views` from all `[data-quiz-form]` nodes; do not use `root.querySelector("form")` or a single set of controls.

- [ ] **Step 2: Implement value collection and mirroring**

Use explicit branches for radios, checkboxes and scalar controls:

```ts
const updateStateFromControl = (control: HTMLInputElement | HTMLTextAreaElement) => {
  if (!control.name || control.type === "file") return;
  if (control.type === "radio") {
    if (control.checked) state.values.set(control.name, control.value);
  } else if (control.type === "checkbox" && control.name.endsWith("[]")) {
    const source = control.form;
    const values = Array.from(source?.elements.namedItem(control.name) as RadioNodeList ?? [])
      .filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.checked)
      .map((item) => item.value);
    state.values.set(control.name, values);
  } else if (control.type === "checkbox") {
    state.values.set(control.name, control.checked ? control.value : "");
  } else {
    state.values.set(control.name, control.value);
  }
  renderValues();
};
```

`renderValues()` must update matching controls in both forms without dispatching synthetic `input` or `change` events.

- [ ] **Step 3: Synchronize steps, progress, validation and phone input**

Implement one `render()` that iterates over both `QuizView` objects. Bind both forms' Back/Next controls to the shared `currentStep`. Validate the active view before advancing. Normalize all phone sources into the shared hidden `phone` value, mirror the visible desktop field, dialpad display and `phoneDigits` into both instances.

- [ ] **Step 4: Persist only safe fields**

Use the exact allowlist:

```ts
const persistedFields = new Set([
  "object_type",
  "house_type",
  "stove_status",
  "services[]",
  "chimney_route",
  "contact_method",
]);
```

Load these values from `sessionStorage.getItem("lr-furnace-quiz")` during initialization and write only these values after relevant changes. Do not serialize files, name, phone, location, model, comment or consent.

- [ ] **Step 5: Synchronize files and FormData**

On file-input change, set `state.files = Array.from(input.files ?? [])`, update both summaries, and mirror with `DataTransfer` where available. On each form:

```ts
form.addEventListener("formdata", (event) => {
  event.formData.delete("photos[]");
  state.files.forEach((file) => event.formData.append("photos[]", file, file.name));
});
```

The summary must say `Файлы не выбраны` for zero, `1 файл: name.jpg` for one, and `${count} файла: ...` / `${count} файлов: ...` with filenames for multiple files.

- [ ] **Step 6: Implement modal focus management**

Open the modal on the shared current step, record the opener, lock body scroll and focus the close button. Close on the button, Escape or backdrop and restore focus. While open, wrap Tab/Shift+Tab between focusable dialog controls.

- [ ] **Step 7: Synchronize success without double submission**

Each submit handler validates only its own contact step and never calls `requestSubmit()` on the other form. Observe both `[data-lead-success]` nodes; when one becomes visible, set `state.submitted = true`, hide both forms and reveal both success nodes.

- [ ] **Step 8: Run the browser behavior test**

Run: `node scripts/verify-quiz.mjs behavior`

Expected: all synchronization, file, focus, height and single-submit assertions pass.

- [ ] **Step 9: Run regression and static checks**

Run:

```bash
npm run test:hero
npm run test:social-qr
npm run check
```

Expected: all exit 0; Astro reports 0 errors, warnings and hints.

- [ ] **Step 10: Commit the controller**

```bash
git add src/scripts/site.ts scripts/verify-quiz.mjs
git commit -m "feat: synchronize inline and modal quiz forms"
```

### Task 4: Visual QA and refinement

**Files:**

- Modify if required: `src/components/quiz/lead-quiz-form.astro`
- Modify if required: `src/components/quiz/lead-quiz-modal-01.astro`
- Create: `artifacts/quiz-inline-desktop.png`
- Create: `artifacts/quiz-modal-desktop.png`
- Create: `artifacts/quiz-inline-mobile.png`
- Create: `artifacts/quiz-modal-mobile.png`
- Create: `artifacts/quiz-contact-mobile.png`

**Interfaces:**

- Consumes: fully working dual-render quiz.
- Produces: approved desktop/mobile evidence without layout overflow or stale dev-toolbar UI.

- [ ] **Step 1: Confirm the required background server**

Run: `npx astro dev status`

If needed, start exactly: `npx astro dev --background --host 127.0.0.1 --port 4321`.

- [ ] **Step 2: Capture and inspect all five states**

Run: `node scripts/verify-quiz.mjs layout`

Inspect each output with the local image viewer. Confirm the inline section has balanced left copy/right form, the modal is a visual continuation, and mobile controls remain comfortably tappable.

- [ ] **Step 3: Refine only block-3 styles**

Limit changes to the two quiz components. Do not change shared global tokens or neighboring sections. Re-run `node scripts/verify-quiz.mjs behavior` after every style edit that affects visibility, focus or layout.

- [ ] **Step 4: Run the complete quiz verifier**

Run: `npm run test:quiz`

Expected: structure, behavior and layout pass and screenshots are regenerated.

- [ ] **Step 5: Commit visual evidence**

```bash
git add src/components/quiz/lead-quiz-form.astro src/components/quiz/lead-quiz-modal-01.astro artifacts/quiz-*.png
git commit -m "style: refine dual-render quiz"
```

### Task 5: Final verification and graph maintenance

**Files:**

- Modify if generated successfully: `.graphify/*`

**Interfaces:**

- Consumes: all block-3 implementation commits.
- Produces: a clean branch ready for user visual approval.

- [ ] **Step 1: Run the complete fresh verification set**

Run:

```bash
npm run test:hero
npm run test:social-qr
npm run test:quiz
npm run check
npm run build
```

Expected: every command exits 0, Astro reports zero diagnostics, and two static pages build.

- [ ] **Step 2: Verify the original layout-shift concern directly**

At desktop and mobile widths, measure `.lead-quiz` before modal open, after open, and after close. Each difference must be at most 1 px. Verify two forms remain in the DOM throughout.

- [ ] **Step 3: Attempt the required graph refresh**

Run: `npx graphify hook-rebuild`

If npm still reports `could not determine executable to run`, record the failure without installing an unrelated package and without creating incomplete graph artifacts.

- [ ] **Step 4: Review repository state**

Run:

```bash
git diff HEAD~4 --check
git status --short
git log -6 --oneline
```

Expected: no whitespace errors and no uncommitted implementation files.

- [ ] **Step 5: Report for block-level approval**

Provide screenshot paths, verification evidence, commit hashes and any Graphify warning. Wait for user approval before starting block 4.
