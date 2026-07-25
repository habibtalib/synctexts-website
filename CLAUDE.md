# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

synctexts.com — the SyncTexts agency site: a marketing/portfolio front end plus a lead-capture and lead-management backend. Astro 5 in **SSR mode** (`@astrojs/node` standalone adapter), TypeScript, SQLite via Drizzle, deployed as a Docker container behind Traefik.

The repo started as a Vite + vanilla site. `index.html`, `main.js`, and `style.css` at the repo root are **leftovers from that era** — nothing builds or serves them. The live site is entirely under `src/`.

## Commands

```bash
npm run dev          # astro dev (localhost:4321)
npm run build        # astro build → dist/server/entry.mjs (SSR bundle)
npm run preview      # serve the built SSR output
npm run db:generate  # drizzle-kit generate — new migration from src/db/schema.ts
npm run db:migrate   # backs up data/submissions.db, then applies migrations
npm run db:studio    # drizzle-kit studio
```

No test framework, linter, or formatter is configured. Type-check with `npx astro check` (`@astrojs/check` is installed).

## Architecture

### Rendering model

SSR by default. Pages that hit the DB or read request headers set `export const prerender = false` explicitly (`src/pages/admin/index.astro`, all API routes). `BaseLayout.astro` wraps every page — SEO meta, Open Graph, JSON-LD, GTM injection (suppressed on `/admin`), Google Fonts, `<ClientRouter />` view transitions, and the shared nav/footer/background chrome.

### Content collections (`src/content.config.ts`)

Eight collections, three loader styles:

- **Markdown via `glob`** — `blog` (`src/data/blog/*.md`), `portfolioCaseStudies` (`src/data/portfolio/*.md`)
- **YAML via `file`** — `team`, `testimonials`, `pricing`, `gallery`, `training`
- **Custom inline loader** — `portfolio`. Reads `src/data/portfolio-config.yaml` and, when `GITHUB_PAT` is set, enriches each entry from the GitHub API (description, languages, `updated_at`). **Local YAML values always win over GitHub values**; without the PAT it degrades to config-only with a warning.

Adding a portfolio project means touching three places: an entry in `portfolio-config.yaml` (card), a matching `src/data/portfolio/<slug>.md` case study whose filename matches `caseStudySlug`, and a cover image in `public/images/portfolio/`.

### Lead pipeline

`POST /api/contact` (`src/pages/api/contact.ts`) is the spine, in order:

1. Honeypot — a filled `website` field returns a fake success.
2. `lib/validation.ts` — required fields plus allow-listed enums (`service_type`, `budget`, `timeline`). These enum values are the contract shared by the form, the scorer, and the admin filters.
3. `lib/rate-limiter.ts` — in-memory sliding window, 5/hr per IP. **Not persistent**; resets on restart and is per-process.
4. `lib/scoring.ts` + `scoring-config.ts` — pure function, weights and tier thresholds live entirely in the config file.
5. Insert into `submissions`, capturing `lastInsertRowid`.
6. Email notification via Resend (`lib/email.ts`) — failures are logged, never fatal.
7. `lib/hubspot.ts` — **fire-and-forget, deliberately not awaited** so CRM latency never blocks the response. Upsert-by-email against HubSpot v3 Contacts; requires custom contact properties documented in the file header. Silently skips when `HUBSPOT_TOKEN` is unset.

Rate-limited submissions are still stored (flagged `rateLimited`) but skip both email and HubSpot.

`POST /api/cal-webhook` verifies an HMAC-SHA256 signature with `timingSafeEqual` and back-fills `calBookingUid` / `calScheduledAt` onto the matching submission.

### Admin dashboard

`/admin` and `/api/admin/*` are gated by HTTP Basic Auth (`ADMIN_USER` / `ADMIN_PASS`). `lib/auth.ts` is the shared helper for the API routes; the page itself inlines the same check because it must emit a `WWW-Authenticate` header. All filtering, sorting, and pagination is URL-param driven and executed in Drizzle.

### Database

Single `submissions` table (`src/db/schema.ts`). `src/db/index.ts` opens `data/submissions.db` at module load, creating `data/` if missing, with WAL + `busy_timeout=5000` + `synchronous=NORMAL`. `data/` is gitignored — in production it is the `app-data` Docker volume.

### Client scripts

- `public/animations.js` — loaded by `BaseLayout` as `<script is:inline src="/animations.js">`. **`src/scripts/animations.js` is a byte-identical duplicate that is never bundled**; edit the `public/` copy, or the change has no effect.
- `src/scripts/contact-form.ts` — the multi-step form state machine (step navigation, sessionStorage persistence, per-step validation, GTM events), imported by `contact.astro`.
- `src/scripts/analytics.js` — bundled only when `PUBLIC_GTM_ID` is set.

## Deployment

Push to `master` triggers `.github/workflows/deploy-reevo.yml`: scp the whole tree to the server, then `docker compose up -d --build`. Routing, TLS, www→apex redirect, and security headers are all Traefik labels in `docker-compose.yml` (external network `stack_web`). `Caddyfile` is a leftover alternative and is not referenced by the compose stack.

The rsync uses `rm: false`, so **files deleted from the repo are not deleted on the server**. To retire a page, replace it with a redirect stub rather than deleting it — see `src/pages/team/hafizal.astro` (stub) vs `_hafizal.astro` (the preserved original; the `_` prefix excludes it from routing).

`/api/health` backs both the Dockerfile `HEALTHCHECK` and the compose healthcheck.

## Environment

`.env.example` is the reference. `RESEND_API_KEY` + `CONTACT_EMAIL` (email), `ADMIN_USER`/`ADMIN_PASS` (dashboard), `PUBLIC_GTM_ID` (analytics), plus three not in the example file: `GITHUB_PAT` (portfolio enrichment), `HUBSPOT_TOKEN`/`HUBSPOT_PORTAL_ID` (CRM), `CAL_WEBHOOK_SECRET` (booking webhook). Server-side code reads these via `import.meta.env`. Every integration degrades gracefully when its key is absent — except `CAL_WEBHOOK_SECRET`, whose absence 500s the webhook.

## Design system

Tokens live in `:root` of `src/styles/global.css` — dark base (`#060608`), indigo primary (`#6366f1`), pink secondary (`#ec4899`), cyan accent, Outfit (display) / Inter (body). Use `var(--token)` rather than literals. Classes are kebab-case with prefix families (`glass-`, `btn-`, `bg-`); glassmorphism is `.glass-panel`, gradient text is `.text-gradient`, scroll reveals are `.reveal` → `.active` driven by an IntersectionObserver in `animations.js`. Desktop-first with `max-width` media queries at 900px and 600px.

## Planning artifacts

`.planning/` holds GSD workflow state (roadmap, phases, verifications) and is committed. Note that `.planning/codebase/*.md` was generated against the pre-Astro vanilla site and is stale — do not trust it over the actual code.
