# Phase 9: Cal.com Scheduling - Research

**Researched:** 2026-03-20
**Domain:** Cal.com JavaScript Embed API, Webhook Security, Drizzle DB Migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Embed Placement & Trigger**
- Cal.com inline embed replaces the current "Book a Discovery Call" link button in the success panel
- Embed appears ONLY after form submission — no standalone booking entry point
- Visitor books without leaving the page (embedded, not external link)
- Cal.com event type slug: `synctexts/discovery` (hardcoded, not env var)
- Keep `PUBLIC_CAL_URL` env var as fallback in contact-form.ts but default to `synctexts/discovery`

**Prefill & Data Handoff**
- Use Cal.com's JavaScript embed API for prefilling: `Cal('ui', {prefill: {name, email}})`
- Pass only name and email from the just-submitted form data (still in memory from submission)
- Match bookings to leads by email address — no lead_id passed via notes field
- Email is the dedup key (consistent with HubSpot upsert-by-email pattern from Phase 7)

**Webhook & Lead Linking**
- New API endpoint: `POST /api/cal-webhook` receives Cal.com `BOOKING_CREATED` events
- Secured via shared secret in webhook header — env var: `CAL_WEBHOOK_SECRET`
- Match booking to lead by email address lookup in submissions table
- If no matching lead found: log warning and skip (booking still exists in Cal.com)
- On match: update lead record with `cal_booking_uid` and `cal_scheduled_at`
- New nullable DB columns: `cal_booking_uid` (text) and `cal_scheduled_at` (text) on submissions table
- DB migration via `drizzle-kit generate` + `drizzle-kit migrate` (established Phase 5 workflow)

**Embed Loading & Performance**
- Cal.com embed script loaded dynamically ONLY when success panel renders (after form submission)
- No Cal.com JS on initial page load — keeps the contact form fast
- Script injected via DOM manipulation in contact-form.ts after successful submission

**View Transitions & Lifecycle**
- Navigating away and back to contact shows a fresh empty form (sessionStorage already cleared on submission)
- No Cal.com embed visible on return since it only exists in the success panel DOM
- Cal.com embed re-init handled by `astro:page-load` event listener pattern (same as form initialization)
- If embed script was already loaded globally, re-use it; otherwise inject fresh

### Claude's Discretion
- Cal.com embed container sizing and responsive behavior within success panel
- Exact Cal.com theme configuration parameters (dark theme, indigo accent)
- Webhook payload parsing and field extraction
- Error handling for Cal.com embed load failures
- Whether to show a loading spinner while Cal.com embed initializes

### Deferred Ideas (OUT OF SCOPE)
- Cal.com round-robin routing for multiple sales team members — listed as CRM-02 in v2 requirements
- Booking confirmation email from the website (Cal.com handles its own confirmations)
- Booking status display in admin dashboard — could be added in Phase 10
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAL-01 | User can book a discovery call via an embedded Cal.com widget on the contact page | Cal("inline") API with elementOrSelector, calLink: "synctexts/discovery" |
| CAL-02 | Cal.com embed uses dark theme matching the site's glassmorphism design | config.theme: "dark" + Cal("ui") branding with brandColor |
| CAL-03 | Cal.com embed prefills name and email from the contact form submission | config.name and config.email in the Cal("inline") config object |
| CAL-04 | Cal.com bookings are linked to lead records via webhook integration | BOOKING_CREATED event, X-Cal-Signature-256 header, payload.uid and payload.attendees[0].email |
| CAL-05 | Cal.com embed survives Astro View Transitions (re-initializes on page navigation) | astro:page-load + Cal.loaded guard pattern; embed only rendered in success panel DOM |
</phase_requirements>

---

## Summary

Phase 9 adds two integration surfaces: a Cal.com inline booking embed in the contact form success panel, and a webhook endpoint that links completed bookings back to lead records in SQLite.

The Cal.com embed uses a vanilla JS snippet that creates a queued API (`Cal()`) and lazily loads `embed.js` from cal.com CDN. Because the embed appears only after form submission, the script is injected dynamically at that moment — keeping it off the critical render path. The existing `CAL_URL` constant and success panel HTML in `contact-form.ts` are the integration points. The main authoring task is replacing the `<a>` CTA with an inline embed container and calling `Cal("inline", { ..., config: { name, email, theme: "dark" } })` after script load.

The webhook endpoint follows the same Astro API route pattern established in Phases 5-7. Cal.com signs webhook payloads with HMAC-SHA256 using the `X-Cal-Signature-256` header. The endpoint must verify this signature before trusting the payload, then use `payload.attendees[0].email` to match the lead and update `cal_booking_uid` + `cal_scheduled_at` columns. The DB migration adds two nullable text columns to the submissions table and follows the established `drizzle-kit generate` + `drizzle-kit migrate` workflow.

**Primary recommendation:** Use `Cal("inline")` with config-level prefill (name, email, theme: "dark"). For the indigo accent, set `brandColor: "#6366f1"` via `Cal("ui", { styles: { branding: { brandColor: "#6366f1" } } })` after inline init. Verify webhook signatures with Node.js built-in `crypto.createHmac("sha256", secret).update(rawBody).digest("hex")`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Cal.com embed CDN | N/A (CDN-hosted) | Inline scheduling widget | Official Cal.com distribution; no npm install needed |
| drizzle-orm | Already installed | DB schema + migration | Established pattern from Phase 5 |
| drizzle-kit | Already installed | Migration generation | Established pattern from Phase 5 |
| Node.js `crypto` | Built-in | HMAC-SHA256 webhook sig verification | No extra dependency; crypto is available in Astro SSR |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro:page-load` event | Astro built-in | Re-init embed after View Transitions | Used for all form lifecycle hooks in this project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CDN embed snippet | `@calcom/embed-core` npm package | npm package is 220KB+; CDN snippet is ~2KB inline + lazy-loads embed.js only when needed |
| HMAC verify | Simple string comparison | String comparison is not timing-safe; use `crypto.timingSafeEqual` |

**Installation:**
No new npm packages required. The Cal.com embed is loaded via CDN snippet at runtime.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scripts/
│   └── contact-form.ts       # Add: injectCalEmbed(), Cal init after success
├── pages/api/
│   └── cal-webhook.ts        # New: POST endpoint for Cal.com BOOKING_CREATED
├── db/
│   └── schema.ts             # Add: calBookingUid, calScheduledAt columns
└── ...
drizzle/
└── 0001_cal_booking.sql      # New: generated migration file
```

### Pattern 1: Cal.com Embed Script Injection (Lazy Load)

**What:** The standard Cal.com IIFE snippet creates a queued `Cal()` global and injects `embed.js` from CDN on first call. Because it must fire only after form submission, it is injected programmatically rather than in HTML head.

**When to use:** When the embed must not load on page entry — only render after a user action.

**Example:**
```typescript
// Source: https://github.com/calcom/cal.com/blob/main/packages/embeds/embed-core/index.html
// and https://calcom.gitbook.io/docs/core-features/embed/set-up-your-embed

function injectCalEmbed(name: string, email: string): void {
  const EMBED_SCRIPT_ID = 'cal-embed-script';
  const CAL_LINK = 'synctexts/discovery';

  // Inject snippet only once — guard against double-injection after View Transitions
  if (!document.getElementById(EMBED_SCRIPT_ID)) {
    const snippet = `
      (function(C,A,L){
        var p=function(a,ar){a.q.push(ar)};
        var d=C.document;
        C.Cal=C.Cal||function(){
          var cal=C.Cal;var ar=arguments;
          if(!cal.loaded){
            cal.ns={};cal.q=cal.q||[];
            d.head.appendChild(d.createElement("script")).src=A;
            cal.loaded=true;
          }
          if(ar[0]===L){
            var api=function(){p(api,arguments)};
            var namespace=ar[1];
            api.q=api.q||[];
            if(typeof namespace==="string"){
              cal.ns[namespace]=cal.ns[namespace]||api;
              p(cal.ns[namespace],ar);p(cal,["initNamespace",namespace]);
            } else p(cal,ar);return;
          }
          p(cal,ar);
        };
      })(window,"https://app.cal.com/embed/embed.js","init");
    `;
    const script = document.createElement('script');
    script.id = EMBED_SCRIPT_ID;
    script.textContent = snippet;
    document.head.appendChild(script);
  }

  // Always re-init inline embed — Cal() is idempotent when element already exists
  // because the embed container is recreated in success panel innerHTML
  Cal('init', { origin: 'https://cal.com' });
  Cal('inline', {
    elementOrSelector: '#cal-embed-container',
    calLink: CAL_LINK,
    config: {
      name,
      email,
      theme: 'dark',
    },
  });

  // Apply brand accent to match site's indigo (#6366f1)
  Cal('ui', {
    styles: {
      branding: { brandColor: '#6366f1' },
    },
    hideEventTypeDetails: false,
  });
}
```

### Pattern 2: Webhook Verification + Lead Update

**What:** Astro SSR API route that receives Cal.com BOOKING_CREATED webhooks, verifies the HMAC-SHA256 signature, and updates the matching lead record.

**When to use:** Whenever a server-side endpoint must securely receive external webhook payloads.

**Example:**
```typescript
// Source: https://cal.com/docs/developing/guides/automation/webhooks
// Signature header: X-Cal-Signature-256
// Algorithm: HMAC-SHA256(secret, rawBody) — compare with timing-safe equal

import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();

  // 1. Verify signature
  const secret = import.meta.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CAL_WEBHOOK_SECRET not configured');
    return new Response(null, { status: 500 });
  }

  const sigHeader = request.headers.get('x-cal-signature-256') ?? '';
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    if (!timingSafeEqual(Buffer.from(sigHeader), Buffer.from(computed))) {
      return new Response(null, { status: 401 });
    }
  } catch {
    // Buffer lengths differ → mismatch
    return new Response(null, { status: 401 });
  }

  // 2. Parse payload
  const event = JSON.parse(rawBody) as {
    triggerEvent: string;
    payload: {
      uid: string;
      startTime: string;
      attendees: Array<{ email: string; name: string }>;
    };
  };

  if (event.triggerEvent !== 'BOOKING_CREATED') {
    return new Response(null, { status: 200 }); // Acknowledge other events silently
  }

  const bookingUid = event.payload.uid;
  const scheduledAt = event.payload.startTime;
  const attendeeEmail = event.payload.attendees?.[0]?.email;

  if (!attendeeEmail) {
    console.warn('Cal.com webhook: no attendee email in payload');
    return new Response(null, { status: 200 });
  }

  // 3. Find lead by email and update
  const existing = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.email, attendeeEmail))
    .get();

  if (!existing) {
    console.warn(`Cal.com webhook: no lead found for email ${attendeeEmail}`);
    return new Response(null, { status: 200 });
  }

  db.update(submissions)
    .set({ calBookingUid: bookingUid, calScheduledAt: scheduledAt })
    .where(eq(submissions.id, existing.id))
    .run();

  return new Response(null, { status: 200 });
};
```

### Pattern 3: Drizzle Schema Addition + Migration

**What:** Add nullable text columns to the existing submissions table, generate migration, apply.

**Example:**
```typescript
// src/db/schema.ts — add two nullable columns at the end of the submissions table
calBookingUid: text('cal_booking_uid'),
calScheduledAt: text('cal_scheduled_at'),
```

```sql
-- drizzle/0001_cal_booking.sql (generated, then edited if needed)
ALTER TABLE `submissions` ADD `cal_booking_uid` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `cal_scheduled_at` text;
```

Migration commands:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Pattern 4: Success Panel HTML with Embed Container

**What:** Replace the `<a href="${CAL_URL}">Book a Discovery Call</a>` in the success panel with an embed container div, then call `injectCalEmbed()` after the innerHTML is set.

**Example:**
```typescript
// In contact-form.ts, after wrapper.innerHTML = `...`
// Replace the <a> with:
`<div id="cal-embed-container" style="width:100%;min-height:500px;"></div>`

// Then immediately after:
injectCalEmbed(name, email);
```

### Anti-Patterns to Avoid

- **Injecting the Cal.com snippet in `<head>` via Astro layout:** Loads Cal.com on every page, not just when the success panel is shown. Defeats the lazy-load strategy.
- **Using `Cal.ns['namespace']` without `Cal('init', 'namespace')` first:** Results in undefined namespace errors; always call `init` before `inline`.
- **Using string equality for signature comparison:** Vulnerable to timing attacks; use `crypto.timingSafeEqual`.
- **Calling `drizzle-kit push` on production:** NEVER use push; always generate + migrate.
- **Parsing rawBody from `request.json()` before signature check:** Signature must be verified against the raw string body before parsing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scheduling widget UI | Custom calendar/time-slot picker | Cal.com embed | Cal.com handles timezone, availability, confirmation emails, reminders |
| HMAC verification | Custom hash comparison | `node:crypto` `createHmac` + `timingSafeEqual` | Timing-safe comparison is non-trivial to implement correctly |
| Booking state persistence | Custom DB table for bookings | Two columns on submissions table | All booking data lives in Cal.com; we only need the UID and time |

**Key insight:** Cal.com's embed handles the entire booking UX — availability, slot selection, form, confirmation. The website only needs to (a) show the embed with prefill and (b) receive a single webhook to link the booking UID to a lead.

---

## Common Pitfalls

### Pitfall 1: Cal.com Embed Script Re-injection on View Transitions

**What goes wrong:** Navigating back to the contact page triggers `astro:page-load`, which reinitializes the form. If the success panel is not shown (fresh form state), there is no `#cal-embed-container` in the DOM — `Cal("inline", { elementOrSelector: "#cal-embed-container" })` silently fails or errors.

**Why it happens:** The embed container only exists in the success panel DOM, which is only rendered after submission.

**How to avoid:** Only call `injectCalEmbed()` when rendering the success panel. Guard the call: `const container = document.getElementById('cal-embed-container'); if (!container) return;`

**Warning signs:** Console errors like "element not found" or Cal embed appearing on the wrong part of the page.

### Pitfall 2: Double Script Injection

**What goes wrong:** If `astro:page-load` fires multiple times (e.g., user navigates away and back while still on success panel — unlikely but possible), the snippet is injected twice, causing `Cal` to be redefined.

**Why it happens:** The `Cal.loaded` guard inside the snippet prevents double-loading of `embed.js`, but the snippet itself being appended again reassigns `window.Cal`.

**How to avoid:** Check for a sentinel element ID before injecting the snippet:
```typescript
if (!document.getElementById('cal-embed-script')) {
  // inject snippet
}
```

### Pitfall 3: Signature Verification Buffer Length Mismatch

**What goes wrong:** `timingSafeEqual` throws if the two buffers have different byte lengths. An attacker can trigger a 500 by sending a malformed signature.

**Why it happens:** `timingSafeEqual` is strict about length equality.

**How to avoid:** Wrap the comparison in try/catch and return 401 on any error:
```typescript
try {
  if (!timingSafeEqual(Buffer.from(sigHeader), Buffer.from(computed))) {
    return new Response(null, { status: 401 });
  }
} catch {
  return new Response(null, { status: 401 });
}
```

### Pitfall 4: Reading Request Body Twice

**What goes wrong:** Calling `request.text()` for signature verification and then `JSON.parse(rawBody)` is the correct order. If `request.json()` is called first, the stream is consumed and `request.text()` throws.

**How to avoid:** Always call `request.text()` first, store in `rawBody`, verify signature, then `JSON.parse(rawBody)`.

### Pitfall 5: Cal.com `brandColor` Is a Cal.com Account Setting, Not Just Embed Config

**What goes wrong:** The `styles.branding.brandColor` in `Cal("ui")` works in the embed but may be overridden by the Cal.com account-level brand color setting.

**Why it happens:** Cal.com has two layers: account-level brand color (set in Cal.com dashboard under Appearance) and embed-level override. The embed config takes precedence for the embed iframe, but only in paid plans for full white-labeling.

**How to avoid:** Set the indigo `#6366f1` in both the Cal.com account Appearance settings (free tier supports brand color) AND in the embed config. This provides redundancy.

**Warning signs:** Embed shows Cal.com's default blue instead of indigo.

### Pitfall 6: Matching on Most-Recent Lead vs. Most-Relevant Lead

**What goes wrong:** If a visitor submits the form multiple times with the same email, there are multiple lead records. The email-based lookup will return the first or last depending on query order.

**Why it happens:** Email is not a unique key in the submissions table.

**How to avoid:** Order the lookup by `createdAt DESC` and take the most recent match — this is the booking they just made after submitting the form.

---

## Code Examples

Verified patterns from official sources:

### Cal.com Inline Embed Full Init (Verified)
```javascript
// Source: https://calcom.gitbook.io/docs/core-features/embed/set-up-your-embed
Cal("init", { origin: "https://cal.com" });
Cal("inline", {
  elementOrSelector: "#cal-embed-container",
  calLink: "synctexts/discovery",
  config: {
    name: "John Doe",
    email: "john@example.com",
    theme: "dark",
  },
});
Cal("ui", {
  styles: {
    branding: { brandColor: "#6366f1" },
  },
});
```

### Cal.com Event Listener for Booking Confirmation (Verified)
```javascript
// Source: https://cal.com/help/embedding/embed-events
// bookingSuccessful is DEPRECATED — use bookingSuccessfulV2
Cal("on", {
  action: "bookingSuccessfulV2",
  callback: (e) => {
    const { uid, title, startTime } = e.detail.data;
    // Optional: GTM push
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cal_booking_created', booking_uid: uid });
  },
});
```

### Webhook Payload Structure (Verified)
```json
// Source: https://cal.com/docs/developing/guides/automation/webhooks
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "payload": {
    "uid": "abc123xyz",
    "title": "Discovery Call",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z",
    "attendees": [
      {
        "email": "visitor@example.com",
        "name": "John Doe",
        "timeZone": "America/New_York"
      }
    ],
    "organizer": { "email": "team@synctexts.com" }
  }
}
```

### Drizzle Update by Email (Pattern from Phase 7)
```typescript
// Consistent with established db.update() pattern
db.update(submissions)
  .set({
    calBookingUid: bookingUid,
    calScheduledAt: scheduledAt,
  })
  .where(eq(submissions.email, attendeeEmail))
  .run();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bookingSuccessful` event | `bookingSuccessfulV2` | ~2023 | Old event deprecated; V2 provides uid, title, startTime |
| `brandColor` in Cal() snippet | `styles.branding.brandColor` in Cal("ui") | ~2022 | The nested styles object is current API |
| Cal.com Atoms (React) | Standard JS embed | Still current | Atoms require React islands; out of scope per REQUIREMENTS.md |

**Deprecated/outdated:**
- `bookingSuccessful`: Deprecated in favor of `bookingSuccessfulV2`. Do not use.
- `rescheduleBookingSuccessful`: Same deprecation. Use `rescheduleBookingSuccessfulV2`.

---

## Open Questions

1. **Cal.com Account Brand Color vs. Embed brandColor**
   - What we know: The embed `styles.branding.brandColor` config overrides within the embed iframe.
   - What's unclear: Whether Cal.com free tier fully respects the embed-level brandColor or requires a paid plan for full white-labeling of accent colors.
   - Recommendation: Set `#6366f1` in both the Cal.com dashboard (Appearance > Brand Color) AND in the embed config. Test visually in dev. If free tier doesn't support full accent override, the dark theme is the more important requirement (CAL-02 can partially succeed).

2. **Most-Recent Lead Matching When Multiple Submissions Exist**
   - What we know: Email is not unique; a visitor can submit the form multiple times.
   - What's unclear: Whether `db.select().where(eq(email)).get()` returns first or last inserted row (SQLite returns first by rowid).
   - Recommendation: Use `.orderBy(desc(submissions.id)).limit(1)` to get the most recent submission when matching by email.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is configured") |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAL-01 | Inline embed renders in success panel | manual-only | N/A — no test framework | N/A |
| CAL-02 | Dark theme with indigo accent applied | manual-only | N/A — visual verification | N/A |
| CAL-03 | Name and email prefilled in embed | manual-only | N/A — browser test | N/A |
| CAL-04 | Webhook links booking to lead record | manual-only | N/A — requires live Cal.com webhook | N/A |
| CAL-05 | Embed survives View Transitions | manual-only | N/A — requires browser navigation | N/A |

### Sampling Rate
- **Per task commit:** Manual smoke test: submit form, verify embed renders with dark theme and correct prefill
- **Per wave merge:** Full manual walkthrough: submit form → book call → verify DB record updated with `cal_booking_uid`
- **Phase gate:** All 5 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework exists and none is required by CLAUDE.md.

---

## Sources

### Primary (HIGH confidence)
- https://calcom.gitbook.io/docs/core-features/embed/set-up-your-embed — Cal("inline") API, config options, theme, prefill
- https://cal.com/help/embedding/embed-events — All events including bookingSuccessfulV2, deprecation notices
- https://cal.com/docs/developing/guides/automation/webhooks — Webhook payload structure, X-Cal-Signature-256 header, HMAC-SHA256 verification
- https://cal.com/help/embedding/prefill-booking-form-embed — Prefill config object structure for vanilla JS
- https://github.com/calcom/cal.com/blob/main/packages/embeds/embed-core/index.html — Canonical embed IIFE snippet

### Secondary (MEDIUM confidence)
- https://cal.com/blog/enhance-your-brand-with-custom-theme-colors-on-cal-com — brandColor configuration in embed styles object
- WebSearch: Cal.com embed namespace pattern, Cal.ns usage, dynamic injection pattern — corroborated by embed-core source

### Tertiary (LOW confidence)
- Cal.com free-tier brandColor override scope in embed — not explicitly documented for free vs. paid; requires empirical testing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Cal.com embed API verified via official gitbook docs and embed-core source
- Architecture: HIGH — Webhook payload structure and signature algorithm verified via official docs
- Pitfalls: HIGH (injection/double-inject/timing-safe) / MEDIUM (brandColor free-tier scope)

**Research date:** 2026-03-20
**Valid until:** 2026-09-20 (Cal.com embed API is stable; check for breaking changes after major Cal.com releases)
