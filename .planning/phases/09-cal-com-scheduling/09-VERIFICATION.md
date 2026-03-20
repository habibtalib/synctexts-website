---
phase: 09-cal-com-scheduling
verified: 2026-03-20T12:00:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Submit the multi-step contact form and observe Cal.com embed in success panel"
    expected: "A Cal.com booking calendar renders inline with dark background and indigo (#6366f1) accent — no white/light theme"
    why_human: "Cannot programmatically verify that the Cal.com CDN responds, the iframe renders visually, or that the dark theme and brand color are correctly applied in the live embed"
  - test: "After embed loads, click an available time slot and inspect the booking form"
    expected: "Name and email fields in the Cal.com booking flow are prefilled with the values from the contact form submission"
    why_human: "Prefill is passed as config to Cal('inline', { config: { name, email } }) — actual injection into Cal.com's iframe UI requires a live browser test"
  - test: "Navigate away from /contact then navigate back and submit the form again"
    expected: "Form resets to Step 1 (fresh/empty), no JS console errors, Cal.com embed initializes cleanly on the second submission"
    why_human: "View Transitions + astro:page-load re-init and Cal.com double-inject guard behavior can only be confirmed in a running browser session"
  - test: "Complete an actual booking via the Cal.com embed"
    expected: "SQLite query shows the matching lead row has cal_booking_uid and cal_scheduled_at populated: sqlite3 data/submissions.db \"SELECT id, email, cal_booking_uid, cal_scheduled_at FROM submissions ORDER BY id DESC LIMIT 5;\""
    why_human: "Webhook execution requires a live Cal.com account, a configured webhook endpoint, and a real or test booking event — cannot simulate with static analysis"
---

# Phase 9: Cal.com Scheduling Verification Report

**Phase Goal:** Visitors can book a discovery call directly from the contact page, and bookings are linked to their lead record
**Verified:** 2026-03-20T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cal.com BOOKING_CREATED webhook updates the matching lead record with booking UID and scheduled time | VERIFIED | `src/pages/api/cal-webhook.ts` lines 69-72: `db.update(submissions).set({ calBookingUid: bookingUid, calScheduledAt: scheduledAt }).where(eq(submissions.id, existing.id)).run()` |
| 2 | Webhook rejects requests with invalid or missing HMAC-SHA256 signatures | VERIFIED | Lines 19-29: `createHmac('sha256', secret).update(rawBody).digest('hex')` + `timingSafeEqual` wrapped in try/catch returning 401 on mismatch or length error |
| 3 | Webhook matches booking to most recent lead by attendee email | VERIFIED | Lines 55-61: `.where(eq(submissions.email, attendeeEmail)).orderBy(desc(submissions.id)).limit(1).get()` |
| 4 | Database schema has cal_booking_uid and cal_scheduled_at columns on submissions table | VERIFIED | `src/db/schema.ts` lines 21-22: `calBookingUid: text('cal_booking_uid')` and `calScheduledAt: text('cal_scheduled_at')` |
| 5 | Cal.com inline booking widget renders inside the success panel after form submission | VERIFIED (code) | `src/scripts/contact-form.ts` lines 621-626: `#cal-embed-container` injected in success panel innerHTML, `injectCalEmbed()` called immediately after |
| 6 | Cal.com embed uses dark theme with indigo (#6366f1) brand color | VERIFIED (code) | Lines 58-65: `theme: 'dark'` in `Cal('inline')` config; `brandColor: '#6366f1'` in `Cal('ui')` styles |
| 7 | Cal.com embed prefills name and email from the just-submitted form data | VERIFIED (code) | Line 626: `injectCalEmbed(state.name.trim(), state.email.trim())` passed into `Cal('inline', { config: { name, email } })` at lines 55-60 |

**Score:** 7/7 truths verified (4 fully automated, 3 code-verified but require human browser confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema.ts` | calBookingUid and calScheduledAt columns | VERIFIED | Both nullable text columns present at lines 21-22 |
| `src/pages/api/cal-webhook.ts` | POST endpoint for Cal.com webhook | VERIFIED | Exports `POST: APIRoute`, `prerender = false`, full HMAC + DB logic (76 lines, substantive) |
| `drizzle/0001_wild_hex.sql` | Migration SQL for new columns | VERIFIED | Contains two `ALTER TABLE \`submissions\` ADD` statements with `--> statement-breakpoint` delimiter |
| `src/scripts/contact-form.ts` | injectCalEmbed function + Cal.com IIFE snippet | VERIFIED | `function injectCalEmbed(name, email)` at line 34, IIFE snippet with `app.cal.com/embed/embed.js` at line 42 |
| `src/pages/contact.astro` | CSS for #cal-embed-container and #cal-embed-loading | VERIFIED | `:global(#cal-embed-container)` at line 218, `min-height: 500px`, `#cal-embed-loading`, `cal-spin` keyframe, `prefers-reduced-motion` guard, `min-height: 600px` at 600px breakpoint |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/api/cal-webhook.ts` | `src/db/schema.ts` | `import { submissions } from '../../db/schema'` | WIRED | Line 4: `import { submissions } from '../../db/schema'`; used in `.from(submissions)`, `.where(eq(submissions.email, ...))`, `.set({ calBookingUid, calScheduledAt })` |
| `src/pages/api/cal-webhook.ts` | `node:crypto` | HMAC-SHA256 signature verification | WIRED | Line 2: `import { createHmac, timingSafeEqual } from 'node:crypto'`; both used at lines 20 and 23 |
| `src/scripts/contact-form.ts` | Cal.com CDN | IIFE snippet loading `https://app.cal.com/embed/embed.js` | WIRED | Line 42: URL present in IIFE snippet text content; script injected lazily on form success |
| `src/scripts/contact-form.ts` | `#cal-embed-container` | `Cal('inline', { elementOrSelector: '#cal-embed-container' })` | WIRED | Lines 52-53: `Cal!('inline', { elementOrSelector: '#cal-embed-container', ... })`; container created in success panel innerHTML at line 621 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CAL-01 | 09-02 | User can book a discovery call via an embedded Cal.com widget on the contact page | SATISFIED (needs human) | `injectCalEmbed()` called after form success; embed container in success panel innerHTML |
| CAL-02 | 09-02 | Cal.com embed uses dark theme matching the site's glassmorphism design | SATISFIED (needs human) | `theme: 'dark'` and `brandColor: '#6366f1'` passed to Cal.com API; visual confirmation requires browser |
| CAL-03 | 09-02 | Cal.com embed prefills name and email from the contact form submission | SATISFIED (needs human) | `config: { name, email }` passed with trimmed FormState values; prefill behavior requires browser to confirm |
| CAL-04 | 09-01 | Cal.com bookings are linked to lead records via webhook integration | SATISFIED (code) | Full webhook pipeline: HMAC verify → parse BOOKING_CREATED → email match → DB update. Requires live Cal.com test to confirm end-to-end |
| CAL-05 | 09-02 | Cal.com embed survives Astro View Transitions (re-initializes on page navigation) | SATISFIED (needs human) | Double-inject guard via `EMBED_SCRIPT_ID = 'cal-embed-script'`; `astro:page-load` event listener pattern at line 686; requires browser navigation test |

No orphaned requirements. All 5 CAL-0X IDs declared across plans match the REQUIREMENTS.md entries.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODOs, FIXMEs, placeholder returns, empty handlers, or stub implementations found in any phase 09 modified files.

### Human Verification Required

All automated code checks pass. The following items need live browser/environment testing:

#### 1. Cal.com Embed Visual Rendering (CAL-01 + CAL-02)

**Test:** Run `npm run dev`, navigate to http://localhost:4321/contact, complete the multi-step form (select a service, fill in Step 2 budget/timeline, fill Step 3 name/email/message, submit).

**Expected:** After "Message Sent!" appears, a Cal.com booking calendar renders inline below the checkmark — dark background, no white/light theme, indigo button accents consistent with the site design. A loading spinner appears briefly during load.

**Why human:** Cal.com CDN availability, iframe render, and visual theme correctness cannot be asserted statically.

#### 2. Name/Email Prefill in Booking Form (CAL-03)

**Test:** After the Cal.com embed loads (same session as above), click an available time slot.

**Expected:** The Cal.com booking details form shows the name and email you entered in the contact form, already filled in.

**Why human:** Prefill is passed as initial config to the Cal.com embed; whether Cal.com's UI actually populates the fields requires a live interaction.

#### 3. View Transitions Re-initialization (CAL-05)

**Test:** After seeing the success panel with Cal.com embed, navigate to another page using the site nav (e.g., "Home"), then navigate back to /contact. Submit the form a second time.

**Expected:** The form shows fresh Step 1 (not the success panel state), no JS console errors, and the Cal.com embed loads again on the second submission without errors.

**Why human:** View Transitions + `astro:page-load` re-init + the double-inject guard behavior (`document.getElementById('cal-embed-script')`) can only be validated in a running browser with actual navigation events.

#### 4. Webhook Lead Linking (CAL-04)

**Test:** Ensure `CAL_WEBHOOK_SECRET` is set in `.env` and the Cal.com webhook is configured in the Cal.com dashboard pointing to `https://<your-domain>/api/cal-webhook` for `BOOKING_CREATED` events. Complete an actual booking through the embed (or trigger a test event via Cal.com dashboard).

**Expected:** The matching lead row in SQLite shows `cal_booking_uid` and `cal_scheduled_at` populated:
```
sqlite3 data/submissions.db "SELECT id, email, cal_booking_uid, cal_scheduled_at FROM submissions ORDER BY id DESC LIMIT 5;"
```

**Why human:** Webhook execution requires a live Cal.com account, a configured webhook, and a real booking event. The endpoint code is correct but the full pipeline cannot be tested without the external service.

### Gaps Summary

No implementation gaps found. All code artifacts are substantive, fully wired, and implement the required logic. The 4 human verification items above are runtime/behavioral checks that cannot be automated — they are not code deficiencies.

Phase 9 goal is architecturally complete. Human sign-off on the 4 browser and webhook tests above is the only remaining step to fully confirm goal achievement.

---

_Verified: 2026-03-20T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
