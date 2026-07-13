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

const initLeadQuiz = () => {
  document.querySelectorAll<HTMLElement>("[data-lead-quiz]").forEach((root) => {
    if (root.dataset.quizReady === "true") return;
    root.dataset.quizReady = "true";

    const modal = root.querySelector<HTMLElement>("[data-quiz-modal]");
    const openButton = root.querySelector<HTMLButtonElement>("[data-quiz-open]");
    const closeButton = root.querySelector<HTMLButtonElement>("[data-quiz-close]");
    const form = root.querySelector<HTMLFormElement>("form");
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-quiz-step]"));
    const backButton = root.querySelector<HTMLButtonElement>("[data-quiz-back]");
    const nextButton = root.querySelector<HTMLButtonElement>("[data-quiz-next]");
    const submitButton = root.querySelector<HTMLButtonElement>("[data-quiz-submit]");
    const progress = root.querySelector<HTMLElement>("[data-quiz-progress]");
    const progressRoot = progress?.parentElement;
    const stepLabel = root.querySelector<HTMLElement>("[data-quiz-step-label]");
    const phoneValue = root.querySelector<HTMLInputElement>("[data-phone-value]");
    const phoneInput = root.querySelector<HTMLInputElement>("[data-phone-input]");
    const dialpad = root.querySelector<HTMLElement>("[data-dialpad]");
    const dialpadDisplay = root.querySelector<HTMLOutputElement>("[data-dialpad-display]");
    let currentStep = 0;
    let lastFocus: HTMLElement | null = null;
    let mobileDigits = "";

    const render = () => {
      steps.forEach((step, index) => step.classList.toggle("is-active", index === currentStep));
      if (backButton) backButton.hidden = currentStep === 0;
      if (nextButton) nextButton.hidden = currentStep === steps.length - 1;
      if (submitButton) submitButton.hidden = currentStep !== steps.length - 1;
      const ratio = ((currentStep + 1) / steps.length) * 100;
      if (progress) progress.style.width = `${ratio}%`;
      if (progressRoot) progressRoot.setAttribute("aria-valuenow", String(currentStep + 1));
      if (stepLabel) stepLabel.textContent = `Шаг ${currentStep + 1} из ${steps.length}`;
    };

    const close = () => {
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
    closeButton?.addEventListener("click", close);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) close();
    });

    backButton?.addEventListener("click", () => {
      currentStep = Math.max(0, currentStep - 1);
      render();
    });
    nextButton?.addEventListener("click", () => {
      const step = steps[currentStep];
      const selected = step.querySelector<HTMLInputElement>("input:checked");
      const error = step.querySelector<HTMLElement>("[data-step-error]");
      if (!selected) {
        if (error) error.hidden = false;
        step.querySelector<HTMLInputElement>("input")?.focus();
        return;
      }
      if (error) error.hidden = true;
      currentStep = Math.min(steps.length - 1, currentStep + 1);
      render();
    });

    phoneInput?.addEventListener("input", () => {
      if (phoneValue) phoneValue.value = normalizePhone(phoneInput.value);
    });
    dialpad?.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.dataset.digit && mobileDigits.length < 10) mobileDigits += button.dataset.digit;
      if (button.hasAttribute("data-backspace")) mobileDigits = mobileDigits.slice(0, -1);
      if (button.hasAttribute("data-clear")) mobileDigits = "";
      if (phoneValue) phoneValue.value = mobileDigits ? `+7${mobileDigits}` : "";
      if (dialpadDisplay) dialpadDisplay.value = `+7 ${mobileDigits}`;
    });

    form?.addEventListener("change", () => {
      const safeData: Record<string, string | string[]> = {};
      new FormData(form).forEach((value, key) => {
        const isPrivateField = key === "phone" || key === "name" || key === "comment" || key === "photos[]" || key === "consent";
        if (isPrivateField || value instanceof File) return;
        if (key.endsWith("[]")) safeData[key] = [...((safeData[key] as string[]) || []), String(value)];
        else safeData[key] = String(value);
      });
      sessionStorage.setItem("lr-furnace-quiz", JSON.stringify(safeData));
    });

    form?.addEventListener("submit", (event) => {
      const location = form.querySelector<HTMLInputElement>('[name="location"]');
      const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
      const contactError = root.querySelector<HTMLElement>("[data-contact-error]");
      if (!phoneValue?.value.match(/^\+7\d{10}$/) || !location?.value.trim() || !consent?.checked) {
        event.preventDefault();
        if (contactError) contactError.hidden = false;
        (!phoneValue?.value ? phoneInput || dialpad : !location?.value.trim() ? location : consent)?.focus();
        return;
      }
      if (contactError) contactError.hidden = true;
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
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
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
