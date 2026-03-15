import {
  SIGNAL_WEIGHTS,
  TIER_THRESHOLDS,
  BUDGET_SCORES,
  TIMELINE_SCORES,
  SERVICE_SCORES,
  MESSAGE_THRESHOLDS,
} from './scoring-config';
import type { LeadTier } from './scoring-config';

// Input payload — all fields except message are optional (missing = 0 points, no redistribution)
export interface LeadPayload {
  budget?: string | null;
  timeline?: string | null;
  company?: string | null;
  message: string;
  serviceType?: string | null;
}

// Output result — score is clamped to [0, 100]
export interface ScoreResult {
  score: number;
  tier: LeadTier;
}

// Private helpers — not exported

function scoreBudget(budget: string | null | undefined): number {
  if (!budget) return 0;
  return BUDGET_SCORES[budget] ?? 0;
}

function scoreTimeline(timeline: string | null | undefined): number {
  if (!timeline) return 0;
  return TIMELINE_SCORES[timeline] ?? 0;
}

function scoreService(serviceType: string | null | undefined): number {
  if (!serviceType) return 0;
  return SERVICE_SCORES[serviceType] ?? 0;
}

function scoreCompany(company: string | null | undefined): number {
  if (!company || company.trim().length === 0) return 0;
  return SIGNAL_WEIGHTS.company;
}

function scoreMessage(message: string): number {
  const length = message.trim().length;
  for (const threshold of MESSAGE_THRESHOLDS) {
    if (length >= threshold.minLength) {
      return threshold.points;
    }
  }
  return 0;
}

// Pure scoring function — no validation, no DB writes. Phase 7 wires this into the contact API.
export function scoreLead(payload: LeadPayload): ScoreResult {
  const total =
    scoreBudget(payload.budget) +
    scoreTimeline(payload.timeline) +
    scoreCompany(payload.company) +
    scoreMessage(payload.message) +
    scoreService(payload.serviceType);

  const score = Math.max(0, Math.min(100, Math.round(total)));
  return { score, tier: scoreToTier(score) };
}

// Exported tier classifier — used independently by admin page for badge rendering
export function scoreToTier(score: number): LeadTier {
  if (score >= TIER_THRESHOLDS.hot) return 'hot';
  if (score >= TIER_THRESHOLDS.warm) return 'warm';
  return 'cold';
}
