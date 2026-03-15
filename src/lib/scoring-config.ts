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

// Budget score map — keys are the values Phase 8's form must emit
export const BUDGET_SCORES: Record<string, number> = {
  under_5k: 0,
  '5k_10k': 10,
  '10k_25k': 20,
  '25k_50k': 28,
  '50k_plus': 35,
} as const;

// Timeline score map — shorter timelines indicate higher urgency/intent
export const TIMELINE_SCORES: Record<string, number> = {
  not_sure: 0,
  '6_months_plus': 5,
  '3_6_months': 15,
  '1_3_months': 22,
  asap: 25,
} as const;

// Service score map — web_dev highest due to largest typical deal size
export const SERVICE_SCORES: Record<string, number> = {
  analytics: 6,
  devops: 8,
  web_dev: 10,
} as const;

// Message length thresholds — sorted descending; first match wins
export const MESSAGE_THRESHOLDS: { minLength: number; points: number }[] = [
  { minLength: 300, points: 15 },
  { minLength: 150, points: 10 },
  { minLength: 50, points: 5 },
];
