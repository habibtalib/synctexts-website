// Multi-step contact form state machine
// Handles: service card selection, step navigation, sessionStorage persistence,
// per-step validation, animated transitions, submission, and GTM tracking.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

interface FormState {
  step: 1 | 2 | 3;
  service_type: string | null;
  budget: string | null;
  timeline: string | null;
  name: string;
  email: string;
  company: string;
  message: string;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'contact_form_state';
const CAL_URL = (import.meta as Record<string, unknown> & { env?: Record<string, string> }).env?.PUBLIC_CAL_URL ?? 'https://cal.com/synctexts/discovery';

// ============================================================
// State management
// ============================================================

function defaultState(): FormState {
  return {
    step: 1,
    service_type: null,
    budget: null,
    timeline: null,
    name: '',
    email: '',
    company: '',
    message: '',
  };
}

function loadState(): FormState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FormState) : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState(state: FormState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or private mode — silent fail, form still works
  }
}

function clearState(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// Validation
// ============================================================

function validateField(field: string, value: string): string | null {
  const trimmed = value.trim();

  switch (field) {
    case 'name':
      return trimmed.length < 2 ? 'Name must be at least 2 characters' : null;
    case 'email':
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
        ? 'Please enter a valid email address'
        : null;
    case 'message':
      return trimmed.length < 10 ? 'Message must be at least 10 characters' : null;
    default:
      return null;
  }
}

function showFieldError(fieldId: string, message: string | null): void {
  const errorSpan = document.getElementById(`${fieldId}-error`);
  const input = document.getElementById(fieldId);

  if (errorSpan) {
    errorSpan.textContent = message || '';
    errorSpan.style.display = message ? 'block' : 'none';
  }

  if (input) {
    if (message) {
      input.classList.add('input-error');
    } else {
      input.classList.remove('input-error');
    }
  }
}

function showErrorSummary(errors: Record<string, string>): void {
  const summary = document.getElementById('form-errors');
  if (!summary) return;

  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) {
    summary.style.display = 'none';
    summary.innerHTML = '';
    return;
  }

  summary.innerHTML = `
    <p><strong>Please fix the following:</strong></p>
    <ul>${messages.map((m) => `<li>${m}</li>`).join('')}</ul>
  `;
  summary.style.display = 'block';
}

function clearErrorSummary(): void {
  const summary = document.getElementById('form-errors');
  if (summary) {
    summary.style.display = 'none';
    summary.innerHTML = '';
  }
}

// ============================================================
// Step indicator
// ============================================================

function updateIndicator(currentStep: number, completedSteps: Set<number>): void {
  for (let i = 1; i <= 3; i++) {
    const dot = document.querySelector<HTMLElement>(`[data-indicator-step="${i}"]`);
    if (!dot) continue;

    const isCurrent = i === currentStep;
    const isComplete = completedSteps.has(i) && !isCurrent;
    const isPending = !isCurrent && !isComplete;

    dot.classList.toggle('is-current', isCurrent);
    dot.classList.toggle('is-complete', isComplete);
    dot.classList.toggle('is-pending', isPending);

    // Accessibility: aria-current only on the active step
    if (isCurrent) {
      dot.setAttribute('aria-current', 'step');
    } else {
      dot.removeAttribute('aria-current');
    }

    // Completed dots are keyboard-navigable back-navigation targets
    if (isComplete) {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
    } else {
      dot.removeAttribute('role');
      dot.removeAttribute('tabindex');
    }
  }

  // Fill connecting lines up to the current step
  for (let i = 1; i <= 2; i++) {
    const line = document.querySelector<HTMLElement>(`[data-indicator-line="${i}"]`);
    if (line) {
      line.classList.toggle('is-filled', currentStep > i || completedSteps.has(i + 1));
    }
  }
}

// ============================================================
// Step transition
// ============================================================

function showStep(targetStep: number, direction: 'forward' | 'back'): void {
  const current = document.querySelector<HTMLElement>('.form-step.is-active');
  const target = document.querySelector<HTMLElement>(`[data-step="${targetStep}"]`);

  if (!current || !target || current === target) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    // Instant transition — no animation classes
    current.classList.remove('is-active');
    target.classList.add('is-active');
    return;
  }

  // Animated transition
  const entryClass = direction === 'forward' ? 'enter-from-right' : 'enter-from-left';
  const exitClass = direction === 'forward' ? 'exit-to-left' : 'exit-to-right';

  // Add entry class before making visible, then remove after reflow to trigger transition
  target.classList.add(entryClass);
  target.classList.add('is-active');

  // Force reflow to ensure the entry class renders before it's removed
  target.getBoundingClientRect();

  // Remove entry class to animate from offset to natural position
  target.classList.remove(entryClass);

  // Exit current step
  current.classList.add(exitClass);

  // Clean up after exit transition completes
  current.addEventListener(
    'transitionend',
    (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      current.classList.remove('is-active', 'exit-to-left', 'exit-to-right');
    },
    { once: true },
  );
}

// ============================================================
// Field sync (DOM <-> state)
// ============================================================

function syncFieldsToState(state: FormState): void {
  const budget = document.getElementById('budget') as HTMLSelectElement | null;
  const timeline = document.getElementById('timeline') as HTMLSelectElement | null;
  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const companyEl = document.getElementById('company') as HTMLInputElement | null;
  const messageEl = document.getElementById('message') as HTMLTextAreaElement | null;

  if (budget) state.budget = budget.value || null;
  if (timeline) state.timeline = timeline.value || null;
  if (nameEl) state.name = nameEl.value;
  if (emailEl) state.email = emailEl.value;
  if (companyEl) state.company = companyEl.value;
  if (messageEl) state.message = messageEl.value;
}

function hydrateFieldsFromState(state: FormState): void {
  const budget = document.getElementById('budget') as HTMLSelectElement | null;
  const timeline = document.getElementById('timeline') as HTMLSelectElement | null;
  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const companyEl = document.getElementById('company') as HTMLInputElement | null;
  const messageEl = document.getElementById('message') as HTMLTextAreaElement | null;

  if (budget && state.budget) budget.value = state.budget;
  if (timeline && state.timeline) timeline.value = state.timeline;
  if (nameEl) nameEl.value = state.name;
  if (emailEl) emailEl.value = state.email;
  if (companyEl) companyEl.value = state.company;
  if (messageEl) messageEl.value = state.message;
}

// ============================================================
// Main init
// ============================================================

function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  let state = loadState();
  const completedSteps = new Set<number>();

  // --- Hydration from sessionStorage ---
  // Mark prior steps as completed based on saved step
  for (let i = 1; i < state.step; i++) {
    completedSteps.add(i);
  }

  // Set the correct step panel as active without animation (prevents flicker — RESEARCH.md Pitfall 1)
  if (state.step > 1) {
    // Deactivate step 1 (it has is-active in HTML by default)
    const defaultActive = document.querySelector<HTMLElement>('.form-step.is-active');
    if (defaultActive) defaultActive.classList.remove('is-active');

    const savedPanel = document.querySelector<HTMLElement>(`[data-step="${state.step}"]`);
    if (savedPanel) savedPanel.classList.add('is-active');
  }

  // Hydrate field values
  hydrateFieldsFromState(state);

  // Hydrate service card selection
  if (state.service_type) {
    const selectedCard = document.querySelector<HTMLElement>(
      `[data-service-value="${state.service_type}"]`,
    );
    if (selectedCard) selectedCard.classList.add('is-selected');
  }

  // Update step indicator to match restored state
  updateIndicator(state.step, completedSteps);

  // --- Service card click handlers ---
  const serviceCards = document.querySelectorAll<HTMLElement>('[data-service-value]');
  serviceCards.forEach((card) => {
    card.addEventListener('click', () => {
      // Deselect all cards
      serviceCards.forEach((c) => c.classList.remove('is-selected'));
      // Select clicked card
      card.classList.add('is-selected');

      // Update state
      state.service_type = card.dataset.serviceValue ?? null;
      completedSteps.add(1);
      state.step = 2;
      saveState(state);

      // Auto-advance to Step 2
      showStep(2, 'forward');
      updateIndicator(2, completedSteps);
    });
  });

  // --- Step indicator dot click handlers (back-navigation) ---
  const indicatorDots = document.querySelectorAll<HTMLElement>('[data-indicator-step]');
  indicatorDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.dataset.indicatorStep ?? '0', 10);
      if (!completedSteps.has(targetStep)) return; // Only navigate to completed steps

      const direction: 'forward' | 'back' = targetStep > state.step ? 'forward' : 'back';
      syncFieldsToState(state);
      state.step = targetStep as FormState['step'];
      saveState(state);

      showStep(targetStep, direction);
      updateIndicator(targetStep, completedSteps);
    });

    // Keyboard activation (Enter/Space) for completed dots
    dot.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dot.click();
      }
    });
  });

  // --- Back button handlers ---
  const backButtons = document.querySelectorAll<HTMLElement>('[data-back]');
  backButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      syncFieldsToState(state);
      state.step = Math.max(1, state.step - 1) as FormState['step'];
      saveState(state);

      showStep(state.step, 'back');
      updateIndicator(state.step, completedSteps);
    });
  });

  // --- Next button handler (Step 2 -> Step 3) ---
  const nextBtn = document.querySelector<HTMLElement>('[data-next]');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      syncFieldsToState(state);
      completedSteps.add(2);
      state.step = 3;
      saveState(state);

      showStep(3, 'forward');
      updateIndicator(3, completedSteps);
    });
  }

  // --- Live field persistence ---
  // Select fields: save on 'change'
  const budgetEl = document.getElementById('budget') as HTMLSelectElement | null;
  const timelineEl = document.getElementById('timeline') as HTMLSelectElement | null;

  budgetEl?.addEventListener('change', () => {
    state.budget = budgetEl.value || null;
    saveState(state);
  });

  timelineEl?.addEventListener('change', () => {
    state.timeline = timelineEl.value || null;
    saveState(state);
  });

  // Text fields: save on 'input'
  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const companyEl = document.getElementById('company') as HTMLInputElement | null;
  const messageEl = document.getElementById('message') as HTMLTextAreaElement | null;

  nameEl?.addEventListener('input', () => {
    state.name = nameEl.value;
    saveState(state);
  });

  emailEl?.addEventListener('input', () => {
    state.email = emailEl.value;
    saveState(state);
  });

  companyEl?.addEventListener('input', () => {
    state.company = companyEl.value;
    saveState(state);
  });

  messageEl?.addEventListener('input', () => {
    state.message = messageEl.value;
    saveState(state);
  });

  // --- Blur validation on Step 3 fields ---
  const validatedFields = ['name', 'email', 'message'];

  for (const fieldId of validatedFields) {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${fieldId}`);
    if (!input) continue;

    input.addEventListener('blur', () => {
      const error = validateField(fieldId, input.value);
      showFieldError(fieldId, error);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('input-error')) {
        const error = validateField(fieldId, input.value);
        if (!error) showFieldError(fieldId, null);
      }
    });
  }

  // --- Form submit handler ---
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    // Sync latest field values to state before validation
    syncFieldsToState(state);

    // Validate Step 3 required fields
    const errors: Record<string, string> = {};
    const nameError = validateField('name', state.name);
    const emailError = validateField('email', state.email);
    const messageError = validateField('message', state.message);

    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (messageError) errors.message = messageError;

    if (Object.keys(errors).length > 0) {
      // Show inline field errors
      showFieldError('name', errors.name ?? null);
      showFieldError('email', errors.email ?? null);
      showFieldError('message', errors.message ?? null);
      showErrorSummary(errors);

      // Focus first invalid field
      const firstErrorId = Object.keys(errors)[0];
      document.getElementById(firstErrorId)?.focus();
      return;
    }

    clearErrorSummary();

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    // Disable submit button and show spinner
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
    }

    // Disable all form fields
    const allFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    );
    allFields.forEach((f) => (f.disabled = true));

    // Hide back link during submission
    const backLinkStep3 = form.querySelector<HTMLElement>(
      '.form-step[data-step="3"] .step-back-link',
    );
    if (backLinkStep3) backLinkStep3.style.display = 'none';

    // Assemble payload — undefined values are stripped by JSON.stringify
    const honeypot = form.querySelector<HTMLInputElement>('[name="website"]');
    const payload = {
      name: state.name.trim(),
      email: state.email.trim(),
      message: state.message.trim(),
      company: state.company.trim() || undefined,
      service_type: state.service_type || undefined,
      budget: state.budget || undefined,
      timeline: state.timeline || undefined,
      website: honeypot?.value ?? '',
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (response.ok && result.success) {
        // Clear sessionStorage on success
        clearState();

        // GTM tracking
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'contact_form_submit',
          form_status: 'success',
        });

        // Hide step indicator and labels
        document.getElementById('step-indicator')?.classList.add('is-hidden');
        document.getElementById('step-labels')?.classList.add('is-hidden');

        // Replace .contact-wrapper innerHTML with success panel (preserves contact-info left column)
        const wrapper = document.querySelector<HTMLElement>('.contact-wrapper');
        if (wrapper) {
          wrapper.innerHTML = `
            <div class="contact-info">
              <h2>Ready to <span class="text-gradient">Accelerate</span>?</h2>
              <p>Let's discuss how SyncTexts can elevate your next project. We are ready to tackle your toughest technical challenges.</p>
            </div>
            <div class="success-panel">
              <div class="success-icon">&#10003;</div>
              <h2>Message Sent!</h2>
              <p>We'll get back to you within 24 hours.</p>
              <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">Book a Discovery Call</a>
            </div>
          `;
        }
      } else if (result.errors) {
        // Server validation errors
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'contact_form_submit',
          form_status: 'error',
        });

        for (const fieldId of validatedFields) {
          showFieldError(fieldId, result.errors[fieldId] ?? null);
        }
        showErrorSummary(result.errors);
      } else {
        // Generic server error
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'contact_form_submit',
          form_status: 'error',
        });

        showErrorSummary({
          submit: result.message ?? 'Something went wrong. Please try again later.',
        });
      }
    } catch {
      // Network error
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'contact_form_submit',
        form_status: 'error',
      });

      showErrorSummary({
        submit: 'Network error. Please check your connection and try again.',
      });
    } finally {
      // Re-enable button and fields if still in DOM
      if (submitBtn && document.contains(submitBtn)) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
      }
      if (form && document.contains(form)) {
        allFields.forEach((f) => (f.disabled = false));
        if (backLinkStep3) backLinkStep3.style.display = '';
      }
    }
  });
}

// Register with astro:page-load for View Transition compatibility
document.addEventListener('astro:page-load', initContactForm);
