import Swiper from "swiper";
import { A11y, Navigation, Pagination } from "swiper/modules";
import GLightbox from "glightbox";

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
    new Swiper(element, {
      modules: [A11y, Navigation, Pagination],
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
  });
};

const initLightbox = () => {
  if (!document.querySelector(".glightbox")) return;
  GLightbox({ selector: ".glightbox", touchNavigation: true, loop: false });
};

const initGlobalQuizLinks = () => {
  document.querySelectorAll<HTMLAnchorElement>('a[href="#estimate-quiz"]').forEach((link) => {
    if (link.dataset.quizLinked === "true") return;
    link.dataset.quizLinked = "true";
    link.addEventListener("click", (event) => {
      const trigger = document.querySelector<HTMLButtonElement>('[data-lead-quiz="estimate-quiz"] [data-quiz-open]');
      if (!trigger) return;
      event.preventDefault();
      trigger.click();
    });
  });
};

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").replace(/^8/, "7");
  const body = digits.startsWith("7") ? digits.slice(1, 11) : digits.slice(0, 10);
  return body ? `+7${body}` : "";
};

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
  root: HTMLElement;
  steps: HTMLElement[];
  progress: HTMLElement | null;
  progressRoot: HTMLElement | null;
  stepLabel: HTMLElement | null;
  backButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
  submitButton: HTMLButtonElement | null;
  phoneValue: HTMLInputElement | null;
  phoneInput: HTMLInputElement | null;
  dialpad: HTMLElement | null;
  dialpadDisplay: HTMLOutputElement | null;
  fileInput: HTMLInputElement | null;
  fileSummary: HTMLElement | null;
}

const persistedQuizFields = new Set([
  "object_type",
  "house_type",
  "stove_status",
  "services[]",
  "chimney_route",
  "contact_method",
]);

const fileCountLabel = (files: File[]) => {
  if (files.length === 0) return "Файлы не выбраны";
  const word = files.length === 1 ? "файл" : files.length >= 2 && files.length <= 4 ? "файла" : "файлов";
  return `${files.length} ${word}: ${files.map((file) => file.name).join(", ")}`;
};

const initLeadQuiz = () => {
  document.querySelectorAll<HTMLElement>("[data-lead-quiz]").forEach((root) => {
    if (root.dataset.quizReady === "true") return;

    const forms = Array.from(root.querySelectorAll<HTMLFormElement>("[data-quiz-form]"));
    if (forms.length === 0) return;
    root.dataset.quizReady = "true";

    const views: QuizView[] = forms.map((form) => {
      const viewRoot = form.closest<HTMLElement>("[data-quiz-view]");
      if (!viewRoot) throw new Error("Quiz view root is missing");
      const progress = viewRoot.querySelector<HTMLElement>("[data-quiz-progress]");
      return {
        form,
        instance: form.dataset.quizInstance === "modal" ? "modal" : "inline",
        root: viewRoot,
        steps: Array.from(form.querySelectorAll<HTMLElement>("[data-quiz-step]")),
        progress,
        progressRoot: progress?.parentElement ?? null,
        stepLabel: viewRoot.querySelector<HTMLElement>("[data-quiz-step-label]"),
        backButton: form.querySelector<HTMLButtonElement>("[data-quiz-back]"),
        nextButton: form.querySelector<HTMLButtonElement>("[data-quiz-next]"),
        submitButton: form.querySelector<HTMLButtonElement>("[data-quiz-submit]"),
        phoneValue: form.querySelector<HTMLInputElement>("[data-phone-value]"),
        phoneInput: form.querySelector<HTMLInputElement>("[data-phone-input]"),
        dialpad: form.querySelector<HTMLElement>("[data-dialpad]"),
        dialpadDisplay: form.querySelector<HTMLOutputElement>("[data-dialpad-display]"),
        fileInput: form.querySelector<HTMLInputElement>("[data-file-input]"),
        fileSummary: viewRoot.querySelector<HTMLElement>("[data-file-summary]"),
      };
    });

    const totalSteps = views[0].steps.length;
    const state: QuizState = {
      currentStep: 0,
      values: new Map(),
      files: [],
      phoneDigits: "",
      submitted: false,
    };

    const storageKey = "lr-furnace-quiz";
    const firstCheckedMethod = views[0].form.querySelector<HTMLInputElement>('[name="contact_method"]:checked');
    if (firstCheckedMethod) state.values.set("contact_method", firstCheckedMethod.value);

    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}") as Record<string, string | string[]>;
      Object.entries(saved).forEach(([name, value]) => {
        if (persistedQuizFields.has(name) && (typeof value === "string" || Array.isArray(value))) {
          state.values.set(name, value);
        }
      });
    } catch {
      sessionStorage.removeItem(storageKey);
    }

    const persistSafeValues = () => {
      const safeData: Record<string, string | string[]> = {};
      persistedQuizFields.forEach((name) => {
        const value = state.values.get(name);
        if (value !== undefined) safeData[name] = value;
      });
      sessionStorage.setItem(storageKey, JSON.stringify(safeData));
    };

    const renderValues = () => {
      views.forEach((view) => {
        view.form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]").forEach((control) => {
          if (control instanceof HTMLInputElement && (control.type === "file" || control.name === "quiz_service")) return;
          const value = state.values.get(control.name);
          if (value === undefined) return;

          if (control instanceof HTMLInputElement && control.type === "radio") {
            control.checked = value === control.value;
          } else if (control instanceof HTMLInputElement && control.type === "checkbox" && control.name.endsWith("[]")) {
            control.checked = Array.isArray(value) && value.includes(control.value);
          } else if (control instanceof HTMLInputElement && control.type === "checkbox") {
            control.checked = value === control.value;
          } else if (!Array.isArray(value)) {
            control.value = value;
          }
        });
      });
    };

    const renderPhone = () => {
      const normalized = String(state.values.get("phone") ?? "");
      const display = String(state.values.get("__phoneDisplay") ?? (state.phoneDigits ? `+7 ${state.phoneDigits}` : ""));
      views.forEach((view) => {
        if (view.phoneValue) view.phoneValue.value = normalized;
        if (view.phoneInput) view.phoneInput.value = display;
        if (view.dialpadDisplay) view.dialpadDisplay.value = state.phoneDigits ? `+7 ${state.phoneDigits}` : "+7";
      });
    };

    const renderFiles = () => {
      const summary = fileCountLabel(state.files);
      views.forEach((view) => {
        if (view.fileSummary) view.fileSummary.textContent = summary;
      });
    };

    const render = () => {
      views.forEach((view) => {
        view.steps.forEach((step, index) => step.classList.toggle("is-active", index === state.currentStep));
        if (view.backButton) view.backButton.hidden = state.currentStep === 0;
        if (view.nextButton) view.nextButton.hidden = state.currentStep === totalSteps - 1;
        if (view.submitButton) view.submitButton.hidden = state.currentStep !== totalSteps - 1;
        const ratio = ((state.currentStep + 1) / totalSteps) * 100;
        if (view.progress) view.progress.style.width = `${ratio}%`;
        if (view.progressRoot) view.progressRoot.setAttribute("aria-valuenow", String(state.currentStep + 1));
        if (view.stepLabel) view.stepLabel.textContent = `Шаг ${state.currentStep + 1} из ${totalSteps}`;
      });
      renderValues();
      renderPhone();
      renderFiles();
    };

    const updateStateFromControl = (control: HTMLInputElement | HTMLTextAreaElement) => {
      if (!control.name || (control instanceof HTMLInputElement && control.type === "file")) return;

      if (control instanceof HTMLInputElement && control.type === "radio") {
        if (control.checked) state.values.set(control.name, control.value);
      } else if (control instanceof HTMLInputElement && control.type === "checkbox" && control.name.endsWith("[]")) {
        const values = Array.from(
          control.form?.querySelectorAll<HTMLInputElement>(`input[name="${control.name}"]:checked`) ?? [],
        ).map((item) => item.value);
        state.values.set(control.name, values);
      } else if (control instanceof HTMLInputElement && control.type === "checkbox") {
        state.values.set(control.name, control.checked ? control.value : "");
      } else {
        state.values.set(control.name, control.value);
      }

      if (persistedQuizFields.has(control.name)) persistSafeValues();
      renderValues();
    };

    const updatePhone = (raw: string) => {
      const normalized = normalizePhone(raw);
      state.phoneDigits = normalized.startsWith("+7") ? normalized.slice(2) : "";
      state.values.set("phone", normalized);
      state.values.set("__phoneDisplay", raw);
      renderPhone();
    };

    const mirrorFiles = (source: HTMLInputElement) => {
      views.forEach((view) => {
        if (!view.fileInput || view.fileInput === source) return;
        try {
          const transfer = new DataTransfer();
          state.files.forEach((file) => transfer.items.add(file));
          view.fileInput.files = transfer.files;
        } catch {
          // The shared formdata handler below remains the source of truth.
        }
      });
    };

    const validateStep = (view: QuizView) => {
      const step = view.steps[state.currentStep];
      const selected = step?.querySelector<HTMLInputElement>("input:checked");
      const error = step?.querySelector<HTMLElement>("[data-step-error]");
      if (!selected) {
        if (error) error.hidden = false;
        step?.querySelector<HTMLInputElement>("input")?.focus();
        return false;
      }
      views.forEach((item) => {
        const itemError = item.steps[state.currentStep]?.querySelector<HTMLElement>("[data-step-error]");
        if (itemError) itemError.hidden = true;
      });
      return true;
    };

    views.forEach((view) => {
      view.form.addEventListener("input", (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.matches("[data-phone-input]")) {
          updatePhone(target.value);
        } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          updateStateFromControl(target);
        }
      });

      view.form.addEventListener("change", (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.matches("[data-file-input]")) {
          state.files = Array.from(target.files ?? []);
          mirrorFiles(target);
          renderFiles();
        } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          updateStateFromControl(target);
        }
      });

      view.backButton?.addEventListener("click", () => {
        state.currentStep = Math.max(0, state.currentStep - 1);
        render();
      });

      view.nextButton?.addEventListener("click", () => {
        if (!validateStep(view)) return;
        state.currentStep = Math.min(totalSteps - 1, state.currentStep + 1);
        render();
      });

      view.dialpad?.addEventListener("click", (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (!button) return;
        if (button.dataset.digit && state.phoneDigits.length < 10) state.phoneDigits += button.dataset.digit;
        if (button.hasAttribute("data-backspace")) state.phoneDigits = state.phoneDigits.slice(0, -1);
        if (button.hasAttribute("data-clear")) state.phoneDigits = "";
        state.values.set("phone", state.phoneDigits ? `+7${state.phoneDigits}` : "");
        state.values.set("__phoneDisplay", state.phoneDigits ? `+7 ${state.phoneDigits}` : "");
        renderPhone();
      });

      view.form.addEventListener("formdata", (event) => {
        const formData = (event as FormDataEvent).formData;
        formData.delete("photos[]");
        state.files.forEach((file) => formData.append("photos[]", file, file.name));
      });

      view.form.addEventListener("submit", (event) => {
        const location = view.form.querySelector<HTMLInputElement>('[name="location"]');
        const consent = view.form.querySelector<HTMLInputElement>('[name="consent"]');
        const contactError = view.form.querySelector<HTMLElement>("[data-contact-error]");
        const phone = String(state.values.get("phone") ?? "");
        if (!phone.match(/^\+7\d{10}$/) || !location?.value.trim() || !consent?.checked) {
          event.preventDefault();
          if (contactError) contactError.hidden = false;
          (!phone ? view.phoneInput || view.dialpad : !location?.value.trim() ? location : consent)?.focus();
          return;
        }
        views.forEach((item) => {
          const error = item.form.querySelector<HTMLElement>("[data-contact-error]");
          if (error) error.hidden = true;
        });
      });
    });

    const modal = root.querySelector<HTMLElement>("[data-quiz-modal]");
    const openButton = root.querySelector<HTMLButtonElement>("[data-quiz-open]");
    const closeButton = root.querySelector<HTMLButtonElement>("[data-quiz-close]");
    let lastFocus: HTMLElement | null = null;

    const closeModal = () => {
      modal?.classList.remove("is-open");
      modal?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lastFocus?.focus();
    };

    openButton?.addEventListener("click", () => {
      lastFocus = document.activeElement as HTMLElement;
      render();
      modal?.classList.add("is-open");
      modal?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeButton?.focus();
    });
    closeButton?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (!modal?.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.offsetParent !== null && !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const successNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-lead-success]"));
    const syncSuccess = () => {
      if (state.submitted || !successNodes.some((node) => !node.hidden)) return;
      state.submitted = true;
      views.forEach((view) => { view.form.hidden = true; });
      successNodes.forEach((node) => { node.hidden = false; });
    };
    successNodes.forEach((node) => {
      new MutationObserver(syncSuccess).observe(node, { attributes: true, attributeFilter: ["hidden"] });
    });

    render();
  });
};

const initFinalForms = () => {
  document.querySelectorAll<HTMLElement>(".contact-card").forEach((root) => {
    if (root.dataset.finalReady === "true") return;
    root.dataset.finalReady = "true";
    const form = root.querySelector<HTMLFormElement>("form");
    const phoneValue = root.querySelector<HTMLInputElement>("[data-final-phone-value]");
    const phoneInput = root.querySelector<HTMLInputElement>("[data-final-phone-input]");
    const dialpad = root.querySelector<HTMLElement>("[data-final-dialpad]");
    const display = root.querySelector<HTMLOutputElement>("[data-final-dialpad-display]");
    let digits = "";

    phoneInput?.addEventListener("input", () => {
      if (phoneValue) phoneValue.value = normalizePhone(phoneInput.value);
    });
    dialpad?.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.dataset.digit && digits.length < 10) digits += button.dataset.digit;
      if (button.hasAttribute("data-backspace")) digits = digits.slice(0, -1);
      if (button.hasAttribute("data-clear")) digits = "";
      if (phoneValue) phoneValue.value = digits ? `+7${digits}` : "";
      if (display) display.value = `+7 ${digits}`;
    });
    form?.addEventListener("submit", (event) => {
      const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
      if (!phoneValue?.value.match(/^\+7\d{10}$/) || !consent?.checked || !form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        (phoneInput || dialpad)?.focus();
      }
    });
  });
};

const initLocalFormFallback = () => {
  if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
  document.querySelectorAll<HTMLFormElement>("form[data-hop-lead-form]").forEach((form) => {
    if (form.dataset.localFallback === "true") return;
    form.dataset.localFallback = "true";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.closest("[data-lead-root]")?.querySelector<HTMLElement>("[data-lead-status]");
      if (status) {
        status.hidden = false;
        status.textContent = "Тестовый режим: форма валидна. На рабочем сайте заявку перехватит HTML On Page Lead Capture.";
        status.focus();
      }
    });
  });
};

const init = () => {
  initSliders();
  initLightbox();
  initLeadQuiz();
  initFinalForms();
  initGlobalQuizLinks();
  initLocalFormFallback();
};

init();
document.addEventListener("astro:page-load", init);
