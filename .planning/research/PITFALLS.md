# Pitfalls Research

**Domain:** Tech agency website -- migration from vanilla HTML/CSS/JS landing page to full-featured multi-page site
**Researched:** 2026-03-08
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: GitHub PAT Leaked in Source Code or Client Bundle

**What goes wrong:**
The GitHub Personal Access Token (PAT) needed to fetch private repo data for the portfolio gets committed to the repo, embedded in client-side JavaScript, or exposed in the built output. Automated scanners find exposed tokens within minutes. A leaked PAT with repo scope grants full read/write access to every private repository the token owner can access.

**Why it happens:**
Developers hardcode the token during development for convenience, or use a client-side fetch call to the GitHub API directly from the browser. The token ends up in the JS bundle that ships to users. Even if removed later, git history retains the secret permanently.

**How to avoid:**
- GitHub API calls MUST happen server-side (build-time SSG or an API route), never from the browser
- Store the PAT in environment variables, never in code
- Use fine-grained PATs with read-only access scoped to only the specific repos needed
- Set token expiration (90 days max) and rotate regularly
- Add `.env*` to `.gitignore` before the first commit with secrets
- Enable GitHub secret scanning on the repository

**Warning signs:**
- Any `fetch("https://api.github.com")` call in client-side JS files
- PAT string visible in browser DevTools Network tab
- Token appears in `git log -p --all -S "ghp_"` search
- `.env` file not in `.gitignore`

**Phase to address:**
Foundation/setup phase -- environment and secret management must be established before any GitHub API integration begins.

---

### Pitfall 2: Client-Side Rendering Kills SEO and Social Sharing

**What goes wrong:**
Migrating to a JS framework with client-side rendering (CSR) means search engine crawlers see an empty page or loading spinner instead of content. Social media previews (Open Graph) show nothing because the HTML is empty until JavaScript executes. For an agency website where discoverability and link sharing are core to lead generation, this is fatal.

**Why it happens:**
Developers pick a SPA framework (React/Vue with client-side routing) because it feels modern, without considering that an agency marketing site needs crawlable HTML. The existing vanilla site actually has better SEO than a naive SPA migration would produce.

**How to avoid:**
- Use Static Site Generation (SSG) as the primary rendering strategy -- agency content changes infrequently and does not need real-time server rendering
- Choose a framework that defaults to SSG: Astro, Next.js (static export), or similar
- Pre-render all pages at build time so every URL serves complete HTML
- Generate Open Graph meta tags per-page in the build step
- Generate a sitemap.xml automatically during build
- Test with `curl` or `view-source:` to verify HTML content is present without JS

**Warning signs:**
- Page source shows only `<div id="app"></div>` with no content
- Social media link previews are blank or show the site name only
- Google Search Console shows pages as "Discovered - currently not indexed"
- Lighthouse SEO score below 90

**Phase to address:**
Framework selection phase -- this decision is architectural and cannot be retrofitted without a rewrite.

---

### Pitfall 3: Glassmorphism Breaks Accessibility and Mobile Performance

**What goes wrong:**
The existing dark glassmorphism design uses `backdrop-filter: blur()` and semi-transparent panels. When extended to a full multi-page site with more content, this creates two problems: (1) text on transparent backgrounds fails WCAG 2.2 contrast requirements, making content unreadable for users with visual impairments, and (2) excessive blur effects cause frame drops on mid-range mobile devices, especially with 10+ glass elements per page.

**Why it happens:**
The current single-page design has a controlled number of glass panels against a predictable dark background. Scaling to portfolio grids, blog post listings, team cards, and pricing tables multiplies glass elements dramatically. Content-heavy pages have unpredictable backgrounds behind transparent panels, making contrast inconsistent.

**How to avoid:**
- Audit every glass panel for WCAG AA contrast (4.5:1 for body text, 3:1 for large text) against the actual rendered background
- Use a solid dark fallback behind text areas within glass panels -- not purely transparent
- Limit `backdrop-filter: blur()` to 5-7 elements per page maximum
- Keep blur values between 8-15px (higher values are exponentially more GPU-expensive)
- Provide `prefers-reduced-motion` media query support to disable blur/animation for users who need it
- Test on a mid-range Android device, not just MacBook Pro

**Warning signs:**
- Lighthouse accessibility score below 90
- Any text with contrast ratio below 4.5:1 (use Chrome DevTools color picker)
- Page frame rate drops below 30fps on mobile during scroll
- Users with `prefers-reduced-motion` still see animations

**Phase to address:**
Design system/foundation phase -- establish accessible glass panel components with built-in contrast guarantees before building pages.

---

### Pitfall 4: Contact Form Ships Without Spam Protection or Error Handling

**What goes wrong:**
The contact form goes live with just email sending and database saving. Within days, spam bots flood it with hundreds of junk submissions, filling the database and triggering email rate limits. Real leads get buried in noise. Or worse: the form appears to work but silently fails (email provider rejects, database connection drops) and leads are permanently lost.

**Why it happens:**
Spam protection is treated as a "nice to have" and deferred. The simulated form in the current codebase (`setTimeout` with fake success) creates a false sense that form handling is simple. Developers test the happy path (submit, get success) without testing failure modes.

**How to avoid:**
- Implement honeypot fields (hidden input that bots fill, humans don't) as minimum viable spam protection
- Add server-side rate limiting per IP (max 3 submissions per 5 minutes)
- Save to database FIRST, then attempt email send -- ensures no lead is ever lost even if email fails
- Implement proper error states: network error, validation error, server error, rate limited
- Add a simple time-based check (reject submissions that happen less than 2 seconds after page load -- bots submit instantly)
- Send email asynchronously with retry logic; don't block the user response on email delivery

**Warning signs:**
- No spam filtering logic in form handler code
- Email send failure causes the entire submission to fail (no database fallback)
- No rate limiting middleware on the form endpoint
- Success message shows even when the backend is unreachable (current behavior)

**Phase to address:**
Contact form implementation phase -- spam protection must ship with the form, not after.

---

### Pitfall 5: SSL Certificate Expiry on Self-Hosted Deployment

**What goes wrong:**
Let's Encrypt certificates expire every 90 days. Without automated renewal, the site suddenly shows browser security warnings, destroying trust for an agency that sells DevOps expertise. Users cannot submit the contact form over broken HTTPS. Google also penalizes sites with expired certificates in search rankings.

**Why it happens:**
Initial deployment sets up SSL manually or with a one-time Certbot run. The renewal cron job or container is not configured, or it silently fails because port 80 is blocked by a firewall rule, Docker networking doesn't expose the ACME challenge path, or the Certbot container was removed.

**How to avoid:**
- Use Caddy instead of raw Nginx as the reverse proxy -- Caddy handles automatic HTTPS with zero configuration, including certificate issuance, renewal, and OCSP stapling
- If using Nginx, use the `certbot/certbot` Docker image with a scheduled renewal check (every 12 hours) and Nginx reload
- Set up a simple uptime monitor (even a free one like UptimeRobot) that checks HTTPS and alerts on certificate issues
- Test renewal in staging with `--dry-run` before going live
- Ensure port 80 remains open for ACME HTTP-01 challenges even if all traffic redirects to HTTPS

**Warning signs:**
- No renewal automation visible in Docker Compose or cron configuration
- Certificate expiry date less than 30 days away with no renewal process
- Port 80 blocked at firewall level
- Current Dockerfile serves static files directly from Nginx with no SSL setup at all

**Phase to address:**
Deployment/infrastructure phase -- SSL automation must be part of the initial deployment, not bolted on later.

---

### Pitfall 6: Breaking Existing SEO Equity During Migration

**What goes wrong:**
The current site at synctexts.com has existing search engine indexing, backlinks, and ranking signals. Migrating to a new framework changes URL structures, removes or restructures the single-page anchor links (#services, #tech, #contact), and potentially changes page titles and meta descriptions. Google drops rankings, inbound links 404, and organic traffic disappears.

**Why it happens:**
Developers focus on building the new site and treat migration as "just deploying the new version." The old URL structure is forgotten. No redirect map is created. The existing meta description and title tags are rewritten casually.

**How to avoid:**
- Document every existing URL (including hash anchors) before starting migration
- Implement 301 redirects from old URLs to new equivalents
- Preserve or improve existing meta title and description -- do not degrade them
- Keep the same domain, don't change to www or vice versa
- Submit updated sitemap to Google Search Console immediately after deployment
- Monitor Google Search Console for crawl errors for 30 days post-migration

**Warning signs:**
- No redirect mapping document exists
- Old anchor links (#services, #tech) return 404 or land on wrong content
- Google Search Console shows spike in "Page not found" errors post-deploy
- Organic search traffic drops more than 20% in the month after migration

**Phase to address:**
Migration/deployment phase -- redirect mapping should be prepared during development but executed at deployment.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding portfolio repo list in source | Quick to implement, no config needed | Adding/removing repos requires code change and redeploy | Never -- use a config file or env var from day one |
| Skipping image optimization for portfolio screenshots | Faster initial build | 2MB+ screenshots destroy mobile load times and Core Web Vitals | Never -- use build-time image processing |
| Using `localStorage` for contact form draft saving | No backend needed | Data lost on device switch, no persistence guarantees | Acceptable for MVP if documented as temporary |
| Inlining all CSS in one file | Simple, no build complexity | 5000+ line CSS file becomes unmaintainable, blocks rendering of above-the-fold content | Only for the current single-page landing; must split before multi-page |
| Fetching GitHub API on every page load | Always fresh data | Burns through 5,000/hr rate limit quickly, adds 500ms+ latency per page | Never -- cache at build time or with a short TTL server-side cache |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub REST API | Fetching all repo data including README, languages, and contributors in separate calls (N+1 problem) | Use GraphQL API to batch all needed repo data in a single request, or fetch at build time and cache as static JSON |
| Google Analytics 4 | Adding the GA4 snippet but not configuring events for contact form submissions, CTA clicks, or portfolio views | Define a measurement plan first: track form_submit, cta_click, portfolio_view as custom events; verify in GA4 DebugView |
| Google Tag Manager | Loading GTM synchronously in the `<head>`, blocking page render | Load GTM asynchronously with the standard async snippet; defer non-critical tags |
| Email service (SMTP/API) | Using personal Gmail SMTP which has 500/day send limits and gets flagged as spam | Use a transactional email service (Resend, Postmark, or SendGrid free tier) with proper SPF/DKIM/DMARC DNS records |
| Markdown blog | Not sanitizing rendered HTML from Markdown, allowing XSS if Markdown contains raw HTML | Use a Markdown renderer with HTML sanitization enabled by default; explicitly allowlist safe HTML tags if raw HTML is needed |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Google Fonts loaded as render-blocking resource | Flash of Unstyled Text (FOUT) or invisible text for 1-3s on slow connections | Use `font-display: swap`, preconnect to fonts.googleapis.com, consider self-hosting fonts | Noticeable on 3G connections, impacts LCP score |
| Unoptimized portfolio screenshots | Largest Contentful Paint (LCP) above 4s, high data transfer | Generate responsive images (WebP/AVIF) at build time with srcset; lazy-load below-fold images | Any page with more than 2 unoptimized images |
| No caching headers on static assets | Every page visit re-downloads CSS, JS, fonts, images | Configure Cache-Control with long max-age for hashed assets, short max-age for HTML | Immediately noticeable on repeat visits; wastes bandwidth |
| Excessive backdrop-filter elements on portfolio/blog listing pages | Janky scrolling, dropped frames on mobile | Limit glass effect to container-level elements, use solid backgrounds for individual cards in grids | 10+ glass elements visible simultaneously on mid-range mobile |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| GitHub PAT with full `repo` scope | Token leak grants read/write access to ALL repositories, not just the portfolio ones | Use fine-grained PAT scoped to specific repos with read-only access |
| Contact form endpoint with no rate limiting | Denial-of-service via form spam flood; email provider blocks account | Server-side rate limiting (express-rate-limit or equivalent) + honeypot |
| Serving the site without security headers | Clickjacking, XSS, MIME-sniffing attacks | Set Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security headers in Nginx/Caddy config |
| Blog Markdown rendered with raw HTML enabled | Stored XSS if blog content source is compromised or contains malicious HTML | Sanitize Markdown output; disable raw HTML in renderer or use allowlist |
| Contact form database storing data unencrypted | Data breach exposes client names and emails | Encrypt PII at rest; use parameterized queries to prevent SQL injection |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Portfolio page shows loading skeleton for 2-3 seconds while GitHub API is called | Feels slow, undermines the "we build performant things" message | Pre-fetch and cache portfolio data at build time; page loads instantly with static HTML |
| Contact form shows generic "Something went wrong" on error | User doesn't know if their message was sent, gives up, goes to competitor | Show specific error messages: "Network error -- please try again" vs "Please check your email format" vs "Too many submissions -- please wait 5 minutes" |
| Blog has no estimated reading time or publish date | Users can't judge if content is current or worth their time | Add frontmatter-driven reading time and formatted publish date to every post |
| Mobile hamburger menu not implemented for new multi-page navigation | Navigation links overflow or wrap awkwardly on mobile screens | Current nav has 3 links and works; 6+ page navigation needs a mobile menu drawer |
| No 404 page | Users who mistype a URL see a raw error, feel lost | Design a branded 404 page that matches the glassmorphism theme and links back to home |

## "Looks Done But Isn't" Checklist

- [ ] **Contact form:** Often missing server-side validation -- verify that empty fields, invalid emails, and oversized messages are rejected server-side, not just client-side
- [ ] **Portfolio:** Often missing manual override capability -- verify that custom descriptions and screenshots can replace GitHub API data per-repo via config
- [ ] **Blog:** Often missing Open Graph tags per post -- verify that sharing a blog post URL on LinkedIn/Twitter shows the correct title, description, and image
- [ ] **Analytics:** Often missing event tracking -- verify that GA4 tracks form submissions, CTA clicks, and portfolio interactions, not just pageviews
- [ ] **Deployment:** Often missing health checks -- verify that Docker container has a health check endpoint and restarts automatically on failure
- [ ] **SEO:** Often missing canonical URLs -- verify each page has a `<link rel="canonical">` to prevent duplicate content issues
- [ ] **Responsive:** Often missing tablet breakpoint -- verify layouts work at 768px-1024px, not just mobile (<768) and desktop (>1024)
- [ ] **Performance:** Often missing above-the-fold optimization -- verify hero section renders without waiting for JS bundle to load

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GitHub PAT leaked | MEDIUM | Immediately revoke token on GitHub, generate new fine-grained token with minimal scope, audit git history with `git filter-repo` to remove secret, rotate any other secrets that were in the same file |
| SEO rankings dropped post-migration | HIGH | Implement 301 redirects immediately, resubmit sitemap to Google Search Console, monitor recovery over 4-8 weeks; rankings may take months to fully recover |
| Contact form flooded with spam | LOW | Add honeypot field + rate limiting; purge spam entries from database with a query; takes 1-2 hours to implement |
| SSL certificate expired | LOW | Run `certbot renew` manually, then fix automation; downtime is usually under 30 minutes if caught quickly |
| Glassmorphism contrast failures reported | MEDIUM | Add solid background fallbacks behind text in glass panels; requires touching every component that uses glass styling; 1-2 day effort |
| Client-side rendering causing SEO problems | HIGH | Requires architectural change to SSG/SSR; essentially a rebuild of the rendering pipeline; should have been caught in framework selection |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GitHub PAT exposure | Foundation/setup | `grep -r "ghp_" src/` returns nothing; PAT only in `.env`; `.env` in `.gitignore` |
| CSR kills SEO | Framework selection | `curl -s https://synctexts.com/portfolio` returns full HTML content, not empty `<div>` |
| Glassmorphism accessibility | Design system | Lighthouse accessibility score >= 95; all text passes WCAG AA contrast check |
| Contact form spam | Contact form implementation | Honeypot field present; rate limiter active; test with 10 rapid submissions -- 7+ get rejected |
| SSL expiry | Deployment/infrastructure | `certbot renew --dry-run` succeeds; certificate expiry date > 60 days after deploy |
| SEO equity loss | Migration/deployment | All old URLs either still work or 301 redirect; Google Search Console shows zero new 404s |
| Google Fonts render-blocking | Foundation/performance | Lighthouse Performance score >= 90; no render-blocking font requests in waterfall |
| Portfolio API rate limiting | Portfolio implementation | Portfolio data served from static JSON or cached; zero GitHub API calls on page load |
| Email delivery failures | Contact form implementation | Form submission saved to DB even when email send fails; retry queue for failed emails |

## Sources

- [GitHub Docs: Rate limits for REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub Docs: Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Docs: Keeping API credentials secure](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)
- [BeVigil: Hardcoded GitHub PATs leak 159 private repositories](https://bevigil.com/blog/hardcoded-github-personal-access-tokens-leak-159-private-repositories/)
- [Axess Lab: Glassmorphism meets accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)
- [New Target: Glassmorphism with accessibility in mind](https://www.newtarget.com/web-insights-blog/glassmorphism/)
- [Search Engine Journal: Site migration SEO mistakes](https://www.searchenginejournal.com/site-migration-seo-common-mistakes-that-hurt-rankings/416516/)
- [Gracker: SSR for SEO guide](https://gracker.ai/seo-101/server-side-rendering-ssr-seo)
- [CrafterCMS: SEO for SPAs](https://craftercms.com/blog/2021/12/seo-for-single-page-apps-the-need-for-server-side-rendering)
- [DEV Community: Honeypot spam prevention](https://dev.to/felipperegazio/how-to-create-a-simple-honeypot-to-protect-your-web-forms-from-spammers--25n8)
- [DEV Community: SSL in Docker containers](https://dev.to/marrouchi/the-challenge-about-ssl-in-docker-containers-no-one-talks-about-32gh)
- [ButterCMS: SEO for static site generators](https://buttercms.com/blog/a-complete-dead-simple-guide-to-seo-for-static-site-generators/)

---
*Pitfalls research for: SyncTexts agency website migration*
*Researched: 2026-03-08*
