# SyncTexts Agency Website

## What This Is

A full-featured Astro-powered agency website for SyncTexts (synctexts.com) — a tech agency specializing in Web Development (Laravel, FilamentPHP), Mobile (Flutter), DevOps (Kubernetes, Terraform), and Analytics (GA, GTM). The multi-page site showcases services, team profiles, a GitHub-powered portfolio with case studies, blog articles with syntax highlighting, client testimonials, and pricing packages. It includes a working contact form with email notifications and database persistence, comprehensive SEO optimization, GTM/GA4 analytics, and a production Docker deployment stack with Caddy reverse proxy and automatic HTTPS.

## Core Value

Potential clients can see SyncTexts' real project portfolio and expertise, then easily get in touch — turning the website into a lead generation engine.

## Requirements

### Validated

<!-- Shipped and confirmed in v1.0. -->

- ✓ Astro framework with hybrid rendering (static pages + server endpoints) — v1.0
- ✓ Multi-page structure with shared layout (Home, Portfolio, Team, Blog, Pricing, Contact) — v1.0
- ✓ Sticky navigation with links to all pages and CTA button — v1.0
- ✓ Mobile-responsive navigation with hamburger menu — v1.0
- ✓ Dark glassmorphism design system extended to all pages — v1.0
- ✓ All pages fully responsive across mobile, tablet, desktop — v1.0
- ✓ Refined homepage sections (hero, services, tech stack, portfolio preview, testimonials, CTA) — v1.0
- ✓ Portfolio page with GitHub API integration and curated projects — v1.0
- ✓ Portfolio detail pages with Markdown case studies and manual overrides — v1.0
- ✓ Team page with member profiles driven by YAML config — v1.0
- ✓ Blog with Markdown posts, syntax highlighting, tags, and read time — v1.0
- ✓ Testimonials section driven by YAML config — v1.0
- ✓ Pricing page with 3 service tiers driven by YAML config — v1.0
- ✓ Contact form with email (Resend) and SQLite persistence — v1.0
- ✓ Honeypot spam prevention and server-side rate limiting — v1.0
- ✓ Client-side and server-side form validation — v1.0
- ✓ Admin submissions page with Basic Auth — v1.0
- ✓ SEO meta tags, OG tags, canonical URLs on every page — v1.0
- ✓ Auto-generated sitemap with admin/API route exclusion — v1.0
- ✓ JSON-LD structured data (Organization + BlogPosting) — v1.0
- ✓ GTM/GA4 analytics with custom event tracking — v1.0
- ✓ Docker deployment with Caddy reverse proxy and automatic HTTPS — v1.0
- ✓ Health check endpoint for container monitoring — v1.0

### Active

<!-- Next milestone scope. -->

(None yet — define with `/gsd:new-milestone`)

### Out of Scope

- Headless CMS — content managed via Markdown and config files, not a CMS
- OAuth/authentication — public-facing marketing site, no user accounts
- E-commerce/payments — pricing is informational, not transactional
- Mobile app — web only
- Live chat widget — adds 200-500KB JS, requires someone to respond in real-time
- AI chatbot — novelty without clear ROI; well-structured content is better
- Internationalization (i18n) — agency operates in English
- Newsletter signup — defer until blog has consistent publishing cadence

## Context

Shipped v1.0 with 3,711 LOC across Astro, TypeScript, CSS, and JavaScript.

**Tech stack:** Astro 5.x (hybrid rendering), Node.js standalone adapter, Drizzle ORM + SQLite, Resend for email, Shiki for syntax highlighting, Caddy for reverse proxy/HTTPS, Docker for deployment.

**Current state:**
- 6 main pages + portfolio detail + blog post dynamic routes + admin page
- 5 content collections (blog, team, testimonials, pricing, portfolio with GitHub API loader)
- Contact form pipeline: client validation → API endpoint → SQLite + Resend email
- SEO: unique meta/OG per page, JSON-LD, auto-sitemap
- Analytics: GTM conditional injection, GA4 pageview + CTA + form event tracking
- Deployment: multi-stage Dockerfile, docker-compose with Caddy, health check

**Known tech debt (from v1.0 audit):**
- Unused `.coming-soon` CSS class in global.css
- Dead `jsonLd` prop in BaseLayout Props interface
- Homepage portfolio href fallback produces dead links for projects without caseStudySlug (not triggered by current data)

## Constraints

- **Design**: Keep the dark glassmorphism aesthetic — same visual language
- **Hosting**: Self-hosted on own server via Docker (not Vercel/Netlify)
- **Blog**: Markdown files in repo (no external CMS dependency)
- **Portfolio**: GitHub API with PAT for private repo access; curated repos via YAML config

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro hybrid rendering | Multi-page site with blog, API integration, and SEO needs; static prerendering + server endpoints | ✓ Good — fast builds, clean DX |
| Markdown for blog | Version-controlled, no external dependency, fits developer workflow | ✓ Good — Shiki highlighting works well |
| Resend for email (not Nodemailer) | Simpler API, no SMTP config needed, reliable delivery | ✓ Good — clean integration |
| SQLite + Drizzle for contact storage | Lightweight, no external DB dependency, file-based persistence | ✓ Good — Docker volume for persistence |
| Caddy for reverse proxy | Automatic HTTPS via Let's Encrypt, simpler than nginx/Traefik | ✓ Good — zero-config SSL |
| Content collections for all data | YAML + Markdown with Zod schemas, type-safe, build-time validation | ✓ Good — single pattern for all data |
| GTM for analytics | Flexible tag management, can add/change tags without code deploys | ✓ Good — conditional loading via env var |
| In-memory rate limiter | Resets on restart; acceptable for low-traffic agency site | ⚠️ Revisit if traffic grows |
| Basic Auth for admin | Simple, no user management needed for single admin | ⚠️ Revisit if multiple admins needed |

---
*Last updated: 2026-03-11 after v1.0 milestone*
