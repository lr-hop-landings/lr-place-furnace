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

const extractPhoneDigits = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("78") || digits.startsWith("77")) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith("7") || digits.startsWith("8")) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
};

const normalizePhone = (raw: string): string => {
  const body = extractPhoneDigits(raw);
  return body ? `+7${body}` : "";
};

const formatPhone = (digits: string): string => {
  if (!digits) return "";
  let res = "+7";
  if (digits.length > 0) res += " (" + digits.slice(0, 3);
  if (digits.length >= 4) res += ") " + digits.slice(3, 6);
  if (digits.length >= 7) res += "-" + digits.slice(6, 8);
  if (digits.length >= 9) res += "-" + digits.slice(8, 10);
  return res;
};

const isPhoneValid = (phone: string): boolean => {
  return /^\+7\d{10}$/.test(phone);
};

const applyPhoneMask = (
  input: HTMLInputElement,
  onUpdate?: (normalized: string, formatted: string, digits: string) => void
) => {
  const handleInput = () => {
    const raw = input.value;
    const digits = extractPhoneDigits(raw);
    const formatted = digits ? formatPhone(digits) : (raw.startsWith("+") && raw.length > 2 ? "+7 (" : "");
    const normalized = digits ? `+7${digits}` : "";
    input.value = formatted;
    if (digits.length === 10) {
      input.removeAttribute("aria-invalid");
    }
    onUpdate?.(normalized, formatted, digits);
  };

  input.addEventListener("input", handleInput);
  input.addEventListener("focus", () => {
    if (!input.value.trim()) {
      input.value = "+7 (";
    }
  });
  input.addEventListener("blur", () => {
    if (input.value === "+7 (" || input.value === "+7" || input.value === "+7 " || input.value === "+7 ()") {
      input.value = "";
      input.removeAttribute("aria-invalid");
      onUpdate?.("", "", "");
    } else {
      const digits = extractPhoneDigits(input.value);
      if (digits.length > 0 && digits.length < 10) {
        input.setAttribute("aria-invalid", "true");
      } else if (digits.length === 10) {
        input.removeAttribute("aria-invalid");
      }
    }
  });
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
  topline: HTMLElement | null;
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
        topline: viewRoot.querySelector<HTMLElement>(".lead-quiz-form__topline"),
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
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const isTechnicalOrFinal = state.currentStep >= totalSteps - 2;
      const visualTotalSteps = totalSteps - 2;

      views.forEach((view) => {
        view.steps.forEach((step, index) => step.classList.toggle("is-active", index === state.currentStep));
        if (view.backButton) view.backButton.hidden = state.currentStep === 0 || isTechnicalOrFinal;
        if (view.nextButton) view.nextButton.hidden = isTechnicalOrFinal;
        if (view.submitButton) view.submitButton.hidden = state.currentStep !== totalSteps - 1;

        if (view.topline) view.topline.style.display = isTechnicalOrFinal ? "none" : "";
        if (view.progressRoot) view.progressRoot.style.display = isTechnicalOrFinal ? "none" : "";

        if (!isTechnicalOrFinal) {
          const ratio = ((state.currentStep + 1) / visualTotalSteps) * 100;
          if (view.progress) view.progress.style.width = `${ratio}%`;
          if (view.progressRoot) view.progressRoot.setAttribute("aria-valuenow", String(state.currentStep + 1));
        if (view.stepLabel) view.stepLabel.textContent = `Шаг ${state.currentStep + 1} из ${visualTotalSteps}`;
        }
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
      const advanceStep = () => {
        if (!validateStep(view)) return;
        state.currentStep = Math.min(totalSteps - 1, state.currentStep + 1);
        render();

        if (state.currentStep === totalSteps - 2) {
          setTimeout(() => {
            if (state.currentStep === totalSteps - 2) {
              state.currentStep++;
              render();
            }
          }, 2000);
        }
      };

      if (view.phoneInput) {
        applyPhoneMask(view.phoneInput, (normalized, formatted, digits) => {
          state.phoneDigits = digits;
          state.values.set("phone", normalized);
          state.values.set("__phoneDisplay", formatted);
          renderPhone();
          if (digits.length === 10) {
            views.forEach((v) => {
              v.phoneInput?.removeAttribute("aria-invalid");
              const err = v.form.querySelector<HTMLElement>("[data-contact-error]");
              if (err && v.form.querySelector<HTMLInputElement>('[name="consent"]')?.checked) {
                err.hidden = true;
              }
            });
          }
        });
      }

      view.form.addEventListener("input", (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.matches("[data-phone-input]")) {
          // Handled by applyPhoneMask
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

      view.form.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.type !== "radio") return;
        // Don't auto-advance on checkbox-type steps (e.g. services[])
        const step = view.steps[state.currentStep];
        if (!step) return;
        const isCheckboxStep = step.querySelector('input[type="checkbox"]') !== null;
        if (isCheckboxStep) return;
        updateStateFromControl(target);
        setTimeout(advanceStep, 300);
      });

      view.backButton?.addEventListener("click", () => {
        state.currentStep = Math.max(0, state.currentStep - 1);
        render();
      });

      view.nextButton?.addEventListener("click", advanceStep);

      view.dialpad?.addEventListener("click", (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (!button) return;
        if (button.dataset.digit && state.phoneDigits.length < 10) state.phoneDigits += button.dataset.digit;
        if (button.hasAttribute("data-backspace")) state.phoneDigits = state.phoneDigits.slice(0, -1);
        if (button.hasAttribute("data-clear")) state.phoneDigits = "";
        state.values.set("phone", state.phoneDigits ? `+7${state.phoneDigits}` : "");
        state.values.set("__phoneDisplay", state.phoneDigits ? formatPhone(state.phoneDigits) : "");
        renderPhone();
        if (state.phoneDigits.length === 10) {
          views.forEach((v) => {
            v.phoneInput?.removeAttribute("aria-invalid");
            const err = v.form.querySelector<HTMLElement>("[data-contact-error]");
            if (err && v.form.querySelector<HTMLInputElement>('[name="consent"]')?.checked) {
              err.hidden = true;
            }
          });
        }
      });

      view.form.addEventListener("formdata", (event) => {
        const formData = (event as FormDataEvent).formData;
        formData.delete("photos[]");
        state.files.forEach((file) => formData.append("photos[]", file, file.name));
      });

      view.form.addEventListener("submit", (event) => {
        const consent = view.form.querySelector<HTMLInputElement>('[name="consent"]');
        const contactError = view.form.querySelector<HTMLElement>("[data-contact-error]");
        const phone = String(state.values.get("phone") ?? "");
        const validPhone = isPhoneValid(phone);
        const validConsent = Boolean(consent?.checked);

        if (!validPhone || !validConsent) {
          event.preventDefault();
          if (contactError) {
            contactError.hidden = false;
            if (!validPhone && !validConsent) {
              contactError.textContent = "Пожалуйста, введите корректный номер телефона (10 цифр) и подтвердите согласие.";
            } else if (!validPhone) {
              contactError.textContent = "Пожалуйста, введите корректный номер телефона из 10 цифр.";
            } else {
              contactError.textContent = "Пожалуйста, подтвердите согласие на обработку персональных данных.";
            }
          }
          views.forEach((v) => {
            if (v.phoneInput) {
              v.phoneInput.setAttribute("aria-invalid", validPhone ? "false" : "true");
            }
          });
          (!validPhone ? (view.phoneInput && view.phoneInput.offsetParent ? view.phoneInput : view.dialpad) : consent)?.focus();
          return;
        }

        views.forEach((item) => {
          const error = item.form.querySelector<HTMLElement>("[data-contact-error]");
          if (error) error.hidden = true;
          item.phoneInput?.removeAttribute("aria-invalid");
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
      modal?.classList.add("is-open");
      modal?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      render();
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
      views.forEach((view) => {
        view.form.hidden = true;
        view.form.style.display = "none";
        if (view.topline) view.topline.style.display = "none";
        if (view.progressRoot) view.progressRoot.style.display = "none";
      });
      successNodes.forEach((node) => {
        node.hidden = false;
        node.style.display = "flex";
      });
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
    const contactError = root.querySelector<HTMLElement>("[data-contact-error]");
    let digits = "";

    if (phoneInput) {
      applyPhoneMask(phoneInput, (normalized, _formatted, phoneDigits) => {
        if (phoneValue) phoneValue.value = normalized;
        digits = phoneDigits;
        if (display) display.value = phoneDigits ? `+7 ${phoneDigits}` : "+7";
        if (phoneDigits.length === 10) {
          phoneInput.removeAttribute("aria-invalid");
          const consent = form?.querySelector<HTMLInputElement>('[name="consent"]');
          if (consent?.checked && contactError) contactError.hidden = true;
        }
      });
    }

    dialpad?.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.dataset.digit && digits.length < 10) digits += button.dataset.digit;
      if (button.hasAttribute("data-backspace")) digits = digits.slice(0, -1);
      if (button.hasAttribute("data-clear")) digits = "";
      const normalized = digits ? `+7${digits}` : "";
      const formatted = digits ? formatPhone(digits) : "";
      if (phoneValue) phoneValue.value = normalized;
      if (phoneInput) phoneInput.value = formatted;
      if (display) display.value = digits ? `+7 ${digits}` : "+7";
      if (digits.length === 10) {
        phoneInput?.removeAttribute("aria-invalid");
        const consent = form?.querySelector<HTMLInputElement>('[name="consent"]');
        if (consent?.checked && contactError) contactError.hidden = true;
      }
    });

    form?.addEventListener("submit", (event) => {
      const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
      const phone = phoneValue?.value || (phoneInput ? normalizePhone(phoneInput.value) : "");
      const validPhone = isPhoneValid(phone);
      const validConsent = Boolean(consent?.checked);

      if (!validPhone || !validConsent) {
        event.preventDefault();
        if (contactError) {
          contactError.hidden = false;
          if (!validPhone && !validConsent) {
            contactError.textContent = "Пожалуйста, введите корректный номер телефона (10 цифр) и подтвердите согласие.";
          } else if (!validPhone) {
            contactError.textContent = "Пожалуйста, введите корректный номер телефона из 10 цифр.";
          } else {
            contactError.textContent = "Пожалуйста, подтвердите согласие на обработку персональных данных.";
          }
        }
        if (phoneInput) {
          phoneInput.setAttribute("aria-invalid", validPhone ? "false" : "true");
        }
        (!validPhone ? (phoneInput && phoneInput.offsetParent !== null ? phoneInput : dialpad) : consent)?.focus();
        return;
      }

      if (phoneInput) phoneInput.removeAttribute("aria-invalid");
      if (contactError) contactError.hidden = true;
    });
  });
};

const initLocalFormFallback = () => {
  if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
  document.querySelectorAll<HTMLFormElement>("form[data-hop-lead-form]").forEach((form) => {
    if (form.dataset.localFallback === "true") return;
    form.dataset.localFallback = "true";
    form.addEventListener("submit", (event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      console.log("=== Quiz Form Data ===", data);
      
      const root = form.closest("[data-lead-root]");
      const success = root?.querySelector<HTMLElement>("[data-lead-success]");
      if (success) {
        if (form.classList.contains("lead-quiz-form__form")) {
          form.hidden = true;
          form.style.display = "none";
          const topline = root?.querySelector<HTMLElement>(".lead-quiz-form__topline");
          const progress = root?.querySelector<HTMLElement>(".lead-quiz-form__progress");
          if (topline) topline.style.display = "none";
          if (progress) progress.style.display = "none";
        }
        success.hidden = false;
        success.style.display = "flex";
        success.focus();
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
