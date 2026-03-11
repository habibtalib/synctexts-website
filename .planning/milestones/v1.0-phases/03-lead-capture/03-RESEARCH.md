# Phase 3: Lead Capture - Research

**Researched:** 2026-03-10
**Domain:** Astro server endpoints, email delivery, SQLite persistence, form handling
**Confidence:** HIGH

## Summary

Phase 3 converts the existing static contact form into a fully functional lead capture system with server-side processing, email notifications, and database persistence. The core technical challenge is switching the Astro project from fully static to hybrid rendering (static pages + server endpoints) using the `@astrojs/node` adapter, then building a POST API endpoint, Drizzle ORM + SQLite persistence layer, and Resend email integration.

The existing contact page (`src/pages/contact.astro`) already has the form structure with name, email, and message fields using established `glass-input` CSS classes. This phase adds a company field, honeypot, client-side validation JS, a server API endpoint, database layer, email sending, rate limiting, and an admin page.

**Primary recommendation:** Use Astro 5's per-page `export const prerender = false` approach (no `output: 'hybrid'` config needed in Astro 5 -- just add the adapter and opt pages/endpoints out of prerendering individually). Use `@astrojs/node` in standalone mode, Drizzle ORM with `better-sqlite3` for persistence, and Resend SDK for email delivery.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Field order: Name -> Company (optional) -> Email -> Message
- Validation: inline per-field errors on blur + error summary at top on submit attempt
- Submit button shows spinner and "Sending..." text, disabled until response
- Use Resend SDK (not Nodemailer/SMTP) for transactional email delivery
- Single recipient email address configured via env var (e.g., CONTACT_EMAIL)
- Reply-to set to the submitter's email so agency can reply directly from inbox
- Email body includes all form fields (name, company, email, message)
- 5 submissions per IP per hour rate limit
- Rate-limited submissions are still saved to SQLite (marked as rate-limited) but do not trigger email notification
- Hidden honeypot field -- submissions with it filled are silently rejected (no error shown to user)
- SQLite database via Drizzle ORM for all submissions
- Submissions table includes: name, email, company, message, IP, timestamp, read/unread status, rate-limited flag
- Admin page at /admin protected by HTTP Basic Auth (username + password from env vars)
- Admin list shows full details: date, name, email, company, full message, IP, read/unread, rate-limited flag

### Claude's Discretion
- Success/error feedback style after form submission (inline banner vs replace form)
- Rate limit message wording
- Admin submission detail view approach (expand inline vs separate page)
- Loading skeleton / empty state design for admin page
- Email notification HTML template design

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEAD-01 | Contact form with 3-4 fields (name, email, message, optional company) | Existing contact.astro has 3 fields; add company field + honeypot. glass-input CSS ready. |
| LEAD-02 | Form submissions send email notification via Resend | Resend SDK v6.9.x; simple `resend.emails.send()` API with reply-to support |
| LEAD-03 | Form submissions persisted to SQLite database via Drizzle ORM | Drizzle ORM + better-sqlite3 driver; schema + migrations documented below |
| LEAD-04 | Honeypot field for spam prevention | Hidden field technique -- CSS `display:none` or `position:absolute;left:-9999px` |
| LEAD-05 | Server-side rate limiting on form endpoint | In-memory Map keyed by IP with hourly window; `clientAddress` available in Astro API routes |
| LEAD-06 | Client-side and server-side form validation | Client: JS blur handlers + submit validation. Server: validate all fields in API endpoint |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/node` | ^9.5.4 | Node.js adapter for server endpoints | Official Astro adapter for Node.js SSR/hybrid |
| `resend` | ^6.9.3 | Transactional email delivery | User decision; simple SDK, generous free tier (100 emails/day) |
| `drizzle-orm` | latest | Type-safe ORM for SQLite | User decision; lightweight, TypeScript-first, no runtime overhead |
| `better-sqlite3` | latest | SQLite driver for Node.js | Standard synchronous SQLite driver; Drizzle's recommended SQLite driver |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-kit` | latest (dev) | Schema migrations CLI | Generate and run SQL migrations from schema changes |
| `@types/better-sqlite3` | latest (dev) | TypeScript types | Type safety for better-sqlite3 driver |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Nodemailer + SMTP | User locked Resend; Nodemailer needs SMTP server config |
| better-sqlite3 | libsql | libsql supports remote DBs but adds complexity for local-only use |
| In-memory rate limiter | Redis-backed | Overkill for single-instance Node server; resets on restart is acceptable |

**Installation:**
```bash
npx astro add node
npm install resend drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  db/
    schema.ts          # Drizzle table definitions
    index.ts           # DB connection singleton
  lib/
    email.ts           # Resend email helper
    rate-limiter.ts    # In-memory rate limiting
    validation.ts      # Shared validation logic
  pages/
    api/
      contact.ts       # POST endpoint (prerender = false)
    admin/
      index.astro      # Admin submissions list (prerender = false)
    contact.astro       # Enhanced contact form (stays prerendered)
  scripts/
    contact-form.ts    # Client-side form JS (validation + fetch submit)
drizzle/               # Generated migration SQL files
drizzle.config.ts      # Drizzle Kit configuration
data/
  submissions.db       # SQLite database file (gitignored)
```

### Pattern 1: Astro 5 Hybrid Rendering (Per-Page Opt-Out)
**What:** In Astro 5.x, the default is static prerendering. You do NOT need `output: 'hybrid'` in config. Simply add the adapter and mark individual pages/endpoints with `export const prerender = false`.
**When to use:** When most pages are static but a few need server-side processing.
**Example:**
```typescript
// src/pages/api/contact.ts
// Source: https://docs.astro.build/en/guides/on-demand-rendering/
export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json();
  // ... handle submission
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Config change needed in astro.config.mjs:**
```typescript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://synctexts.com',
  adapter: node({ mode: 'standalone' }),
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
```

### Pattern 2: Drizzle Schema + Singleton Connection
**What:** Define schema in a dedicated file, export a singleton DB instance.
**Example:**
```typescript
// src/db/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  message: text('message').notNull(),
  ip: text('ip'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  rateLimited: integer('rate_limited', { mode: 'boolean' }).notNull().default(false),
});

// src/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('data/submissions.db');
export const db = drizzle({ client: sqlite, schema });
```

### Pattern 3: In-Memory Rate Limiter
**What:** Simple Map-based rate limiter with hourly window and automatic cleanup.
**Example:**
```typescript
// src/lib/rate-limiter.ts
const submissions = new Map<string, number[]>();

export function isRateLimited(ip: string, maxPerHour = 5): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  const timestamps = (submissions.get(ip) || []).filter(t => t > hourAgo);
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > maxPerHour;
}
```

### Pattern 4: HTTP Basic Auth for Admin
**What:** Middleware or inline check using Authorization header with Base64 credentials.
**Example:**
```typescript
// In admin page frontmatter
export const prerender = false;

const auth = Astro.request.headers.get('Authorization');
if (!auth || !isValidAuth(auth)) {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

function isValidAuth(header: string): boolean {
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const decoded = atob(encoded);
  const [user, pass] = decoded.split(':');
  return user === import.meta.env.ADMIN_USER && pass === import.meta.env.ADMIN_PASS;
}
```

### Pattern 5: Client-Side Form with Fetch Submit
**What:** Enhanced form with per-field validation on blur and fetch-based submission.
**Example:**
```typescript
// src/scripts/contact-form.ts
const form = document.getElementById('contact-form') as HTMLFormElement;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateAll()) return;

  const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      showSuccess();
    } else {
      showError(result.message);
    }
  } catch {
    showError('Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Message';
  }
});
```

### Anti-Patterns to Avoid
- **Do NOT use `output: 'hybrid'` in Astro 5:** This was the Astro 4 approach. In Astro 5, keep default static output and use `export const prerender = false` per-page/endpoint.
- **Do NOT store the SQLite database in `src/`:** It will trigger Astro's file watcher and cause dev server restarts. Use a `data/` directory at project root.
- **Do NOT use `action` attribute on the form:** Use JavaScript fetch for better UX (no page reload, spinner, error handling).
- **Do NOT rely solely on client-side validation:** Server must re-validate everything; client validation is UX only.
- **Do NOT use `visibility: hidden` for honeypot:** Bots can detect this. Use `position: absolute; left: -9999px; tab-index: -1` with an innocuous field name.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Custom SMTP connection | Resend SDK | Deliverability, SPF/DKIM handled, retry logic built-in |
| Database ORM | Raw SQL queries | Drizzle ORM | Type safety, migrations, prevents SQL injection |
| SQLite driver | Custom bindings | better-sqlite3 | Battle-tested, synchronous API, excellent performance |
| Schema migrations | Manual CREATE TABLE | drizzle-kit push/migrate | Tracks schema changes, generates SQL, reproducible |
| Email validation regex | Custom regex | HTML5 `type="email"` + server regex | Email validation is notoriously complex |

**Key insight:** The biggest risk in this phase is not the individual pieces but the integration -- making Astro's adapter, server endpoints, SQLite, and Resend all work together. Each piece is simple; wiring them correctly matters.

## Common Pitfalls

### Pitfall 1: Astro Dev Server and SQLite File Watching
**What goes wrong:** Placing the SQLite database file inside `src/` or anywhere Astro watches causes infinite dev server restarts as every write triggers a rebuild.
**Why it happens:** Astro's Vite-based dev server watches for file changes.
**How to avoid:** Store `submissions.db` in a `data/` directory at project root. Add `data/` to `.gitignore`.
**Warning signs:** Dev server restarting after every form submission.

### Pitfall 2: Missing `prerender = false` on API Endpoint
**What goes wrong:** API endpoint returns 404 or gets built as a static file.
**Why it happens:** Astro 5 defaults everything to static prerendering.
**How to avoid:** Always add `export const prerender = false` at the top of any `.ts` file in `src/pages/api/` and any `.astro` file that needs server-side execution (like admin).
**Warning signs:** 404 on POST requests, or endpoint returns static HTML.

### Pitfall 3: Client Address Not Available
**What goes wrong:** `clientAddress` returns undefined or throws in development.
**Why it happens:** Local dev server may not set the client address properly.
**How to avoid:** Use `clientAddress` from the Astro context (available in API routes as `context.clientAddress`). Fallback to `request.headers.get('x-forwarded-for')` or `'127.0.0.1'` for dev.
**Warning signs:** Rate limiting not working, all submissions showing same IP.

### Pitfall 4: Resend Domain Verification
**What goes wrong:** Emails fail to send or land in spam.
**Why it happens:** Resend requires domain verification for production sending. The free `onboarding@resend.dev` sender only works for testing to your own verified email.
**How to avoid:** For development, use `onboarding@resend.dev` as the from address (sends only to the account owner's email). For production, verify a custom domain in Resend dashboard.
**Warning signs:** 403 errors from Resend API, emails not arriving.

### Pitfall 5: better-sqlite3 Native Module Build Issues
**What goes wrong:** `npm install` fails on `better-sqlite3` due to native compilation.
**Why it happens:** `better-sqlite3` requires a C++ compiler and Python for building native Node.js addons.
**How to avoid:** Ensure build tools are installed (Xcode Command Line Tools on macOS, `build-essential` on Linux). For Docker, use a multi-stage build with build tools in the build stage.
**Warning signs:** `node-gyp` errors during installation.

### Pitfall 6: Rate Limiter Memory Leak
**What goes wrong:** In-memory rate limiter Map grows unbounded over time.
**Why it happens:** Old IP entries are never cleaned up.
**How to avoid:** Add periodic cleanup (every N requests, remove entries older than 1 hour) or use a simple cleanup interval.
**Warning signs:** Increasing memory usage over weeks of operation.

## Code Examples

### Resend Email Sending
```typescript
// src/lib/email.ts
// Source: https://resend.com/docs/send-with-nodejs
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface ContactData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function sendContactNotification(data: ContactData) {
  const { error } = await resend.emails.send({
    from: import.meta.env.EMAIL_FROM || 'SyncTexts <onboarding@resend.dev>',
    to: [import.meta.env.CONTACT_EMAIL],
    replyTo: data.email,
    subject: `New inquiry from ${data.name}${data.company ? ` (${data.company})` : ''}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
  });

  if (error) throw new Error(`Email failed: ${error.message}`);
}
```

### Drizzle Insert + Query
```typescript
// Insert a submission
import { db } from '../db';
import { submissions } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

await db.insert(submissions).values({
  name: 'John',
  email: 'john@example.com',
  company: 'Acme',
  message: 'Hello!',
  ip: '1.2.3.4',
  rateLimited: false,
});

// Query all submissions ordered by newest first
const allSubmissions = db.select().from(submissions).orderBy(desc(submissions.createdAt)).all();

// Mark as read
db.update(submissions).set({ read: true }).where(eq(submissions.id, 1)).run();
```

### Server-Side Validation
```typescript
// src/lib/validation.ts
interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateContact(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }
  // Company is optional, no validation needed beyond type check

  return { valid: Object.keys(errors).length === 0, errors };
}
```

### Environment Variables Needed
```bash
# .env
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=hello@synctexts.com
EMAIL_FROM="SyncTexts <contact@synctexts.com>"
ADMIN_USER=admin
ADMIN_PASS=secure-password-here
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output: 'hybrid'` in Astro config | Default static + per-page `prerender = false` | Astro 5.0 (Dec 2024) | Simpler config; just add adapter and opt out per page |
| `output: 'server'` required for any SSR | Adapter alone enables SSR pages | Astro 5.0 | No need to change output mode for hybrid sites |
| Nodemailer + SMTP | Resend SDK (API-based) | 2023+ | Simpler setup, no SMTP config, better deliverability |
| Raw SQL or Prisma | Drizzle ORM | 2023+ | Lighter weight than Prisma, better SQLite support, no client generation step |

**Deprecated/outdated:**
- `output: 'hybrid'` config option: Still works but unnecessary in Astro 5 -- per-page control is the default behavior
- `@astrojs/node` modes before v9: API changed significantly; ensure v9+ patterns

## Open Questions

1. **Drizzle migration strategy: push vs migrate**
   - What we know: `drizzle-kit push` directly applies schema changes; `drizzle-kit migrate` generates SQL migration files
   - What's unclear: For a greenfield SQLite database, which approach is simpler
   - Recommendation: Use `drizzle-kit push` for development simplicity. The database is local SQLite, so migration history is less critical than with shared databases. Can switch to `migrate` later if needed.

2. **Resend free tier limits**
   - What we know: Free tier allows 100 emails/day, 1 sending domain
   - What's unclear: Whether the agency expects to exceed this
   - Recommendation: Free tier is sufficient for a contact form. Agency can upgrade when needed.

3. **Admin page complexity**
   - What we know: Admin needs list view with all fields, read/unread status, rate-limited flag
   - What's unclear: Whether mark-as-read needs to be a real-time toggle or page reload is acceptable
   - Recommendation: Simple page-reload approach (link to toggle read status via a small API endpoint). Keep it minimal.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEAD-01 | Contact form renders with 4 fields + honeypot | manual-only | Visual inspection in browser | N/A |
| LEAD-02 | Form submission triggers Resend email | manual-only | Submit form, check inbox | N/A |
| LEAD-03 | Submission saved to SQLite database | manual-only | Submit form, check admin page | N/A |
| LEAD-04 | Honeypot filled submissions silently rejected | manual-only | Submit with honeypot value filled | N/A |
| LEAD-05 | Rate limiting after 5 submissions/hour | manual-only | Submit 6 times rapidly, verify 6th is flagged | N/A |
| LEAD-06 | Client + server validation rejects invalid data | manual-only | Submit empty/invalid fields | N/A |

### Sampling Rate
- **Per task commit:** Manual browser testing (no test framework)
- **Per wave merge:** Full manual walkthrough of all form scenarios
- **Phase gate:** All 6 requirements verified via manual testing

### Wave 0 Gaps
- No test framework is configured for this project (per CLAUDE.md: "No test framework is configured")
- All validation is manual/visual for this phase
- If the planner wants automated tests, would need to add vitest or similar -- but this is a static marketing site with one API endpoint, so manual testing is proportionate

## Sources

### Primary (HIGH confidence)
- [Astro On-demand Rendering docs](https://docs.astro.build/en/guides/on-demand-rendering/) - hybrid rendering, per-page prerender control
- [Astro @astrojs/node adapter docs](https://docs.astro.build/en/guides/integrations-guide/node/) - v9.5.4, standalone mode config
- [Astro Endpoints docs](https://docs.astro.build/en/guides/endpoints/) - API route patterns, POST handler, request/response
- [Resend Node.js SDK docs](https://resend.com/docs/send-with-nodejs) - send API, constructor, options
- [Drizzle ORM SQLite docs](https://orm.drizzle.team/docs/get-started-sqlite) - better-sqlite3 setup, schema, config

### Secondary (MEDIUM confidence)
- [Resend npm package](https://www.npmjs.com/package/resend) - v6.9.3 confirmed
- [Astro clientAddress GitHub issue](https://github.com/withastro/astro/issues/3708) - IP access patterns

### Tertiary (LOW confidence)
- In-memory rate limiter pattern: based on common Node.js patterns, no specific library recommended (simple enough to implement inline)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries confirmed via official docs, versions verified
- Architecture: HIGH - Astro 5 hybrid pattern well-documented, patterns verified against current docs
- Pitfalls: HIGH - common issues documented in GitHub issues and official guides
- Rate limiting: MEDIUM - in-memory approach is standard but will reset on server restart (acceptable for this use case)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable ecosystem, 30-day validity)
