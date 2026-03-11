# Stack Research

**Domain:** Agency website — lead conversion engine (v1.1 additions)
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

> This file extends the v1.0 stack. All previously validated technologies (Astro 5.x, @astrojs/node, Drizzle ORM, better-sqlite3, Resend, Docker/Caddy) are NOT re-researched here. Only additions and changes for v1.1 are documented.

---

## New Stack Additions for v1.1

### Multi-Step Forms

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro Actions | built-in (Astro 4.15+, stable in 5.x) | Server-side form handling with type-safe validation | Already in the stack. Actions accept `z.discriminatedUnion()` to route multi-step submissions by step identifier. No new library. Each step posts to the same action with a `step` discriminator field. Server returns next step data or final success. Progressive enhancement works natively. | HIGH |
| Vanilla JS (existing) | — | Client-side step progression, field show/hide | CSS class toggling per step with `data-step` attributes. No framework needed. The existing scroll animation pattern (`IntersectionObserver` + class toggling) applies directly. Steps are hidden/shown with a single JS function. | HIGH |
| Zod (via `astro:actions`) | bundled with Astro 5.x | Schema validation per form step | Already used in content collections. `z.discriminatedUnion('step', [...])` creates one schema that validates differently based on which step was submitted. No separate install. | HIGH |

**Pattern:** Each form step is a `<fieldset>` rendered server-side, hidden with CSS. JS shows one step at a time. On "Next", JS collects the current step's fields and calls the Astro Action. The action validates the step and returns either errors (shown inline) or a success token allowing the next step to render. Final step submits all accumulated data as a single lead record.

**Do not use:** React Hook Form, Formik, or any headless form library. They require a UI framework (React/Vue) which is not in this stack. Astro Actions + vanilla JS handles this without framework overhead.

---

### Cal.com Scheduling Embed

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cal.com embed snippet (vanilla JS) | `@calcom/embed-snippet` 1.3.x | Inline scheduling widget | No npm install required for the CDN path. The embed is a small IIFE that loads `https://app.cal.com/embed/embed.js` and exposes a `Cal()` global. Works in an Astro `<script>` tag without any adapter or framework. The `Cal("inline", { elementOrSelector, calLink })` API renders the calendar inside any div container. | MEDIUM |

**Implementation approach for Astro:**

```astro
<!-- In an .astro component -->
<div id="cal-booking"></div>
<script>
  // Cal.com embed snippet (copy from Cal.com dashboard)
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true; }
      if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1];
        api.q = []; if (typeof namespace === "string") { cal.ns[namespace] = api; p(api, ar); p(cal, [L, api]); }
        else p(cal, ar); return; }
      p(cal, ar); };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", { origin: "https://app.cal.com" });
  Cal("inline", {
    elementOrSelector: "#cal-booking",
    calLink: "your-username/discovery-call",
    config: { theme: "dark" }
  });
  Cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
</script>
```

**Dark theme:** Cal.com's embed accepts `config: { theme: "dark" }` which aligns with the glassmorphism design system without CSS overrides.

**Prefilling from form data:** After the multi-step contact form completes, the scheduling page can pre-fill `config.name` and `config.email` from the submitted lead data, reducing friction.

**Do not use:** `@calcom/embed-react` — requires React island setup with a framework adapter. The vanilla snippet achieves identical functionality.

---

### HubSpot CRM Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@hubspot/api-client` | 13.4.0 | Create/update contacts and deals in HubSpot CRM | Official HubSpot SDK for Node.js. Wraps the v3 REST API with TypeScript types. Exposes `hubspotClient.crm.contacts.basicApi.create()` and `hubspotClient.crm.deals.basicApi.create()` with association support. Rate limiting built in via Bottleneck. Used in an Astro server endpoint (runs in Node.js — same environment as the existing contact form API). | HIGH |

**Authentication:** HubSpot API keys were sunset in November 2022. The only supported auth method is a Private App access token — a static token generated per integration with scoped permissions. Store in `.env` as `HUBSPOT_ACCESS_TOKEN`. Required scopes: `crm.objects.contacts.write`, `crm.objects.deals.write`.

**Integration point:** The existing `src/pages/api/contact.ts` endpoint (or the new Astro Action handler) calls HubSpot after writing the lead to SQLite. HubSpot is a secondary sync, not the primary store — SQLite remains the source of truth. Sync is fire-and-forget with error logging (HubSpot being down should not fail the lead capture).

**Do not use:** Direct `fetch()` calls to the HubSpot REST API. The SDK handles auth headers, retries, rate limiting, and TypeScript types. No benefit to raw fetch here.

---

### Lead Scoring

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Custom scoring module (no library) | — | Compute composite lead score from form fields + behavioral signals | Lead scoring for an agency is a simple weighted sum, not an ML problem. A `src/lib/scoring.ts` module with a `scoreLead(formData, behaviorData)` function is sufficient and maintainable. No external library needed. Scores stored as an integer column in the existing leads SQLite table. | HIGH |
| GTM Data Layer (existing) | — | Behavioral signals: page visits, engagement, CTA clicks | GTM is already tracking CTA clicks and form events. Behavioral data (which service pages were visited before submitting) can be passed in a hidden form field populated by JS reading the GTM data layer or sessionStorage. This avoids a separate analytics SDK. | MEDIUM |

**Scoring inputs:**
- Service type requested (web dev = 3pts, DevOps = 4pts, analytics = 3pts, mobile = 4pts)
- Budget range (enterprise tier = 5pts, growth = 3pts, starter = 1pt)
- Pages visited before submission (portfolio page = 2pts, pricing page = 3pts, blog = 1pt)
- Form completion path (completed multi-step = 2pts, simple contact = 1pt)
- Message quality proxy (message length > 100 chars = 1pt)

**Do not use:** Third-party lead scoring SaaS (Clearbit, Madkudu). Overkill and costly for an agency site with dozens of leads/month, not thousands.

---

### Lead Management Dashboard

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro SSR page (existing adapter) | built-in | Server-rendered dashboard page at `/admin/leads` | Extends the existing Basic Auth admin pattern. The page queries SQLite via Drizzle and renders an HTML table server-side. No client-side data fetching needed. Astro's `export const prerender = false` on the page enables SSR. URL query params (`?status=new&sort=score_desc&page=2`) drive filtering and pagination without JS. | HIGH |
| Vanilla JS (existing) | — | Client-side enhancements: inline status updates, note saving | A minimal script handles status dropdown `change` events and POSTs to an `/api/admin/lead-update` endpoint. No framework needed. The table is still rendered server-side; JS only handles the async update to avoid full page reload on status changes. | HIGH |

**Dashboard features implementable without new libraries:**
- Sortable columns: URL params (`?sort=score&dir=desc`)
- Status filter: URL params (`?status=new`)
- Pagination: URL params (`?page=2`) — Drizzle `LIMIT`/`OFFSET`
- Inline status update: small `fetch()` POST to update endpoint
- Lead detail view: separate SSR page at `/admin/leads/[id]`
- Notes: `textarea` + POST to update endpoint, stored in `lead_notes` table

**Do not use:** TanStack Table, AG Grid, or any client-side data grid library. Server-side rendered tables with URL params handle all required functionality without adding JS payload.

---

## Revised Installation Commands

```bash
# HubSpot CRM integration
npm install @hubspot/api-client

# No new installs needed for:
# - Multi-step forms (Astro Actions already in Astro 5.x)
# - Cal.com embed (CDN snippet, no npm install)
# - Lead scoring (custom module)
# - Lead management dashboard (Astro SSR + existing Drizzle)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro Actions + vanilla JS for multi-step forms | React Hook Form / Formik | Only if you add React islands to the project. Unnecessary framework cost for vanilla Astro. |
| Cal.com CDN embed snippet | `@calcom/embed-react` | Only if the project already uses React islands extensively. Zero benefit over the vanilla snippet for this stack. |
| Cal.com cloud (`app.cal.com`) | Self-hosted Cal.com | Only if you need custom domain for the booking page itself, full data ownership, or white-labeling. Adding self-hosted Cal.com is a significant ops burden — a separate Docker service, Postgres DB, and Redis cache. Cloud free tier is sufficient for an agency. |
| `@hubspot/api-client` SDK | Direct HubSpot REST fetch calls | When you want zero dependencies and are comfortable managing auth headers manually. For a one-person agency project, the SDK's types and retry handling are worth the 2MB. |
| Custom scoring module | Clearbit Reveal / Madkudu | When you have 1000+ leads/month and need ML-based scoring with enrichment. Wrong scale for this project. |
| SSR Astro page for dashboard | React SPA dashboard (Vite) | Only if the dashboard needs real-time updates, drag-and-drop kanban, or complex client state. A CRM for an agency with ~50 leads/month does not need a SPA. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@calcom/embed-react` | Requires React adapter + islands setup. Identical result to CDN snippet with 10x more complexity. | Cal.com CDN embed snippet via `<script>` in `.astro` component |
| HubSpot Forms SDK (`//js.hsforms.net/forms/v2.js`) | Replaces your form with HubSpot's widget — loses multi-step UX, dark theme, and custom validation. | Custom form + `@hubspot/api-client` API sync after submission |
| React Hook Form / Formik | Requires React island. Multi-step form state can be managed with `sessionStorage` + vanilla JS. | Astro Actions with `z.discriminatedUnion()` + vanilla JS step progression |
| Headless UI (Radix, Headless UI) | React-only. Not compatible with vanilla Astro components. | Native HTML `<details>`, `<dialog>`, CSS custom properties for interactive UI |
| Prisma (for lead scoring persistence) | Already using Drizzle. Two ORMs in one project is unnecessary. | Add `score` and `status` columns to the existing leads table via Drizzle migration |
| Redis / session store for multi-step form state | Overkill for a 3-step form. | `sessionStorage` for client-side step accumulation; only final submission hits the server |

---

## Stack Patterns by Variant

**If Cal.com is self-hosted (future decision):**
- Change embed script src from `https://app.cal.com/embed/embed.js` to `https://your-cal-domain.com/embed/embed.js`
- No other code changes needed — the Cal() API is identical
- Requires separate Docker Compose service, Postgres, Redis — significant ops overhead

**If HubSpot sync needs to be bidirectional (future):**
- Add HubSpot webhook receiver endpoint (`/api/webhooks/hubspot`) to sync status updates back to SQLite
- Requires HubSpot webhook subscription via Private App settings
- Still no new libraries — plain Astro server endpoint with signature verification

**If lead volume exceeds ~500/month:**
- Consider moving behavioral signals to a proper event pipeline instead of sessionStorage
- Upgrade in-memory rate limiter to Redis-backed (already noted in v1.0 tech debt)
- SQLite remains adequate up to ~10K leads

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@hubspot/api-client@13.4.0` | Node.js 18+, Astro 5.x (Node adapter) | Uses native `fetch` internally in newer versions. No polyfill needed with Node 18+. |
| Cal.com embed snippet (CDN) | Any modern browser with `<script>` support | No npm version to pin — loads from `app.cal.com` CDN. Pin by specifying `?version=X` query param if needed. |
| Astro Actions | Astro 4.15+, stable in 5.x | `defineAction`, `z` from `astro:actions` and `astro/zod`. `getActionContext()` available in middleware (Astro 5.0+). |

---

## Sources

- [Astro Actions Docs](https://docs.astro.build/en/guides/actions/) — Stable in Astro 5.x, `z.discriminatedUnion()` for multi-step routing — HIGH confidence
- [Cal.com Embed Docs](https://calcom.gitbook.io/docs/core-features/embed/set-up-your-embed) — `Cal("inline", {...})` vanilla JS API — MEDIUM confidence (docs sparse, verified against GitHub discussions)
- [Cal.com Embed Issues #15643](https://github.com/calcom/cal.com/discussions/15643) — `Cal()` API details, self-hosted vs cloud considerations — MEDIUM confidence
- [@calcom/embed-snippet on npm](https://www.npmjs.com/package/@calcom/embed-snippet) — Version 1.3.2, confirmed package exists — MEDIUM confidence
- [HubSpot API NodeJS GitHub](https://github.com/HubSpot/hubspot-api-nodejs) — Official SDK, v13.4.0 — HIGH confidence
- [HubSpot Private Apps Docs](https://developers.hubspot.com/docs/api/client-libraries) — Private app access token replaces API keys (sunset Nov 2022) — HIGH confidence
- [Astro SSR Table (GitHub)](https://github.com/tresero/astro-ssr-table) — Pattern for URL-param-driven SSR tables — MEDIUM confidence (community library, not official)

---

*Stack research for: SyncTexts agency website v1.1 Lead Conversion Engine*
*Researched: 2026-03-11*
