# External Integrations

**Analysis Date:** 2026-03-08

## APIs & External Services

**None currently integrated.**

The contact form in `index.html` (lines 159-170) has a submit handler in `main.js` (lines 39-63) that simulates a submission with `setTimeout`. No actual API call is made. This is a placeholder that needs a real backend or third-party form service.

## Data Storage

**Databases:**
- None - this is a static site with no data persistence

**File Storage:**
- Local filesystem only (static assets served from `dist/`)

**Caching:**
- None (relies on browser caching and CDN/hosting-level caching)

## Authentication & Identity

**Auth Provider:**
- Not applicable - no user authentication exists

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- None (no `console.log` or logging framework in production code)

## CI/CD & Deployment

**Hosting:**
- Not configured - no deployment configuration files detected
- Build output goes to `dist/` (per Vite defaults and `.gitignore`)

**CI Pipeline:**
- None - no `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, or similar detected

## Environment Configuration

**Required env vars:**
- None currently consumed by application code

**Secrets location:**
- `.env` file exists in `.gitignore` but is not referenced in code

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## CDN / External Asset Dependencies

**Google Fonts:**
- Loaded via `<link>` tags in `index.html` (lines 11-15)
- Fonts: `Outfit` (weights 300-700) and `Inter` (weights 400-600)
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`
- Impact: page rendering depends on these external resources; consider self-hosting fonts for offline/performance

**Vite SVG:**
- `index.html` references `/vite.svg` as favicon (line 6) - this is a default Vite placeholder that should be replaced with a SyncTexts favicon

## Integration Gaps (Future Needs)

**Contact Form Backend:**
- The form at `main.js` lines 39-63 needs a real submission endpoint
- Options: Formspree, Netlify Forms, AWS SES, or custom API
- Current behavior: simulates send with a 1.5s delay, shows "Message Sent!" then resets

**Analytics:**
- The site markets Google Analytics and GTM services but does not use them itself
- No tracking scripts are present in `index.html`

---

*Integration audit: 2026-03-08*
