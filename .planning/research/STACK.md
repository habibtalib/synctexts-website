# Technology Stack

**Project:** SyncTexts Agency Website
**Researched:** 2026-03-08

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro | 5.18.x | Site framework, routing, build | Content-first framework built for exactly this use case: marketing sites with markdown blogs. Hybrid rendering (static pages + server endpoints) means the portfolio page, blog, and pricing are pre-rendered for SEO while the contact form endpoint runs server-side. Already uses Vite under the hood, so existing CSS/JS patterns carry over. | HIGH |
| @astrojs/node | 9.x | Server adapter | Enables self-hosted deployment on own server via standalone Node.js process. Required for SSR endpoints (contact form API). Docker-friendly with Alpine images under 200MB. | HIGH |

### Content & Blog

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro Content Collections | built-in | Markdown blog engine | First-class Astro feature. Zod-validated frontmatter schemas, type-safe queries, automatic slug generation. No plugin needed -- it is the standard way to do markdown blogs in Astro. Supports MDX if needed later. | HIGH |
| @astrojs/mdx | 4.x | MDX support (optional) | Only add if blog posts need interactive components. Plain markdown works out of the box without this. | MEDIUM |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| better-sqlite3 | 11.x | Contact form lead storage | Zero-infrastructure database. Single file on disk, no separate server process, perfect for storing contact form submissions on a self-hosted server. Synchronous API is actually faster than async alternatives. Handles the write volume of a contact form (dozens/day) trivially. Self-contained -- fits the "no external dependencies" philosophy. | HIGH |
| Drizzle ORM | 0.41.x | Type-safe database queries | Lightweight, TypeScript-first ORM. Works with better-sqlite3 driver. Provides schema definitions, migrations, and type-safe queries without the weight of Prisma. Used internally by Astro DB itself. | MEDIUM |

### Email

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Nodemailer | 6.x | Contact form email notifications | Self-hosted compatible -- works with any SMTP server (agency likely has one or can use their server's sendmail). No vendor lock-in, no API key dependency on a third party. Battle-tested (15+ years, 80M+ downloads). Use with the agency's existing email infrastructure. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vanilla CSS (existing) | -- | All styling | The existing glassmorphism design system uses CSS custom properties extensively. It works. Migrating to Tailwind would mean rewriting 800+ lines of carefully crafted CSS for zero benefit. Astro supports scoped `<style>` tags in components, which gives CSS modules-like isolation without any tooling. Keep what works. | HIGH |

### GitHub API Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Octokit/rest | 21.x | GitHub API client | Official GitHub SDK. Type-safe, handles auth, pagination, rate limiting. Used with a PAT (Personal Access Token) to fetch private repo metadata (name, description, language, stars). Data fetched at build time (static) so no runtime API calls or rate limit concerns. | HIGH |

### Analytics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @astrojs/partytown | 2.x | GA/GTM script isolation | Runs third-party analytics scripts in a web worker, keeping the main thread clean. Astro-native integration. Prevents Google Analytics and GTM from blocking page rendering. | MEDIUM |

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker | -- | Containerized deployment | Agency does DevOps with K8s/Docker daily. Multi-stage Dockerfile: build stage (npm run build) + runtime stage (Node.js Alpine). Astro has official Docker recipe in their docs. | HIGH |
| Docker Compose | -- | Service orchestration | Single docker-compose.yml to run the Astro server. Simple, reproducible, fits self-hosted VPS deployment. No need for K8s for a single website. | HIGH |

### Development Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | 5.x | Type safety | Astro has first-class TS support. Content collection schemas, API endpoint handlers, and Drizzle queries all benefit from types. Incremental adoption -- .astro files work with or without TS. | HIGH |
| Vite | 6.x (bundled) | Dev server & build | Comes with Astro. No separate config needed. The existing Vite setup knowledge transfers directly. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Astro | Next.js | Overkill for a content site. React hydration overhead for pages that are 95% static HTML. Astro ships zero JS by default. Next.js App Router complexity is unnecessary for a marketing site. |
| Framework | Astro | Nuxt/SvelteKit | Both are good but optimized for apps, not content sites. Would require learning Vue/Svelte. Astro lets you use plain HTML templates (familiar from existing codebase). |
| Framework | Astro | 11ty (Eleventy) | No built-in server endpoints. Would need a separate backend for the contact form. Astro's hybrid mode handles both static and server in one project. |
| Database | better-sqlite3 | PostgreSQL | Requires a separate database server process. Massive overkill for storing contact form submissions. Adds Docker Compose complexity (separate postgres container, backups, connection pooling). |
| Database | better-sqlite3 | Node.js built-in sqlite | Still experimental/release-candidate as of early 2026. Not production-ready. API may change. better-sqlite3 is battle-tested and faster. |
| Database | better-sqlite3 | Turso/libSQL | Turso Database rewrite is still ALPHA. The managed service adds external dependency. For a self-hosted single-server site, a local SQLite file is simpler and faster. |
| Email | Nodemailer | Resend | Resend is cloud-only (no self-hosting). Adds vendor dependency and cost. Agency has own infrastructure -- Nodemailer with SMTP is the right choice for self-hosted. |
| Email | Nodemailer | SendGrid/Mailgun | Same issue: external vendor dependency, monthly costs, API keys to manage. Nodemailer + local SMTP or existing email provider is simpler. |
| ORM | Drizzle | Prisma | Prisma generates a heavy client, requires a separate generation step, and its SQLite support is less mature. Drizzle is lighter, faster, and more SQL-like. |
| Styling | Vanilla CSS | Tailwind CSS | Existing 800+ line CSS design system would need complete rewrite. The glassmorphism aesthetic uses complex gradients, backdrop-filters, and custom properties that are easier to maintain in vanilla CSS. No benefit to migrating. |
| Styling | Vanilla CSS | CSS-in-JS | Server-rendered site with Astro components. Scoped `<style>` in .astro files provides component isolation natively. No runtime CSS-in-JS library needed. |

## Architecture Decision: Hybrid Rendering

Astro's `output: "hybrid"` mode is the key architectural choice:

- **Static (default):** Home, Portfolio, Team, Blog, Pricing pages are pre-rendered at build time. Fast, SEO-friendly, cacheable.
- **Server-rendered (opt-in):** Contact form endpoint (`src/pages/api/contact.ts`) runs on the server to process form submissions, send email, and write to SQLite.
- **Build-time data fetching:** GitHub API calls happen during `astro build`, not at runtime. No rate limiting concerns, no runtime secrets exposure.

This means the site loads like a static site (fast, SEO-optimized) but has server capabilities where needed (contact form).

## Migration Path from Current Codebase

The existing vanilla HTML/CSS/JS site maps cleanly to Astro:

1. `index.html` sections become Astro components (`Hero.astro`, `Services.astro`, etc.)
2. `style.css` splits into component-scoped styles or a shared `global.css`
3. `main.js` scroll animations move to a `<script>` tag in the layout (Astro handles this)
4. Vite config is replaced by Astro's built-in Vite (astro.config.mjs)
5. New pages added as `src/pages/*.astro` files
6. Blog posts added as `src/content/blog/*.md` files

No paradigm shift required. Astro templates look like HTML with some extra syntax.

## Installation

```bash
# Initialize Astro in existing project
npm create astro@latest -- --template minimal

# Core
npm install astro @astrojs/node

# Database
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# Email
npm install nodemailer
npm install -D @types/nodemailer

# GitHub API
npm install @octokit/rest

# Analytics (optional, add when ready)
npm install @astrojs/partytown

# TypeScript (comes with Astro, but ensure types)
npm install -D typescript @astrojs/check
```

## Configuration Skeleton

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',        // Static by default, server where needed
  adapter: node({
    mode: 'standalone'      // Self-contained Node.js server
  }),
  server: {
    port: 4321,
    host: true               // Needed for Docker
  }
});
```

## Version Pinning Strategy

Pin major versions, allow patch updates:

```json
{
  "astro": "^5.18.0",
  "@astrojs/node": "^9.0.0",
  "better-sqlite3": "^11.0.0",
  "drizzle-orm": "^0.41.0",
  "nodemailer": "^6.9.0",
  "@octokit/rest": "^21.0.0"
}
```

**Note on Astro 6:** Astro 6 entered beta in January 2026 with significant improvements (new dev server, CSP support, font APIs). However, it is not yet stable. Start with Astro 5.18.x (current stable) and upgrade to 6.x when it reaches stable release. The migration should be straightforward.

## Sources

- [Astro Official Site](https://astro.build/) - Framework overview, current version 5.18.x
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) - Markdown blog setup
- [Astro Node Adapter Docs](https://docs.astro.build/en/guides/integrations-guide/node/) - Self-hosted deployment
- [Astro Docker Recipe](https://docs.astro.build/en/recipes/docker/) - Official Docker deployment guide
- [Astro On-demand Rendering](https://docs.astro.build/en/guides/on-demand-rendering/) - Hybrid SSR/SSG mode
- [better-sqlite3 on npm](https://www.npmjs.com/package/better-sqlite3) - Database library
- [Drizzle ORM SQLite Docs](https://orm.drizzle.team/docs/get-started-sqlite) - ORM setup
- [Nodemailer](https://nodemailer.com/) - Email sending
- [Octokit/rest GitHub](https://github.com/octokit/rest.js) - GitHub API client
- [Astro 6 Beta Announcement](https://astro.build/blog/astro-6-beta/) - Future upgrade path
- [Node.js SQLite Status](https://github.com/nodejs/node/issues/57445) - Why not to use built-in sqlite yet
