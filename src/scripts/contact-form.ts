// Client-side contact form validation and submission
// Validation rules duplicated from server (src/lib/validation.ts) for client-side use

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

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

function validateAll(form: HTMLFormElement): FieldErrors {
  const errors: FieldErrors = {};
  const fields = ['name', 'email', 'message'] as const;

  for (const field of fields) {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${field}`);
    if (input) {
      const error = validateField(field, input.value);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return errors;
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

function showErrorSummary(errors: FieldErrors): void {
  const summary = document.getElementById('form-errors');
  if (!summary) return;

  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) {
    summary.style.display = 'none';
    summary.innerHTML = '';
    return;
  }

  summary.innerHTML = `
    <p><strong>Please fix the following errors:</strong></p>
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

function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const validatedFields = ['name', 'email', 'message'];

  // Blur validation on individual fields
  for (const fieldId of validatedFields) {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${fieldId}`);
    if (input) {
      input.addEventListener('blur', () => {
        const error = validateField(fieldId, input.value);
        showFieldError(fieldId, error);
      });

      // Clear error on input
      input.addEventListener('input', () => {
        if (input.classList.contains('input-error')) {
          const error = validateField(fieldId, input.value);
          if (!error) {
            showFieldError(fieldId, null);
          }
        }
      });
    }
  }

  // Form submission
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    // Validate all fields
    const errors = validateAll(form);
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      // Show inline errors
      for (const fieldId of validatedFields) {
        showFieldError(fieldId, (errors as Record<string, string>)[fieldId] || null);
      }
      showErrorSummary(errors);

      // Focus first invalid field
      const firstErrorField = validatedFields.find((f) => (errors as Record<string, string>)[f]);
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    clearErrorSummary();

    // Disable button, show spinner
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
    }

    try {
      // Collect form data
      const formData = new FormData(form);
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Replace form with success message
        const wrapper = form.closest('.contact-wrapper');
        if (wrapper) {
          wrapper.innerHTML = `
            <div class="success-panel">
              <div class="success-icon">&#10003;</div>
              <h2>Message Sent!</h2>
              <p>${result.message || "Thank you! We'll get back to you soon."}</p>
            </div>
          `;
        }
      } else if (result.errors) {
        // Server validation errors
        for (const fieldId of validatedFields) {
          showFieldError(fieldId, result.errors[fieldId] || null);
        }
        showErrorSummary(result.errors);
      } else {
        // Generic server error
        showErrorSummary({ name: result.message || 'Something went wrong. Please try again later.' });
      }
    } catch {
      // Network error
      showErrorSummary({ name: 'Network error. Please check your connection and try again.' });
    } finally {
      // Re-enable button (unless form was replaced)
      if (submitBtn && document.contains(submitBtn)) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
      }
    }
  });
}

// Use astro:page-load for View Transition compatibility
document.addEventListener('astro:page-load', initContactForm);
