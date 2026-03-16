# Roadmap: SyncTexts Agency Website

## Milestones

- ✅ **v1.0 Agency Website MVP** — Phases 1-4 (shipped 2026-03-11)
- 🚧 **v1.1 Lead Conversion Engine** — Phases 5-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Agency Website MVP (Phases 1-4) — SHIPPED 2026-03-11</summary>

- [x] Phase 1: Foundation & Migration (2/2 plans) — completed 2026-03-09
- [x] Phase 2: Content & Portfolio (5/5 plans) — completed 2026-03-10
- [x] Phase 3: Lead Capture (2/2 plans) — completed 2026-03-10
- [x] Phase 4: SEO, Analytics & Deployment (3/3 plans) — completed 2026-03-11

Full details: .planning/milestones/v1.0-ROADMAP.md

</details>

### 🚧 v1.1 Lead Conversion Engine (In Progress)

**Milestone Goal:** Transform the website from a passive lead capture form into an active conversion engine with intelligent scoring, scheduling, and CRM integration.

- [x] **Phase 5: Database Foundation** - Extend schema safely with WAL mode and generate+migrate workflow (completed 2026-03-13)
- [x] **Phase 6: Lead Scoring Engine** - Pure scoring function with configurable weights and tier thresholds (completed 2026-03-15)
- [x] **Phase 7: Extended API and HubSpot Integration** - Form endpoint wired to scoring and async CRM sync (completed 2026-03-15)
- [ ] **Phase 8: Multi-Step Form Frontend** - Service-branched wizard with persistence and animated transitions
- [ ] **Phase 9: Cal.com Scheduling** - Embedded booking widget linked to lead records via webhook
- [ ] **Phase 10: Lead Management Dashboard** - Upgraded admin with scores, status workflow, filtering, and pagination

## Phase Details

### Phase 5: Database Foundation
**Goal**: The database schema is extended safely and the production migration workflow prevents data loss
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Running `drizzle-kit generate` + `drizzle-kit migrate` on a copy of the production database adds all new columns without dropping any existing rows
  2. The `submissions` table has the 8 new nullable columns: `service_type`, `budget`, `timeline`, `lead_score`, `lead_status`, `notes`, `hubspot_id`, `hubspot_synced_at`
  3. SQLite opens with WAL journal mode and `busy_timeout = 5000` — concurrent reads during form submission do not produce BUSY errors
  4. `drizzle-kit push` is removed from all production npm scripts
**Plans:** 1/1 plans complete
Plans:
- [ ] 05-01-PLAN.md — Extend schema with 8 columns, add WAL PRAGMAs, establish migration workflow

### Phase 6: Lead Scoring Engine
**Goal**: Lead scores are computed from form data using a transparent, configurable rule-based function
**Depends on**: Phase 5
**Requirements**: SCORE-01, SCORE-02, SCORE-03
**Success Criteria** (what must be TRUE):
  1. Calling `scoreLead()` with a complete form payload returns a number between 0 and 100
  2. The scoring config object documents weights for each signal (budget, timeline, service type, company present, message length) and the thresholds for cold (0-30), warm (31-60), and hot (61-100) tiers
  3. Score and tier are stored in SQLite on form submission and visible in the admin page with color-coded badges
**Plans:** 1/1 plans complete
Plans:
- [ ] 06-01-PLAN.md — Create scoring function with configurable weights and add score badges to admin page

### Phase 7: Extended API and HubSpot Integration
**Goal**: The contact form endpoint accepts the full multi-step payload, scores it, and syncs to HubSpot without ever blocking lead capture
**Depends on**: Phase 6
**Requirements**: HS-01, HS-02, HS-03, HS-04, HS-05, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Submitting a form with new fields (service type, budget, timeline) results in all fields persisted to SQLite and a lead score recorded
  2. A HubSpot contact is created or updated asynchronously — a HubSpot API outage returns a 200 to the user and logs the failure without losing the lead
  3. All admin API endpoints return 401 for unauthenticated requests — a shared `requireBasicAuth` helper is used consistently
  4. Admin can click "Sync to HubSpot" on a lead that failed to sync and the sync runs immediately
**Plans:** 2/2 plans complete
Plans:
- [ ] 07-01-PLAN.md — Extend contact API with new fields, scoring, HubSpot sync, and shared auth helper
- [ ] 07-02-PLAN.md — Add manual HubSpot re-sync endpoint and sync status UI to admin dashboard

### Phase 8: Multi-Step Form Frontend
**Goal**: Visitors can complete a service-specific multi-step contact form that survives refresh, back navigation, and page transitions
**Depends on**: Phase 7
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08
**Success Criteria** (what must be TRUE):
  1. Visitor selects a service (Web Dev, DevOps, Analytics) and sees a different set of follow-up questions for each choice
  2. A step indicator shows the current step and total steps at all times; clicking back returns to the previous step with all previously entered data intact
  3. Refreshing the page mid-form restores the visitor to their current step with all entered data still present
  4. Attempting to advance a step with invalid or missing fields shows inline error messages without submitting the form
  5. After successful submission, a "Book a Discovery Call" CTA appears on the confirmation screen
**Plans:** 2/3 plans executed
Plans:
- [ ] 08-01-PLAN.md — Rewrite contact.astro HTML structure and scoped CSS for multi-step wizard
- [ ] 08-02-PLAN.md — Rewrite contact-form.ts as multi-step state machine with full interactivity
- [ ] 08-03-PLAN.md — Human verification of complete multi-step form wizard

### Phase 9: Cal.com Scheduling
**Goal**: Visitors can book a discovery call directly from the contact page, and bookings are linked to their lead record
**Depends on**: Phase 8
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05
**Success Criteria** (what must be TRUE):
  1. The Cal.com booking widget loads on the contact page with dark theme and indigo accent color matching the glassmorphism design
  2. After form submission, clicking "Book a Discovery Call" opens the Cal.com embed with name and email prefilled from the submitted form
  3. Navigating away from and back to the contact page re-initializes the Cal.com embed without errors
  4. When a visitor completes a booking, the matching lead record in SQLite is updated with the Cal.com booking UID and scheduled time
**Plans:** 1 plan
Plans:
- [ ] 09-xx-PLAN.md — To be planned

### Phase 10: Lead Management Dashboard
**Goal**: Admin can view, qualify, and manage every lead with score visibility, status workflow, notes, filtering, and HubSpot record links
**Depends on**: Phase 9
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. The dashboard displays every lead with a color-coded score badge (cold/warm/hot), current status, service type, and submission date
  2. Admin can change a lead's status through the full workflow (new -> contacted -> qualified -> proposal_sent -> won/lost) from the dashboard without leaving the page
  3. Admin can add and edit a free-text note on any lead; the note persists on save
  4. Admin can filter leads by status, service type, and minimum score via URL params, and sort by score or date — the page URL reflects the active filters
  5. The dashboard paginates results and never loads the full unbounded lead list in a single query
  6. Each lead row shows HubSpot sync status and a direct link to the HubSpot contact record when synced
**Plans:** 1 plan
Plans:
- [ ] 10-xx-PLAN.md — To be planned

## Progress

**Execution Order:** Phases execute in numeric order: 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Migration | v1.0 | 2/2 | Complete | 2026-03-09 |
| 2. Content & Portfolio | v1.0 | 5/5 | Complete | 2026-03-10 |
| 3. Lead Capture | v1.0 | 2/2 | Complete | 2026-03-10 |
| 4. SEO, Analytics & Deployment | v1.0 | 3/3 | Complete | 2026-03-11 |
| 5. Database Foundation | v1.1 | 1/1 | Complete | 2026-03-13 |
| 6. Lead Scoring Engine | v1.1 | 1/1 | Complete | 2026-03-15 |
| 7. Extended API and HubSpot Integration | v1.1 | 2/2 | Complete | 2026-03-15 |
| 8. Multi-Step Form Frontend | 2/3 | In Progress|  | - |
| 9. Cal.com Scheduling | v1.1 | 0/TBD | Not started | - |
| 10. Lead Management Dashboard | v1.1 | 0/TBD | Not started | - |
