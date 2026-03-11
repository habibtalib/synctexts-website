# Phase 4: SEO, Analytics & Deployment - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the site discoverable by search engines, track visitor behavior with GA4/GTM, and deploy to production on the agency's own server with Docker and automatic HTTPS. Covers SEO meta tags, Open Graph, sitemap, JSON-LD structured data, semantic HTML, GA4/GTM analytics, Dockerfile, docker-compose, Caddy reverse proxy with SSL, and health check endpoint.

</domain>

<decisions>
## Implementation Decisions

### Analytics setup
- GTM manages GA4: single GTM container script in `<head>`, GA4 configured as a tag inside GTM
- GTM_ID and GA4_MEASUREMENT_ID stored as environment variables (consistent with existing .env pattern)
- Custom events from day one: contact form submissions (success/error) and CTA button clicks
- Analytics scripts excluded from /admin pages (only public pages tracked)

### SEO & meta tags
- Single default OG image shared across all pages (branded SyncTexts image with logo + tagline on dark background)
- Blog posts and portfolio pages can override OG image later but start with the default
- JSON-LD depth: Organization schema on all pages + BlogPosting schema on blog post pages (matches SEO-06 exactly)
- Canonical URLs on all pages via `<link rel="canonical">`
- Organization schema sameAs field uses placeholder social URLs (github.com/synctexts, linkedin.com/company/synctexts, etc.)

### Docker & hosting
- Caddy as reverse proxy (automatic HTTPS with Let's Encrypt, zero-config SSL renewal)
- Multi-stage Dockerfile with Node Alpine (Stage 1: full Node for build, Stage 2: Alpine for runtime ~150-200MB)
- SQLite database persisted via Docker named volume mounted to /app/data
- Production environment variables managed via .env file referenced by docker-compose env_file directive
- Production .env lives on server, never committed to git

### Domain & SSL
- Domain: synctexts.com configured in Caddyfile
- www.synctexts.com redirects (301) to synctexts.com (apex domain is the canonical)
- Health check: GET /api/health returns `{ "status": "ok", "timestamp": "..." }` — used by Docker HEALTHCHECK

### Claude's Discretion
- OG image design (layout, colors, dimensions — should match glassmorphism brand)
- GTM event naming conventions
- Caddyfile additional headers (security headers like X-Frame-Options, CSP, etc.)
- Dockerfile Node.js version selection
- docker-compose service naming and network configuration
- Sitemap generation approach (Astro integration vs manual)
- Semantic HTML audit depth (heading hierarchy, landmark elements)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro`: Already has `title` and `description` props with meta tags — extend with OG tags, canonical, JSON-LD injection
- `.env.example`: Existing pattern for documenting required env vars — add GTM_ID, GA4_MEASUREMENT_ID
- `astro.config.mjs`: Already configured with @astrojs/node adapter for hybrid rendering
- `src/pages/api/contact.ts`: Existing server endpoint pattern — health check follows same structure

### Established Patterns
- Environment variables via `import.meta.env` (used in email.ts, admin auth)
- Server endpoints with `export const prerender = false` (contact API, admin)
- Glassmorphism design system for any new UI elements
- `data/` directory at project root for SQLite — Docker volume mounts here

### Integration Points
- BaseLayout `<head>` section: GTM script, OG meta tags, JSON-LD, canonical URL
- `astro.config.mjs`: sitemap integration
- New files: Dockerfile, docker-compose.yml, Caddyfile at project root
- New endpoint: /api/health for container monitoring
- .env.example: additional variables for GTM_ID, GA4_MEASUREMENT_ID

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for GTM event configuration, Caddyfile security headers, and Dockerfile optimization.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-seo-analytics-deployment*
*Context gathered: 2026-03-11*
