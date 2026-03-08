# Architecture Patterns

**Domain:** Tech agency marketing website with blog, portfolio (GitHub API), lead capture, and self-hosted deployment
**Researched:** 2026-03-08

## Recommended Architecture

**Pattern: Astro Hybrid-Rendered Multi-Page Site with Server Endpoints**

The site is primarily static (marketing pages, blog, portfolio) with two dynamic touch points: the contact form submission endpoint and GitHub API data fetched at build time. Astro's hybrid rendering mode handles this perfectly -- static by default, server-rendered only where needed.

```
                        +-------------------+
                        |   Traefik Proxy   |  (existing, handles TLS + routing)
                        +--------+----------+
                                 |
                        +--------v----------+
                        |  Astro (Node.js)  |  Docker container, replaces nginx
                        |  Hybrid Mode      |
                        +--------+----------+
                                 |
              +------------------+------------------+
              |                  |                   |
     +--------v------+  +-------v--------+  +-------v--------+
     | Static Pages  |  | Server         |  | Build-Time     |
     | (pre-rendered)|  | Endpoints      |  | Data Fetching  |
     |               |  |                |  |                |
     | - Home        |  | POST /api/     |  | GitHub API     |
     | - Team        |  |   contact      |  | (portfolio     |
     | - Pricing     |  |   (email +     |  |  repos at      |
     | - Blog/*      |  |    SQLite)     |  |  build time)   |
     | - Portfolio/* |  |                |  |                |
     +---------------+  +-------+--------+  +----------------+
                                |
                     +----------+----------+
                     |                     |
              +------v------+     +--------v------+
              | Email (SMTP)|     | SQLite DB     |
              | Transactional|    | (leads.db)    |
              | e.g. Resend  |    | Docker volume |
              +--------------+    +---------------+
```

### Why This Shape

1. **Mostly static.** Marketing pages, blog posts, portfolio items, team bios -- none of this changes per-request. Pre-rendering at build time gives the best performance and simplest deployment.

2. **One server endpoint.** The contact form is the only truly dynamic feature. Astro's hybrid mode lets you mark just the `/api/contact` endpoint as server-rendered while everything else stays static.

3. **Build-time GitHub fetching.** Portfolio data from GitHub private repos should be fetched at build time via Astro's Content Layer API (custom loader), not on every page visit. This avoids rate limits, reduces latency, and means the GitHub PAT never touches the browser. A rebuild (triggered by a webhook or cron) refreshes the data.

4. **SQLite over Postgres.** For a lead capture form on a marketing site, SQLite is the right database. No separate container, no connection pooling, no credentials management. A single file on a Docker volume. The volume of leads on an agency site does not justify the operational overhead of Postgres.

## Component Boundaries

| Component | Responsibility | Communicates With | Rendering |
|-----------|---------------|-------------------|-----------|
| **Layout Shell** | Global nav, footer, glassmorphism background, meta tags, analytics scripts | All pages | Static (pre-rendered) |
| **Home Page** | Hero, services grid, featured projects teaser, testimonials, CTA | Layout, Portfolio data | Static |
| **Portfolio Section** | Grid of curated GitHub repos with overrides (custom descriptions, screenshots) | GitHub API (build time), config file for overrides | Static |
| **Portfolio Detail Pages** | Individual project pages with full description, tech stack, screenshots | Portfolio data | Static |
| **Blog** | Markdown-driven article listing and detail pages | Content Collections (local `.md` files) | Static |
| **Team Page** | Member profiles with photos, roles, bios | Config/data file | Static |
| **Pricing Page** | Service tiers with features | Config/data file | Static |
| **Contact Form** | Client-side form with validation, submits to API | Server endpoint | Client JS (island) |
| **Contact API Endpoint** | `POST /api/contact` -- validates, saves to SQLite, sends email notification | SQLite, SMTP service | Server (SSR) |
| **Analytics** | GA4 + GTM script injection | Layout Shell (head) | Static (script tags) |

## Data Flow

### 1. Blog Content Flow (Build Time)

```
src/content/blog/*.md
        |
        v
Astro Content Collections (glob loader)
        |
        v
Type-safe schema validation (Zod)
        |
        v
Blog listing page (getCollection('blog'))
Blog detail pages ([...slug].astro)
        |
        v
Pre-rendered HTML
```

Blog posts are Markdown files with frontmatter (title, date, excerpt, tags, author). Astro's Content Collections with the `glob()` loader reads them at build time, validates against a Zod schema, and generates static pages. Adding a new post = commit a `.md` file and rebuild.

### 2. Portfolio Data Flow (Build Time)

```
portfolio.config.ts (list of repos + overrides)
        |
        v
Custom Astro Content Loader
        |
        v
GitHub REST API (with PAT from env)
  - GET /repos/{owner}/{repo}
  - GET /repos/{owner}/{repo}/languages
  - GET /repos/{owner}/{repo}/topics
        |
        v
Merge API data + manual overrides (descriptions, screenshots, display order)
        |
        v
Portfolio listing page + detail pages
        |
        v
Pre-rendered HTML
```

A config file lists 5-10 curated repo slugs plus manual overrides (custom description, screenshot URLs, display order). At build time, a custom content loader fetches metadata from GitHub's API, merges it with the overrides, and Astro generates static portfolio pages. The GitHub PAT is a build-time secret only.

### 3. Contact Form Flow (Runtime)

```
User fills form (client-side)
        |
        v
Client-side validation (HTML5 + JS island)
        |
        v
POST /api/contact (fetch request)
        |
        v
Server endpoint validates input (Zod)
        |
   +----+----+
   |         |
   v         v
SQLite    SMTP/API
(persist  (notify via
 lead)    Resend/Nodemailer)
   |         |
   +----+----+
        |
        v
JSON response { success: true }
        |
        v
Client shows confirmation UI
```

The contact form is an Astro island -- a small interactive component hydrated on the client. On submit, it POSTs to `/api/contact.ts`, which runs server-side. The endpoint validates with Zod, writes to SQLite (via `better-sqlite3`), sends an email notification, and returns JSON. This keeps the form functional even without JavaScript (with a fallback action attribute) but provides a smooth async experience when JS is available.

### 4. Analytics Flow (Client-Side)

```
Layout head
        |
        v
GTM container script (loaded via <script>)
        |
        v
GTM triggers GA4 tag
        |
        v
Page views, events tracked automatically
```

GTM and GA4 are injected as script tags in the layout. No build-time integration needed. Configure GTM to fire GA4 on page views and specific events (form submission, CTA clicks).

## Patterns to Follow

### Pattern 1: Content Collections for All Structured Data

**What:** Use Astro Content Collections not just for blog posts, but for all structured content -- team members, testimonials, pricing tiers, portfolio overrides.

**When:** Any content that has a consistent shape and benefits from type safety.

**Why:** Single source of truth, Zod validation catches errors at build time, TypeScript inference throughout.

```
src/content/
  blog/           # Markdown files
    my-post.md
  team/           # JSON or YAML
    team.json
  testimonials/
    testimonials.json
  pricing/
    pricing.json
```

### Pattern 2: Page-Level Data Loading

**What:** Each `.astro` page fetches its own data in the frontmatter script section. No global state management.

**When:** Always. This is an Astro fundamental.

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title="Blog">
  {sorted.map(post => <BlogCard post={post} />)}
</BaseLayout>
```

### Pattern 3: Design Token Preservation

**What:** Migrate the existing CSS custom properties (indigo primary, pink secondary, dark base) into a global stylesheet that Astro loads. Do not re-implement the design system -- port it.

**When:** Phase 1 migration.

```css
/* Existing tokens preserved in src/styles/global.css */
:root {
  --color-primary: #6366f1;
  --color-secondary: #ec4899;
  --color-bg: #0a0a0c;
  /* ... rest of existing design tokens */
}
```

### Pattern 4: Astro Islands for Interactive Components

**What:** Only hydrate components that need interactivity. The contact form and mobile nav toggle are the only islands on this site.

**When:** A component needs client-side JavaScript (event handlers, state).

```astro
<!-- Only the form gets hydrated. Everything else is static HTML. -->
<ContactForm client:visible />
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Full SSR Mode

**What:** Setting `output: 'server'` to make every page server-rendered.

**Why bad:** Adds latency to every page load, requires a running Node.js process for pages that never change, increases resource usage on the self-hosted server. Marketing pages do not need per-request rendering.

**Instead:** Use `output: 'static'` (default) with `prerender = false` only on the contact API endpoint. Or use `output: 'hybrid'` if more endpoints are added later.

### Anti-Pattern 2: Client-Side GitHub API Calls

**What:** Fetching GitHub repo data in the browser at page load.

**Why bad:** Exposes the Personal Access Token to the client. Subject to GitHub API rate limits per visitor. Slower page loads. Private repo data visible in network tab.

**Instead:** Fetch at build time. The data is static between deployments anyway.

### Anti-Pattern 3: Separate Backend Service

**What:** Building a separate Express/Fastify API server alongside Astro for the contact form.

**Why bad:** Two containers to deploy, two processes to monitor, CORS configuration, doubled complexity for one endpoint.

**Instead:** Use Astro's built-in server endpoints. One container, one process, one deployment.

### Anti-Pattern 4: Heavy Framework Islands

**What:** Using React/Vue/Svelte for components that are purely presentational (service cards, testimonials, team profiles).

**Why bad:** Ships unnecessary JavaScript. These components have zero interactivity.

**Instead:** Write them as `.astro` components. They render to zero-JS HTML. Reserve framework islands only for genuinely interactive elements.

## Component File Structure

```
src/
  components/
    layout/
      BaseLayout.astro      # HTML shell, head, nav, footer, bg glows
      Navigation.astro       # Glass nav bar (static, no JS needed)
      Footer.astro
    home/
      Hero.astro
      ServicesGrid.astro
      FeaturedProjects.astro
      Testimonials.astro
      CtaBanner.astro
    portfolio/
      ProjectCard.astro
      ProjectGrid.astro
    blog/
      BlogCard.astro
      BlogPost.astro         # Article layout with prose styling
    team/
      TeamMember.astro
    pricing/
      PricingTier.astro
    contact/
      ContactForm.tsx        # Interactive island (only JS component)
    shared/
      SectionHeading.astro
      GlassPanel.astro       # Reusable glassmorphism card
      Badge.astro
  content/
    blog/
      *.md                   # Blog posts with frontmatter
    config.ts                # Collection schemas (Zod)
  data/
    team.json                # Team member data
    testimonials.json        # Client testimonials
    pricing.json             # Service tiers
    portfolio.config.ts      # Curated repo list + overrides
  pages/
    index.astro              # Home
    portfolio/
      index.astro            # Portfolio listing
      [slug].astro           # Portfolio detail
    blog/
      index.astro            # Blog listing
      [...slug].astro        # Blog post detail
    team.astro               # Team page
    pricing.astro            # Pricing page
    contact.astro            # Contact page
    api/
      contact.ts             # POST endpoint (SSR)
  styles/
    global.css               # Ported design tokens + base styles
```

## Deployment Architecture

```
Docker Host (self-hosted server)
  |
  +-- Traefik (existing, external)
  |     |
  |     +-- synctexts.com --> Astro container (port 4321)
  |
  +-- synctexts-website container
        |
        +-- Node.js + Astro (hybrid mode)
        +-- SQLite database (Docker volume mount)
        +-- .env (GitHub PAT, SMTP credentials)
```

**Key changes from current setup:**

| Current | New |
|---------|-----|
| nginx:alpine serving static HTML | node:alpine running Astro SSR |
| No build step in container | Multi-stage build: install + build + run |
| No database | SQLite file on Docker volume |
| No env vars | GitHub PAT, SMTP creds in .env |
| Traefik port 80 | Traefik port 4321 (Astro default) |

The Dockerfile changes from a simple nginx copy to a multi-stage Node.js build. The docker-compose gains a volume mount for the SQLite database and an env_file directive. Traefik labels stay the same, just pointing to port 4321 instead of 80.

## Build and Rebuild Strategy

| Trigger | What Happens | How |
|---------|-------------|-----|
| Code push to main | Full rebuild + redeploy | CI/CD pipeline (GitHub Actions or webhook) |
| New blog post | Commit `.md` file, triggers rebuild | Same as code push |
| Portfolio refresh | Rebuild fetches latest GitHub data | Cron job or manual trigger |
| Contact form submission | Runtime, no rebuild needed | Server endpoint handles it |

## Scalability Considerations

| Concern | At Current Scale | At 10K Monthly Visitors | Notes |
|---------|-----------------|------------------------|-------|
| Page load speed | Static HTML, near-instant | Same -- pre-rendered | No scaling concern |
| Contact form | SQLite handles easily | SQLite handles easily | Agency sites get dozens of leads/month, not thousands |
| GitHub API limits | 5K req/hr with PAT, only at build | Same -- build-time only | Not a concern |
| Build time | <30s for ~20 pages | Same | Astro builds are fast |
| Server resources | Minimal Node.js process | Same | Static serving is cheap |

This is an agency marketing site, not a SaaS product. Scalability is not a meaningful concern. The architecture is intentionally simple because the traffic patterns do not justify complexity.

## Suggested Build Order (Dependencies)

This ordering reflects technical dependencies -- what must exist before the next thing can be built.

```
Phase 1: Foundation
  BaseLayout, Navigation, Footer, global styles (ported from existing CSS)
  Home page (port existing sections into Astro components)
  --> Everything depends on the layout shell existing first

Phase 2: Content System
  Content Collections setup (schemas, config)
  Blog (Markdown files + listing + detail pages)
  --> Blog is the simplest content type, proves the content system works

Phase 3: Data-Driven Pages
  Team page (JSON data + components)
  Pricing page (JSON data + components)
  Testimonials (JSON data + home page section)
  --> These are simple data-to-template pages, no external APIs

Phase 4: Portfolio (GitHub Integration)
  Portfolio config file
  Custom content loader (GitHub API)
  Portfolio listing + detail pages
  --> Depends on content system from Phase 2, adds external API complexity

Phase 5: Contact Form (Server Endpoint)
  SQLite setup
  POST /api/contact endpoint
  ContactForm interactive island
  Email notification integration
  --> Only server-side component, needs hybrid mode enabled

Phase 6: Polish and Deploy
  Analytics (GA4 + GTM)
  SEO (meta tags, sitemap, robots.txt)
  Updated Dockerfile (multi-stage Node.js build)
  Updated docker-compose (volume, env)
  --> Everything else must work before deployment hardening
```

## Sources

- [Astro Endpoints Documentation](https://docs.astro.build/en/guides/endpoints/)
- [Astro Content Collections Documentation](https://docs.astro.build/en/guides/content-collections/)
- [Astro Rendering Modes](https://v4.docs.astro.build/en/basics/rendering-modes/)
- [Astro On-Demand Rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro Markdown Documentation](https://docs.astro.build/en/guides/markdown-content/)
- [Astro SSR Guide (2025)](https://eastondev.com/blog/en/posts/dev/20251202-astro-ssr-guide/)
- [Astro Content Layer Deep Dive](https://astro.build/blog/live-content-collections-deep-dive/)
- [Deploying Astro with Hybrid Rendering](https://render.com/articles/deploying-astro-websites-with-hybrid-rendering)
