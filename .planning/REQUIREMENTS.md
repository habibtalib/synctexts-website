# Requirements: SyncTexts Agency Website

**Defined:** 2026-03-11
**Core Value:** Potential clients can see SyncTexts' real project portfolio and expertise, then easily get in touch — turning the website into a lead generation engine.

## v1.1 Requirements

Requirements for the Lead Conversion Engine milestone. Each maps to roadmap phases.

### Multi-Step Forms

- [ ] **FORM-01**: User can select a service type (Web Dev, DevOps, Analytics) as the first step of the contact form
- [ ] **FORM-02**: User sees service-specific questions after selecting a service type (different fields per path)
- [ ] **FORM-03**: User sees a progress indicator showing current step and total steps
- [ ] **FORM-04**: User can navigate back to previous steps without losing entered data
- [ ] **FORM-05**: User sees inline validation errors per step before advancing to the next step
- [ ] **FORM-06**: User's form progress persists across page refresh via sessionStorage
- [ ] **FORM-07**: User sees animated step transitions consistent with the existing design system
- [ ] **FORM-08**: User sees a "Book a Discovery Call" CTA after successful form submission

### Lead Scoring

- [ ] **SCORE-01**: System computes a lead score (0-100) from form data on submission (service type, budget, timeline, company, message length)
- [ ] **SCORE-02**: Lead scores are stored in SQLite and displayed with color-coded tiers (cold/warm/hot) in the admin dashboard
- [ ] **SCORE-03**: Scoring weights are defined in a configurable server-side config object

### Cal.com Scheduling

- [ ] **CAL-01**: User can book a discovery call via an embedded Cal.com widget on the contact page
- [ ] **CAL-02**: Cal.com embed uses dark theme matching the site's glassmorphism design
- [ ] **CAL-03**: Cal.com embed prefills name and email from the contact form submission
- [ ] **CAL-04**: Cal.com bookings are linked to lead records via webhook integration
- [ ] **CAL-05**: Cal.com embed survives Astro View Transitions (re-initializes on page navigation)

### Lead Dashboard

- [ ] **DASH-01**: Admin can view leads with score badges, status, and submission details
- [ ] **DASH-02**: Admin can update lead status through a workflow (new/contacted/qualified/proposal_sent/won/lost)
- [ ] **DASH-03**: Admin can add and edit notes on each lead
- [ ] **DASH-04**: Admin can sort leads by score, date, or status
- [ ] **DASH-05**: Admin can filter leads by status, service type, and minimum score via URL params
- [ ] **DASH-06**: Dashboard paginates results to handle growing lead volume
- [ ] **DASH-07**: Dashboard shows HubSpot sync status and direct link to HubSpot contact per lead

### HubSpot CRM

- [ ] **HS-01**: System syncs new leads to HubSpot as contacts asynchronously after form submission
- [ ] **HS-02**: HubSpot sync uses upsert-by-email to prevent duplicate contacts
- [ ] **HS-03**: System sends lead score, service type, budget, and source page as HubSpot custom properties
- [ ] **HS-04**: Admin can manually trigger HubSpot re-sync for individual leads from the dashboard
- [ ] **HS-05**: HubSpot sync failures are logged and do not block form submission

### Infrastructure

- [ ] **INFRA-01**: Database schema migrated via Drizzle generate+migrate (never push) with production backup
- [ ] **INFRA-02**: SQLite configured with WAL mode and busy_timeout for concurrent read/write safety
- [ ] **INFRA-03**: Shared auth helper used by all admin API endpoints

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Behavioral Scoring

- **BSCORE-01**: System tracks page visits and engagement signals for lead scoring enhancement
- **BSCORE-02**: Behavioral scoring requires GDPR consent gate before activation

### Advanced Admin

- **ADMIN-01**: Multi-admin user management with role-based access
- **ADMIN-02**: Form analytics per step via GTM (drop-off rate tracking)

### CRM Enhancements

- **CRM-01**: HubSpot retry queue for failed syncs
- **CRM-02**: Cal.com round-robin routing for multiple sales team members

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-powered lead scoring | No training data volume; rule-based scoring is transparent and tunable |
| Real-time HubSpot webhook sync | Massively overengineered for agency lead volume |
| Automated email sequences from dashboard | That is HubSpot Workflows' job; duplicates CRM functionality |
| Form A/B testing | Premature at current traffic; instrument with GTM first, analyze after 4-6 weeks |
| Self-hosted Cal.com | Significant ops burden (Postgres, Redis, separate Docker service); cloud free tier is sufficient |
| Cal.com custom Atoms (React) | Requires React islands; standard embed with dark theme is sufficient |
| Zapier/Make as HubSpot middleware | Adds third-party dependency; direct API call is simpler |
| Lead deduplication beyond email | Fuzzy matching creates false positives; email is the dedup key; HubSpot handles natively |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | — | Pending |
| FORM-02 | — | Pending |
| FORM-03 | — | Pending |
| FORM-04 | — | Pending |
| FORM-05 | — | Pending |
| FORM-06 | — | Pending |
| FORM-07 | — | Pending |
| FORM-08 | — | Pending |
| SCORE-01 | — | Pending |
| SCORE-02 | — | Pending |
| SCORE-03 | — | Pending |
| CAL-01 | — | Pending |
| CAL-02 | — | Pending |
| CAL-03 | — | Pending |
| CAL-04 | — | Pending |
| CAL-05 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| DASH-06 | — | Pending |
| DASH-07 | — | Pending |
| HS-01 | — | Pending |
| HS-02 | — | Pending |
| HS-03 | — | Pending |
| HS-04 | — | Pending |
| HS-05 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 31 total
- Mapped to phases: 0
- Unmapped: 31 ⚠️

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
