# Feature Research

**Domain:** Lead conversion engine for tech agency website (v1.1)
**Researched:** 2026-03-11
**Confidence:** HIGH

> **Scope note:** This file covers ONLY the v1.1 features — multi-step forms, Cal.com scheduling, lead scoring, lead management dashboard, and HubSpot CRM integration. The v1.0 baseline (contact form, admin page, GTM/GA4, SQLite persistence) is shipped and not re-researched here.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that, once the v1.1 scope is committed to, users and team expect to work correctly. Missing these makes the feature feel broken or half-done.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Progress indicator on multi-step form** | Standard UX contract for wizard-style forms. Users feel lost without knowing how many steps remain. Completion rates drop measurably without it. | LOW | Simple step counter ("Step 2 of 4") or progress bar. Keep to 3-5 steps max. Agency forms rarely need more. |
| **Back navigation between form steps** | Users expect to correct earlier answers. No back button = abandonment. Industry data: users who can't go back quit in frustration. | LOW | Client-side state machine. Previous inputs must be preserved on back. No re-fetch, no data loss. |
| **Client-side validation per step** | Validate before advancing to next step. Showing errors after all steps wastes user effort. | LOW | Inline error messages per field. Validate on blur and on "Next" click. Do not block typing. |
| **Form state persistence (in-session)** | If user accidentally refreshes or navigates away mid-form, losing all answers is a conversion killer. | MEDIUM | sessionStorage is sufficient. Do not need permanent persistence — just survive page refreshes within the tab. |
| **Cal.com calendar embed loads correctly** | Scheduling widget must render inline or open as modal. If it fails silently, leads are lost. | LOW | Script-tag embed from Cal.com CDN. Four embed types available: inline, popup on element click, floating button, or link. Vanilla JS snippet works without a framework. |
| **Cal.com prefill from form data** | If user already filled name/email in the contact form before clicking "Book a Call," those fields should be pre-populated in the Cal.com embed. | LOW | Cal.com supports URL query params for prefill: `?name=...&email=...`. Pass collected form data as params when initiating the Cal embed. |
| **Lead scores visible in admin dashboard** | If scoring is built, the admin page must surface scores. Hidden scores provide zero value. | LOW | Add score column to leads table. Sort by score descending by default. Show badge color coding (hot/warm/cold). |
| **Lead status workflow** | Admins need to move leads through states (new → contacted → qualified → won/lost). Read/unread toggle from v1.0 is insufficient for this. | LOW | Status enum: `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`. Dropdown select in dashboard. No complex workflow engine needed — just a status field with manual transitions. |
| **Admin notes on leads** | When admins call or email a lead, they need to log what happened. Contextless lead lists become useless quickly. | LOW | Text area per lead for freeform notes. Single note field is fine for MVP — not a full comment thread. |
| **HubSpot sync failure handling** | If HubSpot API call fails, the lead must not be silently dropped. Local persistence is already in SQLite. The CRM sync is secondary. | MEDIUM | Fire-and-forget with retry. On failure: log error, store `hubspot_synced = false` in SQLite, retry on next admin page load or via background job. Never block form submission waiting on HubSpot. |

### Differentiators (Competitive Advantage)

Features that make the v1.1 implementation meaningfully better than a naive CRM form + Calendly link approach.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Service-specific form branching** | User selects "DevOps" and subsequent questions are DevOps-specific (infrastructure scale, cloud provider, current setup). Web Dev path asks about tech stack preferences. Analytics path asks about current tooling. Relevant questions = higher quality leads. | MEDIUM | Conditional step logic based on service selection in Step 1. Client-side routing between step configurations. Three paths: web-dev, devops, analytics. Each path has 2-3 unique questions plus shared closing step (budget, timeline, contact). |
| **Composite lead score surfaced in dashboard** | Score built from two signal types: form data (explicit) + behavioral (implicit). Explicit: service type selected, budget range, timeline urgency. Implicit: pages visited, time on site, pricing page viewed. Combined score (0-100) lets admin prioritize outreach. | HIGH | Explicit score computed server-side at form submission. Behavioral score requires GA4 custom dimensions or a cookie-based visit counter (simpler). Store composite score in SQLite. Recalculate never needed — set at submission time. |
| **Lead scoring logic is configurable** | Hardcoded scoring weights become wrong over time. Keeping weights in a config object (not scattered through code) makes tuning possible without touching form logic. | LOW | Single `SCORING_CONFIG` object in a server-side module. Admin doesn't need a UI to change weights — developer edits the config file. Document the weights clearly. |
| **Scheduling embedded inline (not redirect)** | Redirecting to cal.com to book = context loss, drop-off. Inline embed keeps user on the agency's branded page throughout. | LOW | Use Cal.com inline embed type. Wrap in a section matching the glassmorphism design. Cal.com embed supports `theme=dark` parameter. |
| **Lead dashboard filtering and sorting** | As lead volume grows, flat list becomes unworkable. Filtering by score range, service type, and status; sorting by score or submission date. | MEDIUM | Server-rendered filter controls. URL query params drive filter state (e.g., `?status=new&service=devops&sort=score`). No client-side JS framework needed — Astro server endpoints handle filtered queries. |
| **HubSpot contact enrichment via custom properties** | Basic HubSpot sync pushes name/email. Enriched sync includes score, service type, budget, source page, and form step completion. HubSpot deal pipeline becomes actually useful. | MEDIUM | Map form fields and score to HubSpot contact properties. Create custom properties in HubSpot (score, service_type, budget_range, source_page). Use `PATCH /crm/v3/objects/contacts/{id}` with `idProperty=email` for upsert. |
| **Post-submission scheduling CTA** | After contact form submit, show a "Book a 30-minute discovery call" prompt with the Cal.com embed. Converts warm leads immediately rather than waiting for email follow-up. | LOW | Trigger Cal.com popup on form success state. Pass name/email from form to Cal prefill params. High leverage, low effort. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AI-powered lead scoring** | "Machine learning will find the best leads" | Requires training data volume (hundreds of closed deals) the agency doesn't have. Adds model hosting, retraining pipeline, and explainability debt. Black-box scores lose admin trust fast. | Rule-based scoring with clearly documented weights. Transparent, auditable, tunable by a developer in 5 minutes. |
| **Real-time HubSpot webhook sync** | "Keep CRM always in sync" | Webhook infrastructure, signature verification, retry queues, and idempotency handling for what is, at this scale, a few leads per day. Massive overengineering. | Async fire-and-forget POST on form submission. If it fails, a `synced=false` flag and a manual "Sync Now" button in the dashboard is sufficient. |
| **Multi-admin user management** | "Different team members need different access" | Adds user auth system, role definitions, session management, and audit logs to what is currently a single Basic Auth password. | Keep Basic Auth for now. Document in PROJECT.md that multi-admin is the trigger for upgrading auth. One password change is simpler than a full auth system. |
| **Automated email sequences from dashboard** | "Trigger follow-up emails from the lead list" | Email sequence tooling (drip campaigns, open tracking, unsubscribe management) is HubSpot's job. Building it in a custom admin page duplicates CRM functionality badly. | Use HubSpot workflows triggered on contact creation/score threshold. That's why we're integrating HubSpot. |
| **Form A/B testing** | "Test which form path converts better" | Requires split traffic, variant tracking, statistical significance tracking (hundreds of impressions minimum), and a testing harness. Premature at this traffic level. | Ship one well-researched form, instrument with GTM events per step, analyze drop-off manually after 4-6 weeks of data. |
| **Cal.com custom Atoms integration** | "Full white-label booking UI" | Cal Atoms (their headless component API) are React-only and require significant UI rebuild of the booking flow. The standard embed already supports dark theme. | Use the standard Cal.com embed with `theme=dark` parameter. Matches glassmorphism aesthetic well enough. |
| **Zapier/Make as HubSpot middleware** | "No-code is faster to set up" | Adds a third-party service dependency with its own pricing, rate limits, and failure modes. The HubSpot Contacts API v3 is straightforward for a developer. | Direct API call from Astro server endpoint using a private app token. Fewer moving parts, no recurring middleware cost. |
| **Lead deduplication logic beyond email** | "What if same person uses different email?" | Fuzzy name matching and phone deduplication create false positives and require manual resolution UI. For an agency with low lead volume, this is noise. | Email is the deduplication key. HubSpot handles this natively. Document the assumption. |

---

## Feature Dependencies

```
[Multi-step form (service-specific)]
    |
    +--requires--> [Form state management (client-side)]
    |                  +--requires--> [Step router component]
    |                  +--requires--> [sessionStorage persistence]
    |
    +--requires--> [Astro API endpoint (form submission)]
    |                  +--already-exists--> [SQLite + Drizzle]
    |                  +--already-exists--> [Resend email notification]
    |                  +--already-exists--> [Honeypot + rate limiting]
    |
    +--feeds--> [Lead scoring (explicit signals)]
    |               +--requires--> [Score schema in SQLite]
    |               +--enhanced-by--> [Behavioral signals (page visits)]
    |
    +--feeds--> [HubSpot CRM sync]
                    +--requires--> [HubSpot private app token]
                    +--requires--> [Custom contact properties in HubSpot]

[Cal.com scheduling embed]
    +--independent--> (script tag, no server-side code needed)
    +--enhanced-by--> [Multi-step form] (prefill from collected data)
    +--enhanced-by--> [Post-submission hook] (trigger after form success)

[Lead scoring]
    +--requires--> [Multi-step form] (explicit signals: service, budget, timeline)
    +--requires--> [Score column in SQLite leads table]
    +--enhanced-by--> [Behavioral signals] (page visit counter via cookie/session)
    +--feeds--> [Lead management dashboard] (sorted by score)
    +--feeds--> [HubSpot sync] (score as custom property)

[Lead management dashboard]
    +--requires--> [Score column in SQLite]
    +--requires--> [Status enum column in SQLite]
    +--requires--> [Notes column in SQLite]
    +--already-exists--> [Basic Auth admin page]
    +--enhanced-by--> [Filtering + sorting via URL params]

[HubSpot CRM sync]
    +--requires--> [Multi-step form data] (richer than v1.0 form)
    +--requires--> [Lead score] (custom property)
    +--requires--> [HubSpot private app token] (no OAuth needed for server-to-server)
    +--independent-from--> [Cal.com] (separate integration)
```

### Dependency Notes

- **Multi-step form is the foundation:** Every other v1.1 feature depends on richer form data. Lead scoring needs service type, budget, and timeline from the form. HubSpot sync is meaningless without these signals. Build the multi-step form first.
- **Lead scoring requires schema changes before dashboard:** The SQLite `submissions` table needs `score`, `status`, and `notes` columns before the dashboard can display them. Schema migration comes before UI.
- **Cal.com is genuinely independent:** No server-side code needed. A script tag and a div (or a button trigger) are sufficient. Can be shipped in any phase without blocking other features.
- **HubSpot sync must not block form submission:** The sync is a side-effect. Form → SQLite is the primary path. HubSpot is async, best-effort. This is not just a preference — it protects against CRM downtime causing lost leads.
- **Behavioral scoring is optional enhancement:** Explicit score (from form data alone) delivers 80% of the value. Behavioral signals (page visits) require a tracking mechanism (cookie counter or GA4 custom dimension readback) and add complexity. Treat as enhancement, not blocker.

---

## MVP Definition

### Launch With (v1.1 core)

Minimum to meaningfully upgrade lead conversion beyond v1.0.

- [ ] **Multi-step form with service branching** — replaces single-step form; 3 paths (web dev, DevOps, analytics); shared closing step for budget/timeline/contact
- [ ] **Progress indicator + back navigation** — without these, multi-step form degrades the UX rather than improving it
- [ ] **Explicit lead scoring on submission** — score computed from service type, budget range, timeline; stored in SQLite; visible in dashboard
- [ ] **Upgraded admin dashboard** — score badge, status dropdown, notes field, sort by score; replaces basic submission list
- [ ] **Cal.com inline embed on Contact page** — with post-form-submit CTA trigger and prefill from form data
- [ ] **HubSpot contact sync** — async POST on form submission; upsert by email; include score and service type as custom properties

### Add After Validation (v1.1 enhancements)

- [ ] **Behavioral scoring signals** — add only after seeing real lead data; determines if page-visit weighting is actually predictive
- [ ] **Dashboard filtering + sorting by URL params** — add when lead volume exceeds ~20/month; premature before that
- [ ] **HubSpot retry queue** — add if CRM sync failure rate exceeds 5%; manual "Sync" button in dashboard is sufficient initially

### Future Consideration (v2+)

- [ ] **Multi-admin auth** — trigger: second team member needs dashboard access
- [ ] **Form analytics per step** — track drop-off rate per step via GTM; needs 50+ form starts to be meaningful data
- [ ] **Calendly/Cal.com round-robin routing** — trigger: multiple team members doing sales calls

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-step form (3 service paths) | HIGH | MEDIUM | P1 |
| Progress indicator + back nav | HIGH | LOW | P1 |
| Explicit lead scoring | HIGH | LOW | P1 |
| Upgraded admin dashboard (score, status, notes) | HIGH | MEDIUM | P1 |
| Cal.com embed + post-form CTA | HIGH | LOW | P1 |
| HubSpot contact sync (async, upsert) | MEDIUM | MEDIUM | P1 |
| sessionStorage form state persistence | MEDIUM | LOW | P1 |
| Service-specific question branching | HIGH | MEDIUM | P1 |
| Dashboard sorting by score | MEDIUM | LOW | P2 |
| Cal.com prefill from form data | MEDIUM | LOW | P2 |
| HubSpot custom properties (score, service type) | MEDIUM | LOW | P2 |
| Behavioral scoring signals | LOW | HIGH | P3 |
| Dashboard filtering by status/service/score | LOW | MEDIUM | P3 |
| HubSpot retry queue | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must ship in v1.1 for the milestone to be meaningful
- P2: Ship in v1.1 if time allows, otherwise first iteration after
- P3: Only add when data justifies the investment

---

## Implementation Behavior Reference

### Multi-Step Form: Expected UX Flow

```
Step 1: Service selection (radio: Web Dev / DevOps / Analytics)
         |
         +-- Web Dev path:
         |     Step 2: Current site? (WordPress/Laravel/None/Other) + Tech stack preferences
         |     Step 3: Project scope (new build / redesign / ongoing) + timeline
         |
         +-- DevOps path:
         |     Step 2: Current infra (AWS/GCP/Azure/Self-hosted/None) + scale (traffic estimate)
         |     Step 3: Pain point (cost / reliability / automation / security)
         |
         +-- Analytics path:
               Step 2: Current tools (GA4/None/Adobe/Other) + data maturity level
               Step 3: Primary goal (conversion tracking / reporting / attribution)

Step N (shared): Budget range + contact info (name, email, company optional)
Step N+1: Success state → "Thank you" + Cal.com booking CTA
```

- Start with service selection (low friction, positions as tailored conversation)
- Back button always available on steps 2+
- Step counter: "Step X of Y" (Y varies by path: 3 or 4 steps)
- Animate step transition (slide or fade — keep subtle, consistent with existing reveal animations)

### Lead Scoring: Point Model Reference

Explicit signals (form data, max 70 points):
- Budget: `< $5K` = 5 pts, `$5K-$15K` = 15 pts, `$15K-$50K` = 30 pts, `$50K+` = 40 pts
- Timeline: `just exploring` = 5 pts, `3-6 months` = 15 pts, `1-3 months` = 25 pts, `ASAP` = 30 pts
- Service: `web dev` = 10 pts, `devops` = 10 pts, `analytics` = 10 pts (equal; adjust after real data)

Behavioral signals (implicit, max 30 points — optional/phase 2):
- Pricing page visited: +15 pts
- Portfolio page visited: +5 pts
- >3 pages viewed in session: +5 pts
- Return visit (second session): +5 pts

Score interpretation:
- 0-30: Cold (no badge / grey)
- 31-60: Warm (yellow badge)
- 61-100: Hot (red/orange badge)

### Cal.com Integration: Technical Pattern

```html
<!-- 1. Load embed script once (ideally in <head>) -->
<script type="text/javascript">
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) { const api = function () { p(api, arguments); };
        const namespace = ar[1]; api.q = api.q || [];
        typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", { origin: "https://cal.com" });
</script>

<!-- 2a. Inline embed -->
<div style="width:100%;height:100%;overflow:scroll" id="cal-booking"></div>
<script>
  Cal("inline", { elementOrSelector: "#cal-booking", calLink: "your-username/30min" });
</script>

<!-- 2b. Popup on button click (post-form success) -->
<button data-cal-link="your-username/30min" data-cal-config='{"theme":"dark"}'>
  Book a Discovery Call
</button>
```

Prefill pattern (from form data):
```javascript
Cal("ui", {
  prefill: { name: formData.name, email: formData.email },
  theme: "dark"
});
```

### HubSpot API: Integration Pattern

Authentication: HubSpot private app token (not OAuth). Create in HubSpot > Settings > Integrations > Private Apps. Scope needed: `crm.objects.contacts.write`.

Upsert endpoint (create or update by email):
```
POST https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert
Authorization: Bearer {PRIVATE_APP_TOKEN}
Content-Type: application/json

{
  "inputs": [{
    "idProperty": "email",
    "id": "lead@example.com",
    "properties": {
      "email": "lead@example.com",
      "firstname": "Jane",
      "lastname": "Doe",
      "hs_lead_status": "NEW",
      "synctexts_score": "75",
      "synctexts_service": "devops",
      "synctexts_budget": "$15K-$50K",
      "synctexts_source": "/contact"
    }
  }]
}
```

Custom properties (`synctexts_score`, `synctexts_service`, `synctexts_budget`, `synctexts_source`) must be created manually in HubSpot UI before first sync. Rate limits (free tier): 100 requests/10 seconds, 250K/day — far above what an agency site needs.

---

## Sources

- [Smashing Magazine — Creating an Effective Multistep Form (Dec 2024)](https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/)
- [Webstacks — 8 Best Multi-Step Form Examples 2025](https://www.webstacks.com/blog/multi-step-form)
- [FormAssembly — Multi-Step Form Best Practices](https://www.formassembly.com/blog/multi-step-form-best-practices/)
- [Growform — Multi-Step Form UX Best Practices](https://www.growform.co/must-follow-ux-best-practices-when-designing-a-multi-step-form/)
- [FormAssembly — Conditional Logic in Forms](https://www.formassembly.com/blog/multi-step-form-conditional-logic/)
- [Cal.com Embed Help — Adding Embed to Your Webpage](https://cal.com/help/embedding/adding-embed)
- [Cal.com — Embed Features Overview](https://cal.com/features/embed)
- [HubSpot Developers — CRM Contacts API v3 Guide](https://developers.hubspot.com/docs/api-reference/crm-contacts-v3/guide)
- [HubSpot Developers — API Usage Guidelines and Limits](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines)
- [Salespanel — Lead Scoring Best Practices](https://salespanel.io/blog/marketing/lead-scoring-best-practices/)
- [HubSpot Blog — Lead Scoring Instructions](https://blog.hubspot.com/marketing/lead-scoring-instructions)
- [Lead411 — Leveraging Behavioral Data for Lead Scoring 2025](https://www.lead411.com/blog/leveraging-behavioral-data-for-predictive-lead-scoring-in-2025-lead411/)
- [Chift — Best Practices for HubSpot API Integration](https://www.chift.eu/blog/best-practices-for-a-smooth-hubspot-api-integration)
- [Aufait UX — CRM UX Design Best Practices](https://www.aufaitux.com/blog/crm-ux-design-best-practices/)

---
*Feature research for: SyncTexts v1.1 Lead Conversion Engine*
*Researched: 2026-03-11*
