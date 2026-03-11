# Phase 3: Lead Capture - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Working contact form with email notifications via Resend, SQLite persistence via Drizzle ORM, client+server validation, honeypot spam prevention, and server-side rate limiting. Includes a simple admin page for viewing submissions. Requires switching Astro to hybrid rendering mode for server endpoints.

</domain>

<decisions>
## Implementation Decisions

### Form experience
- Field order: Name → Company (optional) → Email → Message
- Validation: inline per-field errors on blur + error summary at top on submit attempt
- Submit button shows spinner and "Sending..." text, disabled until response
- Success/error feedback style: Claude's discretion

### Email notifications
- Use Resend SDK (not Nodemailer/SMTP) for transactional email delivery
- Single recipient email address configured via env var (e.g., CONTACT_EMAIL)
- Reply-to set to the submitter's email so agency can reply directly from inbox
- Email body includes all form fields (name, company, email, message)

### Rate limiting
- 5 submissions per IP per hour
- Rate-limited submissions are still saved to SQLite (marked as rate-limited) but do not trigger email notification
- User-facing rate limit message: Claude's discretion (friendly, not technical)

### Spam prevention
- Hidden honeypot field — submissions with it filled are silently rejected (no error shown to user)
- Combined with rate limiting for layered defense

### Database & admin
- SQLite database via Drizzle ORM for all submissions
- Submissions table includes: name, email, company, message, IP, timestamp, read/unread status, rate-limited flag
- Admin page at /admin protected by HTTP Basic Auth (username + password from env vars)
- Admin list shows full details: date, name, email, company, full message, IP, read/unread, rate-limited flag
- Submission detail view: Claude's discretion (inline expand or detail page)

### Claude's Discretion
- Success/error feedback style after form submission (inline banner vs replace form)
- Rate limit message wording
- Admin submission detail view approach (expand inline vs separate page)
- Loading skeleton / empty state design for admin page
- Email notification HTML template design

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/contact.astro`: Existing contact page with glass-panel form (name, email, message fields) — needs enhancement with company field, honeypot, and JS submission logic
- `src/components/ContactCTA.astro`: CTA component linking to /contact — no changes needed
- `glass-input` CSS class: Established form input styling in global CSS
- `btn btn-primary` CSS classes: Button styling already defined
- `BaseLayout` + `PageHeader`: Layout components for new admin page

### Established Patterns
- Glassmorphism via `glass-panel`, `glass-input` classes — admin page should follow same visual system
- Content collections via `src/content.config.ts` — not needed for form submissions (direct DB)
- `reveal` class for scroll animations — contact form already uses this

### Integration Points
- `astro.config.mjs` needs `output: 'hybrid'` or `output: 'server'` + adapter for API endpoint
- `@astrojs/node` adapter required for server-side rendering of form endpoint
- New `/api/contact` server endpoint for form POST handler
- New `/admin` page(s) for submission viewing
- `package.json` needs: `resend`, `drizzle-orm`, `better-sqlite3`, `@astrojs/node`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for email templates, admin UI layout, and error messaging.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-lead-capture*
*Context gathered: 2026-03-10*
