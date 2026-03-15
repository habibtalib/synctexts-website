export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const ALLOWED_SERVICE_TYPES = ['web_dev', 'devops', 'analytics'] as const;
export const ALLOWED_BUDGETS = ['under_5k', '5k_15k', '15k_50k', '50k_plus'] as const;
export const ALLOWED_TIMELINES = ['asap', '1_3_months', '3_6_months', 'exploring'] as const;

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

  // Optional enum fields — only validate if present and non-null
  if (data.service_type !== undefined && data.service_type !== null) {
    if (!ALLOWED_SERVICE_TYPES.includes(data.service_type as typeof ALLOWED_SERVICE_TYPES[number])) {
      errors.service_type = 'Invalid service type';
    }
  }

  if (data.budget !== undefined && data.budget !== null) {
    if (!ALLOWED_BUDGETS.includes(data.budget as typeof ALLOWED_BUDGETS[number])) {
      errors.budget = 'Invalid budget value';
    }
  }

  if (data.timeline !== undefined && data.timeline !== null) {
    if (!ALLOWED_TIMELINES.includes(data.timeline as typeof ALLOWED_TIMELINES[number])) {
      errors.timeline = 'Invalid timeline value';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
