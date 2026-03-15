# Phase 7: Extended API and HubSpot Integration - Research

**Researched:** 2026-03-15
**Domain:** HubSpot CRM API v3, Astro API routes, TypeScript async patterns
**Confidence:** HIGH (core API patterns verified against official docs; SDK vs fetch recommendation verified via bundlephobia)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- HubSpot auth: single env var `HUBSPOT_TOKEN` (private app access token); additional `HUBSPOT_PORTAL_ID` for contact links
- Graceful skip: if `HUBSPOT_TOKEN` is missing, sync is silently disabled — no errors, no warnings
- Upsert-by-email to prevent duplicate contacts (HS-02)
- Sync all lead data as HubSpot custom properties: lead_score, service_type, budget, timeline, source_page (URL), message
- Custom properties must be created manually in HubSpot portal
- Fire-and-forget Promise — call `syncToHubSpot()` without awaiting; runs in-process after response is sent
- Skip HubSpot sync for rate-limited submissions (same pattern as email skip)
- On successful sync: store `hubspot_id` and `hubspot_synced_at` in the submissions row
- On sync failure: `console.error` only — no separate error column or table
- Sync status badge based on `hubspot_id` column: NULL → "Not synced" (grey), set → "Synced" (green)
- Synced leads show "View in HubSpot" link: `https://app.hubspot.com/contacts/{HUBSPOT_PORTAL_ID}/contact/{hubspot_id}`
- "Sync to HubSpot" button only appears when `hubspot_id` is NULL (not yet synced)
- Button placement: header row next to "Mark as Read" button
- Inline AJAX feedback: loading state → success (becomes Synced badge) or error (brief error text)
- New API endpoint for manual sync (admin-authenticated)
- service_type, budget, timeline accepted optionally in contact.ts — NULL if missing, 0 scored
- Backwards compatible: current form continues working unchanged
- Validate service_type: `web_dev | devops | analytics`; budget: `under_5k | 5k_15k | 15k_50k | 50k_plus`; timeline: `asap | 1_3_months | 3_6_months | exploring`
- Reject invalid enum values with 400 error
- Validation added to existing `src/lib/validation.ts` (extend `validateContact()`)
- Success response unchanged: `{success: true, message: "..."}` — do not expose lead score
- Extract `checkBasicAuth` from `toggle-read.ts` into `src/lib/auth.ts`
- All admin API endpoints use the shared helper
- Admin page (`index.astro`) continues using inline auth check (Astro page, not API route)

### Claude's Discretion
- HubSpot client library choice (SDK vs fetch)
- HubSpot API error handling details and retry logic (if any)
- Exact sync function structure and module organization
- Auth helper file location and export pattern
- Badge CSS for HubSpot sync status (follows existing badge pattern)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HS-01 | System syncs new leads to HubSpot as contacts asynchronously after form submission | Fire-and-forget pattern documented; batch upsert endpoint verified |
| HS-02 | HubSpot sync uses upsert-by-email to prevent duplicate contacts | POST-then-PATCH email upsert pattern verified from official docs |
| HS-03 | System sends lead score, service type, budget, and source page as HubSpot custom properties | Custom property API endpoint and naming conventions researched |
| HS-04 | Admin can manually trigger HubSpot re-sync for individual leads from the dashboard | New API endpoint pattern identical to toggle-read; AJAX pattern established |
| HS-05 | HubSpot sync failures are logged and do not block form submission | try/catch fire-and-forget pattern mirrors existing email notification pattern |
| INFRA-03 | Shared auth helper used by all admin API endpoints | Extract `checkBasicAuth` from toggle-read.ts; PATCH endpoint covers all admin routes |
</phase_requirements>

---

## Summary

Phase 7 wires together four areas of work that are tightly sequenced but individually straightforward: (1) extend the contact.ts API to accept and validate new optional fields, compute lead scores via the ready-made `scoreLead()` function, and persist scores; (2) build a HubSpot sync module using direct `fetch` calls against the HubSpot v3 Contacts API; (3) expose a manual re-sync API endpoint for the admin dashboard; (4) refactor the auth helper into a shared utility.

The most important technical decision is the HubSpot upsert pattern. There is no true atomic single-contact upsert endpoint in HubSpot v3. The recommended pattern is: POST to create, catch a 409 Conflict response (contact already exists), then PATCH by email using `?idProperty=email`. The batch upsert endpoint (`/crm/v3/objects/contacts/batch/upsert`) is an alternative but introduces batching overhead for a single-contact use case and has reported edge-case bugs with the `email` idProperty in some community reports. The POST-then-PATCH pattern is the most reliable and widely used approach.

The HubSpot official SDK (`@hubspot/api-client`) weighs 20.8 MB — this is server-side only so bundle size is less critical, but for three API calls (POST create, PATCH update, nothing else) the SDK adds significant dependency weight and complexity. **Use native `fetch` with Bearer token auth**; the API surface needed is tiny and well-documented.

**Primary recommendation:** Use native `fetch` with a POST-then-PATCH email upsert pattern inside `src/lib/hubspot.ts`. Fire-and-forget with `try/catch`. No retry logic needed (v2 requirement CRM-01 is explicitly deferred).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` | Node 18+ built-in | HubSpot API calls | No dependency; HubSpot v3 API is REST/JSON; adequate for 2-3 call sequences |
| `drizzle-orm` | ^0.40.0 (already installed) | DB update after sync (write hubspot_id) | Already the ORM in use |
| `import.meta.env` | Astro built-in | Read `HUBSPOT_TOKEN`, `HUBSPOT_PORTAL_ID` | Astro's standard env access in server-side code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@hubspot/api-client` | 13.4.0 | Official HubSpot SDK | Skip — 20.8 MB for 3 API calls; native fetch is sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch | `@hubspot/api-client` SDK | SDK adds 20.8 MB dependency with built-in retry/rate-limiting; not worth it for 2 endpoints at agency lead volume |
| Native fetch | `@hubspot/api-client` SDK | SDK provides TypeScript types; manual types are trivial for this use case |

**Installation:**
No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
src/
├── lib/
│   ├── auth.ts          # NEW: extracted checkBasicAuth() shared helper
│   ├── hubspot.ts       # NEW: syncToHubSpot() function
│   ├── scoring.ts       # existing — no changes needed
│   ├── validation.ts    # extend validateContact() with enum field checks
│   └── email.ts         # existing — reference for fire-and-forget pattern
├── pages/
│   └── api/
│       ├── contact.ts   # extend: add fields, scoring, hubspot fire-and-forget
│       └── admin/
│           ├── toggle-read.ts    # update: replace inline checkBasicAuth with import
│           └── hubspot-sync.ts  # NEW: manual re-sync endpoint
```

### Pattern 1: Fire-and-Forget Async (matches existing email pattern)

**What:** Call async function without awaiting it. Wrap in try/catch to prevent unhandled rejections. Return response immediately after DB write.
**When to use:** Any side-effect that must not block the user response (email notification, HubSpot sync).

```typescript
// Source: existing pattern in src/pages/api/contact.ts
// After db.insert().run() and before return:
if (!rateLimited) {
  // Fire-and-forget — do NOT await
  syncToHubSpot({ id: insertedId, name, email, company, message, serviceType, budget, timeline, leadScore })
    .catch((err) => console.error('HubSpot sync failed:', err));
}

return new Response(
  JSON.stringify({ success: true, message: "Thank you! We'll get back to you soon." }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);
```

### Pattern 2: HubSpot Upsert-by-Email (POST then PATCH)

**What:** Attempt to create contact via POST. If 409 Conflict (contact already exists), fall back to PATCH using email as identifier.
**When to use:** Any CRM upsert where email is the dedup key.

```typescript
// Source: HubSpot official docs https://developers.hubspot.com/docs/api/crm/contacts
const BASE = 'https://api.hubapi.com';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// Step 1: Try to create
const createRes = await fetch(`${BASE}/crm/v3/objects/contacts`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    properties: {
      email,
      firstname: firstName,
      lastname: lastName,
      // ... custom properties
    },
  }),
});

if (createRes.status === 409) {
  // Contact already exists — update instead
  const patchRes = await fetch(
    `${BASE}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties: { /* same fields */ } }),
    }
  );
  const patchData = await patchRes.json();
  return patchData.id as string; // HubSpot contact record ID
}

const createData = await createRes.json();
return createData.id as string;
```

### Pattern 3: Shared Auth Helper

**What:** Extract `checkBasicAuth(request)` into `src/lib/auth.ts` and import in all admin API routes.
**When to use:** Every Astro API route under `src/pages/api/admin/`.

```typescript
// Source: src/pages/api/admin/toggle-read.ts (existing inline implementation)
// src/lib/auth.ts
export function checkBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  const decoded = atob(authHeader.slice(6));
  const [user, pass] = decoded.split(':');
  const expectedUser = import.meta.env.ADMIN_USER;
  const expectedPass = import.meta.env.ADMIN_PASS;
  if (!expectedUser || !expectedPass) return false;
  return user === expectedUser && pass === expectedPass;
}

// Usage in any admin route:
import { checkBasicAuth } from '../../../lib/auth';
// ...
if (!checkBasicAuth(request)) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}
```

### Pattern 4: Enum Validation Extension

**What:** Extend existing `validateContact()` to check optional enum fields against allowed value lists.
**When to use:** Any optional field with a fixed set of allowed values.

```typescript
// Source: extending src/lib/validation.ts
const ALLOWED_SERVICE_TYPES = ['web_dev', 'devops', 'analytics'] as const;
const ALLOWED_BUDGETS = ['under_5k', '5k_15k', '15k_50k', '50k_plus'] as const;
const ALLOWED_TIMELINES = ['asap', '1_3_months', '3_6_months', 'exploring'] as const;

// Inside validateContact():
if (data.service_type !== undefined && data.service_type !== null) {
  if (!ALLOWED_SERVICE_TYPES.includes(data.service_type as typeof ALLOWED_SERVICE_TYPES[number])) {
    errors.service_type = 'Invalid service_type value';
  }
}
// Same pattern for budget and timeline
```

### Pattern 5: AJAX Manual Sync Button (mirrors toggle-read)

**What:** Button in admin card header sends POST to `/api/admin/hubspot-sync` with submission ID. On success, replaces button with "Synced" badge and adds "View in HubSpot" link. On error, shows brief error text.
**When to use:** Admin dashboard per-card actions.

```javascript
// Source: existing toggle-read JS pattern in src/pages/admin/index.astro
btn.addEventListener('click', async () => {
  const id = Number(btn.getAttribute('data-id'));
  btn.disabled = true;
  btn.textContent = 'Syncing...';
  try {
    const res = await fetch('/api/admin/hubspot-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.status === 401) { window.location.reload(); return; }
    const data = await res.json();
    if (data.success) {
      // Replace button with Synced badge + View in HubSpot link
      btn.replaceWith(/* synced badge + link markup */);
    } else {
      btn.textContent = 'Sync failed';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = 'Sync failed';
    btn.disabled = false;
  }
});
```

### Anti-Patterns to Avoid

- **Awaiting HubSpot sync before returning response:** Blocks the user. HubSpot P99 latency can exceed 2 seconds. Always fire-and-forget.
- **Using `throw` inside the fire-and-forget callback without `.catch`:** Produces unhandled promise rejection. Always attach `.catch(console.error)` or wrap in try/catch.
- **Passing `undefined` as a HubSpot property value:** HubSpot API rejects requests with undefined property values. Only include properties that have actual values; build the properties object conditionally.
- **Storing `hubspot_id` as a number:** HubSpot record IDs are strings (e.g., `"33451"`), not integers. Store as `text` in SQLite (already correct in schema.ts).
- **Using the batch upsert endpoint for a single contact:** Batch endpoint has known community-reported issues with email as `idProperty`. POST-then-PATCH is more reliable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CRM contact deduplication | Custom email-match logic in SQLite | HubSpot upsert (POST-then-PATCH by email) | HubSpot is the source of truth for CRM dedup; SQLite stores `hubspot_id` as proof of sync |
| Auth token encoding/decoding | Custom base64 auth parser | Existing `checkBasicAuth` pattern (extract to shared helper) | Pattern already tested and working in toggle-read.ts |
| Lead scoring | Custom scoring in contact.ts | `scoreLead()` from `src/lib/scoring.ts` | Already implemented, pure function, returns `{score, tier}` |
| HubSpot API retries | Retry loop with backoff | None (deferred to v2 CRM-01) | Fire-and-forget with console.error is the agreed contract for v1.1 |

**Key insight:** The expensive work is already done. Phase 7 is primarily wiring: connect existing scoring, existing schema columns, existing fire-and-forget async pattern, and the HubSpot REST API.

---

## Common Pitfalls

### Pitfall 1: HubSpot token absent — sync throws instead of skips
**What goes wrong:** If `HUBSPOT_TOKEN` is not set, a fetch call will send `Authorization: Bearer undefined`, which returns a 401. This surfaces as an unexpected error rather than a graceful skip.
**Why it happens:** Developer forgets to check for token before attempting sync.
**How to avoid:** Guard at the top of `syncToHubSpot()`: `if (!import.meta.env.HUBSPOT_TOKEN) return;`
**Warning signs:** Console shows 401 errors from HubSpot in development environment without `.env` configured.

### Pitfall 2: Drizzle update after fire-and-forget fires before DB insert completes
**What goes wrong:** The fire-and-forget sync needs the submission's database `id` to write `hubspot_id` back. If the `id` isn't captured from the insert result before the callback fires, the update cannot target the correct row.
**Why it happens:** `db.insert().run()` with Drizzle/better-sqlite3 returns a `RunResult`; the `lastInsertRowid` is on that result object.
**How to avoid:** Capture the insert result: `const result = db.insert(submissions).values({...}).run(); const submissionId = Number(result.lastInsertRowid);` — then pass `submissionId` to the sync function.
**Warning signs:** HubSpot contacts created but `hubspot_id` never stored in SQLite.

### Pitfall 3: HubSpot custom properties not yet created in portal
**What goes wrong:** Sending `lead_score`, `service_type`, `budget`, `timeline`, `source_page`, `message` as HubSpot contact properties will silently fail or return errors if these properties don't exist in the HubSpot portal.
**Why it happens:** HubSpot custom properties must be manually created in the portal before they can be set via API.
**How to avoid:** Document required custom properties clearly in a code comment in `hubspot.ts` with internal property names and types. Internal names must be snake_case lowercase. Tester must create them before end-to-end testing.
**Warning signs:** HubSpot API returns 400 with message like "Property 'lead_score' does not exist".

### Pitfall 4: Response body not read on non-2xx HubSpot response
**What goes wrong:** `fetch` does not throw on non-2xx responses. Failure must be detected by checking `res.ok` or `res.status`. Without explicit checks, sync will appear to succeed.
**Why it happens:** `fetch` API design — rejects only on network errors, not HTTP errors.
**How to avoid:** After each `fetch` call, check `if (!res.ok)` and throw or log accordingly inside the try/catch.

### Pitfall 5: Contact name split — HubSpot expects firstname / lastname separately
**What goes wrong:** The submissions schema stores `name` as a single full-name string. HubSpot has separate `firstname` and `lastname` fields.
**Why it happens:** Mismatch between form data model and HubSpot contact model.
**How to avoid:** Split on first space: `const [firstname, ...rest] = name.split(' '); const lastname = rest.join(' ') || '';` — this is best-effort and acceptable for lead volume. Alternatively, send `name` as `firstname` only and leave `lastname` empty if no space found. Document this in `hubspot.ts`.

### Pitfall 6: hubspot-sync endpoint missing `prerender = false`
**What goes wrong:** Astro API routes must have `export const prerender = false` or the route will be statically generated and the POST handler will not work in SSR mode.
**Why it happens:** Forgetting to copy the boilerplate from other admin endpoints.
**How to avoid:** Copy the full export block from `toggle-read.ts` as the starting template.

---

## Code Examples

### hubspot.ts — complete syncToHubSpot function structure

```typescript
// src/lib/hubspot.ts
import { db } from '../db';
import { submissions } from '../db/schema';
import { eq } from 'drizzle-orm';

interface SyncPayload {
  submissionId: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  serviceType: string | null;
  budget: string | null;
  timeline: string | null;
  leadScore: number | null;
  sourcePage?: string;
}

export async function syncToHubSpot(payload: SyncPayload): Promise<void> {
  const token = import.meta.env.HUBSPOT_TOKEN;
  if (!token) return; // graceful skip — env var not configured

  const BASE = 'https://api.hubapi.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const [firstname, ...rest] = payload.name.split(' ');
  const lastname = rest.join(' ') || '';

  // Build properties object — only include defined values
  // Source: https://developers.hubspot.com/docs/api/crm/contacts
  // Custom properties must be pre-created in HubSpot portal:
  //   lead_score (number), synctexts_service_type (string), synctexts_budget (string),
  //   synctexts_timeline (string), synctexts_source_page (string), synctexts_message (string)
  const properties: Record<string, string> = {
    email: payload.email,
    firstname,
    lastname,
  };
  if (payload.company) properties.company = payload.company;
  if (payload.leadScore !== null) properties.lead_score = String(payload.leadScore);
  if (payload.serviceType) properties.synctexts_service_type = payload.serviceType;
  if (payload.budget) properties.synctexts_budget = payload.budget;
  if (payload.timeline) properties.synctexts_timeline = payload.timeline;
  if (payload.sourcePage) properties.synctexts_source_page = payload.sourcePage;
  properties.synctexts_message = payload.message.slice(0, 500); // HubSpot text limit

  // Attempt create; fall back to update if contact exists
  let hubspotId: string;
  const createRes = await fetch(`${BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (createRes.status === 409) {
    // Contact already exists — patch by email
    const patchRes = await fetch(
      `${BASE}/crm/v3/objects/contacts/${encodeURIComponent(payload.email)}?idProperty=email`,
      { method: 'PATCH', headers, body: JSON.stringify({ properties }) }
    );
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(`HubSpot PATCH failed: ${patchRes.status} ${JSON.stringify(err)}`);
    }
    const patchData = await patchRes.json();
    hubspotId = patchData.id;
  } else if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`HubSpot POST failed: ${createRes.status} ${JSON.stringify(err)}`);
  } else {
    const createData = await createRes.json();
    hubspotId = createData.id;
  }

  // Write hubspot_id back to SQLite
  db.update(submissions)
    .set({
      hubspotId,
      hubspotSyncedAt: new Date().toISOString(),
    })
    .where(eq(submissions.id, payload.submissionId))
    .run();
}
```

### contact.ts — integration points (delta from existing)

```typescript
// Source: extending src/pages/api/contact.ts
// After validation and before rate-limit check, extract new optional fields:
const serviceType = body.service_type ? (body.service_type as string) : null;
const budget = body.budget ? (body.budget as string) : null;
const timeline = body.timeline ? (body.timeline as string) : null;

// After existing fields, compute score:
import { scoreLead } from '../../lib/scoring';
const { score: leadScore } = scoreLead({ budget, timeline, company, message, serviceType });

// db.insert() — add new fields:
const result = db.insert(submissions).values({
  name, email, company, message, ip, rateLimited,
  serviceType, budget, timeline, leadScore,
}).run();
const submissionId = Number(result.lastInsertRowid);

// Fire-and-forget HubSpot sync (only if not rate-limited):
if (!rateLimited) {
  syncToHubSpot({ submissionId, name, email, company, message, serviceType, budget, timeline, leadScore })
    .catch((err) => console.error('HubSpot sync failed:', err));
}
```

### hubspot-sync.ts — manual re-sync admin endpoint

```typescript
// Source: mirrors src/pages/api/admin/toggle-read.ts structure
import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkBasicAuth } from '../../../lib/auth';
import { syncToHubSpot } from '../../../lib/hubspot';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!checkBasicAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const body = await request.json();
  if (!body.id || typeof body.id !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing or invalid id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const sub = db.select().from(submissions).where(eq(submissions.id, body.id)).get();
  if (!sub) {
    return new Response(JSON.stringify({ error: 'Submission not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await syncToHubSpot({
      submissionId: sub.id, name: sub.name, email: sub.email, company: sub.company,
      message: sub.message, serviceType: sub.serviceType, budget: sub.budget,
      timeline: sub.timeline, leadScore: sub.leadScore,
    });
    // Reload updated record to get hubspot_id for response
    const updated = db.select().from(submissions).where(eq(submissions.id, body.id)).get();
    return new Response(JSON.stringify({ success: true, hubspotId: updated?.hubspotId }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Manual HubSpot sync failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Sync failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

### HubSpot sync status badge CSS (matches existing badge pattern)

```css
/* Source: extends existing .badge-score pattern in src/pages/admin/index.astro */
.badge-hubspot-synced {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-hubspot-unsynced {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-dimmed);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HubSpot API keys | Private app access tokens (Bearer) | 2023 — API keys fully deprecated | `HUBSPOT_TOKEN` is a private app token; no API key support |
| `request` npm library | `node-fetch` / native `fetch` | Node 18+ native | Native `fetch` available in Node 18+; no polyfill needed |
| v1/v2 legacy contacts API | v3 CRM Contacts API | 2020 | Use `/crm/v3/objects/contacts` — v1/v2 return 410 |

**Deprecated/outdated:**
- HubSpot API keys: Fully deprecated. Private app access tokens are the only path.
- Legacy contacts API (`/contacts/v1`): Returns 410 Gone. Use `/crm/v3/objects/contacts`.
- `@hubspot/api-client` v12 and below: The `contactsApi.create()` method changed signatures across versions; avoid SDK entirely and use fetch for stability.

---

## Open Questions

1. **HubSpot custom property internal names**
   - What we know: Property names must be snake_case lowercase and pre-created in the HubSpot portal. Standard contact fields: `email`, `firstname`, `lastname`, `company`. Custom fields need unique internal names.
   - What's unclear: The exact internal names to use (e.g., `lead_score` vs `synctexts_lead_score`). HubSpot recommends prefixing custom properties with an app identifier to avoid conflicts.
   - Recommendation: Use `synctexts_` prefix for all custom properties: `synctexts_lead_score`, `synctexts_service_type`, `synctexts_budget`, `synctexts_timeline`, `synctexts_source_page`, `synctexts_message`. Document these in a comment block in `hubspot.ts`. This must be communicated to the portal admin before end-to-end testing.

2. **Astro `request.url` availability for source_page**
   - What we know: The `source_page` is the URL of the page where the form was submitted. CONTEXT.md lists it as a property to sync.
   - What's unclear: Whether `request.url` is available and populated in the Astro API route context, and whether it reflects the actual page URL or the API endpoint URL.
   - Recommendation: Use `request.headers.get('referer') || request.url` — the `Referer` header will reflect the page that submitted the form. Document in contact.ts.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md confirms "No test framework is configured") |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HS-01 | Async HubSpot sync triggered after form submit | manual-only | N/A | N/A |
| HS-02 | Upsert-by-email prevents duplicate contacts | manual-only | N/A | N/A |
| HS-03 | Custom properties sent with contact data | manual-only | N/A | N/A |
| HS-04 | Admin "Sync to HubSpot" button triggers re-sync | manual-only | N/A | N/A |
| HS-05 | HubSpot outage returns 200 to user, logs failure | manual-only | N/A | N/A |
| INFRA-03 | All admin endpoints return 401 for unauthenticated requests | manual-only | N/A | N/A |

**Manual verification procedure (replaces automated tests):**
1. Submit contact form — verify `lead_score`, `service_type`, `budget`, `timeline` persisted in SQLite
2. Check HubSpot portal — verify contact created with custom properties
3. Submit again with same email — verify HubSpot contact updated (not duplicated)
4. Kill `HUBSPOT_TOKEN` env var — verify form submission still returns 200
5. Use admin dashboard — verify "Sync to HubSpot" button appears for NULL `hubspot_id`
6. Click "Sync to HubSpot" — verify button becomes Synced badge with View in HubSpot link
7. Access `/api/admin/toggle-read` without auth — verify 401 response
8. Access `/api/admin/hubspot-sync` without auth — verify 401 response

### Sampling Rate
- Per task commit: Manual smoke test (form submit, check SQLite)
- Per wave merge: Full manual verification procedure above
- Phase gate: All 8 manual verification steps green before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework to configure. Manual verification procedure covers all requirements.

---

## Sources

### Primary (HIGH confidence)
- HubSpot official docs: https://developers.hubspot.com/docs/api/crm/contacts — create, update, upsert endpoints
- HubSpot API reference: https://developers.hubspot.com/docs/api-reference/crm-contacts-v3/guide — batch upsert documentation
- Existing codebase: `src/pages/api/contact.ts`, `src/pages/api/admin/toggle-read.ts`, `src/lib/scoring.ts`, `src/db/schema.ts` — implementation patterns verified by reading

### Secondary (MEDIUM confidence)
- bundlephobia: https://bundlephobia.com/package/@hubspot/api-client — 20.8 MB package size confirmed
- HubSpot Community: PATCH by email pattern `?idProperty=email` — confirmed by multiple community threads and official docs excerpt
- npmjs: https://www.npmjs.com/package/@hubspot/api-client — version 13.4.0 confirmed

### Tertiary (LOW confidence)
- Community reports of batch upsert edge-case bugs with `email` as `idProperty` — not officially documented; led to recommendation to use POST-then-PATCH instead

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — native fetch is verified, no new dependencies needed
- Architecture: HIGH — all patterns mirror existing codebase code verified by reading
- HubSpot API endpoints: HIGH — verified against official docs
- HubSpot upsert strategy: MEDIUM — POST-then-PATCH is community-verified; batch endpoint has reports of edge cases
- Custom property names: LOW — naming convention recommended based on HubSpot docs guidance; actual names must be confirmed when creating in portal

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (HubSpot v3 API is stable; private app auth has been standard since 2023)
