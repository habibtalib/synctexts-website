import type { ALLOWED_BUDGETS, ALLOWED_TIMELINES } from './validation';

// Lead scoring signal weights — must sum to 100
export const SIGNAL_WEIGHTS = {
  budget: 35,      // Largest deal-size signal: budget directly correlates with project value
  timeline: 25,    // Urgency signal: shorter timelines indicate higher intent
  company: 15,     // Context signal: named company indicates a professional, not personal, inquiry
  message: 15,     // Intent signal: longer messages indicate more serious consideration
  service: 10,     // Service fit signal: some services have higher typical deal size
} as const;

// Tier thresholds — scores below warm are cold
export const TIER_THRESHOLDS = {
  warm: 31,  // >= 31 is warm
  hot: 61,   // >= 61 is hot; scores below warm threshold are cold
} as const;

// Lead tier type — three-level classification for prioritization
export type LeadTier = 'cold' | 'warm' | 'hot';

// Budget score map — keys must match ALLOWED_BUDGETS in validation.ts and the
// contact form's <option> values exactly; the satisfies clause fails the type check if they drift
export const BUDGET_SCORES: Record<string, number> = {
  under_5k: 5,
  '5k_15k': 15,
  '15k_50k': 25,
  '50k_plus': 35,
} satisfies Record<(typeof ALLOWED_BUDGETS)[number], number>;

// Timeline score map — keys must match ALLOWED_TIMELINES; shorter timelines indicate higher urgency/intent
export const TIMELINE_SCORES: Record<string, number> = {
  exploring: 0,
  '3_6_months': 12,
  '1_3_months': 20,
  asap: 25,
} satisfies Record<(typeof ALLOWED_TIMELINES)[number], number>;

// Service score map — web_dev highest due to largest typical deal size.
// Products: cloud-hosting is recurring managed-hosting revenue (devops-like);
// synctexts-os is an early-access waitlist signup, so it scores lowest.
export const SERVICE_SCORES: Record<string, number> = {
  'synctexts-os': 5,
  analytics: 6,
  'cloud-hosting': 7,
  devops: 8,
  web_dev: 10,
} as const;

// Message length thresholds — sorted descending; first match wins
export const MESSAGE_THRESHOLDS: { minLength: number; points: number }[] = [
  { minLength: 300, points: 15 },
  { minLength: 150, points: 10 },
  { minLength: 50, points: 5 },
];
