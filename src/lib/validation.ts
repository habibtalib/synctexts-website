export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const ALLOWED_SERVICE_TYPES = ['web_dev', 'devops', 'analytics', 'cloud-hosting', 'synctexts-os'] as const;
export const ALLOWED_BUDGETS = ['under_5k', '5k_15k', '15k_50k', '50k_plus'] as const;
export const ALLOWED_TIMELINES = ['asap', '1_3_months', '3_6_months', 'exploring'] as const;

export const MAX_LENGTHS = {
  name: 100,
  email: 254,
  company: 200,
  message: 5000,
} as const;

export function validateContact(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (name.length > MAX_LENGTHS.name) {
    errors.name = `Name must be at most ${MAX_LENGTHS.name} characters`;
  }

  const email = typeof data.email === 'string' ? data.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  } else if (email.length > MAX_LENGTHS.email) {
    errors.email = `Email must be at most ${MAX_LENGTHS.email} characters`;
  }

  if (data.company !== undefined && data.company !== null) {
    if (typeof data.company !== 'string') {
      errors.company = 'Invalid company value';
    } else if (data.company.trim().length > MAX_LENGTHS.company) {
      errors.company = `Company must be at most ${MAX_LENGTHS.company} characters`;
    }
  }

  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (message.length > MAX_LENGTHS.message) {
    errors.message = `Message must be at most ${MAX_LENGTHS.message} characters`;
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
