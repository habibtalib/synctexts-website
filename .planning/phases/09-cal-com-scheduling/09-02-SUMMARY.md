---
phase: 09-cal-com-scheduling
plan: 02
subsystem: ui
tags: [cal-com, embed, scheduling, typescript, astro, gtm]

# Dependency graph
requires:
  - phase: 08-multi-step-form-frontend
    provides: contact-form.ts state machine with success panel innerHTML, CAL_URL constant, FormState interface
provides:
  - Cal.com inline booking embed in contact form success panel
  - injectCalEmbed() function with IIFE snippet lazy-loading
  - Dark theme + indigo (#6366f1) Cal.com embed styling
  - Name/email prefill from form state
  - Loading spinner with reduced-motion support in contact.astro
  - Fallback link if Cal.com embed fails to load after 10s
  - GTM events: cal_embed_shown, cal_booking_created
affects: [09-cal-com-scheduling, admin-dashboard]

# Tech tracking
tech-stack:
  added: [Cal.com embed CDN (app.cal.com/embed/embed.js — runtime only, no npm install)]
  patterns:
    - Lazy Cal.com script injection via IIFE snippet appended to document.head after form submission
    - Double-injection guard via sentinel script ID (cal-embed-script)
    - postMessage listener to detect Cal.com iframe render and remove spinner
    - 5s spinner fallback timeout + 10s iframe fallback link timeout for graceful degradation
    - :global() CSS selectors in Astro scoped styles for JS-injected DOM elements

key-files:
  created: []
  modified:
    - src/scripts/contact-form.ts
    - src/pages/contact.astro

key-decisions:
  - "Used :global() CSS selector wrappers in Astro scoped style block for #cal-embed-container and #cal-embed-loading since they are injected via JS innerHTML and won't receive Astro's scoped data attribute"
  - "Cal.com IIFE snippet inlined as script.textContent (not src) to avoid extra network request; embed.js lazy-loaded by the snippet only when form is submitted"
  - "postMessage listener checks parsed.originator === 'CAL' for spinner removal — falls back to 5s timeout if message never arrives"
  - "Fallback link rendered after 10s only if no iframe is present in the container — preserves UX if Cal.com CDN is unavailable"

patterns-established:
  - "Pattern: Lazy third-party script injection — inject IIFE snippet to document.head after user action, not on page load"
  - "Pattern: Double-inject guard with sentinel element ID for scripts injected inside astro:page-load listener"
  - "Pattern: :global() for JS-injected element CSS in Astro scoped styles"

requirements-completed: [CAL-01, CAL-02, CAL-03, CAL-05]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 09 Plan 02: Cal.com Embed Injection Summary

**Cal.com inline booking widget injected lazily after form submit — dark theme, indigo accent, name/email prefill from FormState, with loading spinner and 10s fallback link**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T03:28:06Z
- **Completed:** 2026-03-20T03:30:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Cal.com IIFE snippet injected lazily into document.head only on form submission success — zero Cal.com JS on initial page load
- Inline embed configured with `theme: 'dark'`, `brandColor: '#6366f1'`, and name/email prefill from form state
- Loading spinner with CSS animation gated on `prefers-reduced-motion: no-preference` and 5s/10s graceful fallback timeouts
- GTM events `cal_embed_shown` and `cal_booking_created` (via `bookingSuccessfulV2`) added for analytics tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Cal.com embed container CSS to contact.astro** - `cfa6de4` (feat)
2. **Task 2: Replace CTA link with Cal.com inline embed in contact-form.ts** - `b58549c` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/pages/contact.astro` - Added `:global(#cal-embed-container)` and `:global(#cal-embed-loading)` CSS with cal-spin keyframe animation, reduced-motion media queries, and 600px mobile min-height
- `src/scripts/contact-form.ts` - Added `Cal` Window type declaration, `injectCalEmbed()` function, replaced success panel CTA link with embed container div, added fallback timer

## Decisions Made

- Used `:global()` CSS wrappers in Astro scoped style block — `#cal-embed-container` and `#cal-embed-loading` are injected via JS `innerHTML` and don't receive Astro's scoped `data-astro-cid-*` attribute, so plain selectors wouldn't match them
- IIFE snippet inlined as `script.textContent` (not `src`) — the snippet itself is ~500 bytes inline; it then lazy-loads `embed.js` from Cal.com CDN only when called
- `window.Cal!` non-null assertion used since Cal is guaranteed to exist immediately after the IIFE snippet is injected synchronously

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan. Cal.com booking URL defaults to `synctexts/discovery`. The `PUBLIC_CAL_URL` env var is an optional override. Cal.com dashboard brand color setup (Pitfall 5 from RESEARCH.md) is a manual step outside this plan's scope.

## Next Phase Readiness

- Frontend Cal.com embed complete — visitors can book directly from the success panel
- Phase 09 Plan 03 (webhook endpoint) is the final plan: creates `POST /api/cal-webhook` to link bookings to DB lead records, adds `cal_booking_uid` and `cal_scheduled_at` columns to submissions table, requires `CAL_WEBHOOK_SECRET` env var

---
*Phase: 09-cal-com-scheduling*
*Completed: 2026-03-20*
