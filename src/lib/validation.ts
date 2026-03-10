export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateContact(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  const email = typeof data.email === 'string' ? data.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
