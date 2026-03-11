# Phase 2: Content & Portfolio - Research

**Researched:** 2026-03-09
**Domain:** Astro content collections, GitHub API integration, Markdown rendering, data-driven pages
**Confidence:** HIGH

## Summary

Phase 2 transforms placeholder pages (portfolio, team, blog, pricing) into data-driven content using Astro's Content Layer API. The project runs Astro 5.18+ which includes the mature Content Layer API with built-in `glob()` and `file()` loaders, plus the ability to write custom inline loaders for GitHub API data. Blog posts use Markdown files with frontmatter; team, testimonials, and pricing data use YAML/JSON config files. Portfolio data comes from GitHub's REST API at build time via a custom content loader, with manual overrides stored in local config files.

Astro's content collections provide type-safe schemas via Zod, automatic TypeScript inference, and a unified query API (`getCollection()`, `getEntry()`) regardless of data source. Shiki syntax highlighting is built into Astro's Markdown pipeline -- no additional packages needed, just theme configuration in `astro.config.mjs`.

**Primary recommendation:** Use Astro content collections for ALL data-driven content (blog via `glob()` Markdown loader, team/testimonials/pricing via `file()` YAML loader, portfolio via custom inline loader fetching GitHub API at build time with local YAML overrides merged in).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORT-01 | Portfolio page displays 5-10 curated projects from GitHub private repos | Custom content loader fetching GitHub REST API at build time |
| PORT-02 | Each portfolio card shows repo name, description, primary languages, last updated | GitHub API returns `name`, `description`, `language`, `updated_at`; languages endpoint gives full breakdown |
| PORT-03 | Config file defines which repos to display (repo slugs + PAT in env var) | YAML config for repo slugs; `import.meta.env.GITHUB_PAT` for token |
| PORT-04 | Manual override per project (custom title, description, screenshots, tech tags) | Local YAML overrides merged with GitHub API data in custom loader |
| PORT-05 | Individual project detail pages with full case study content | Markdown files in `src/data/portfolio/` with `glob()` loader + dynamic routes via `getStaticPaths()` |
| PORT-06 | GitHub API data fetched at build time only (PAT never exposed to client) | Custom loader runs in Node.js build context; PAT used server-side only |
| TEAM-01 | Team page with member profiles (photo, name, role, short bio) | `file()` loader reading `src/data/team.yaml` |
| TEAM-02 | Team data driven by config file, not hardcoded HTML | Zod-validated YAML schema via content collection |
| TEST-01 | Testimonials section with client quotes, name, role, company | `file()` loader reading `src/data/testimonials.yaml` |
| TEST-02 | Testimonials data driven by config file | Same as TEST-01, replaces inline data in `index.astro` |
| PRIC-01 | Pricing page with 3 service tiers | `file()` loader reading `src/data/pricing.yaml` |
| PRIC-02 | Each tier shows included services, starting price, and CTA | Zod schema enforces required fields per tier |
| PRIC-03 | Pricing data driven by config file | Same as PRIC-01 |
| BLOG-01 | Blog listing page with title, date, excerpt, read time | `glob()` Markdown loader + computed read time from body length |
| BLOG-02 | Individual blog posts rendered from Markdown with YAML frontmatter | `getStaticPaths()` + `render()` + `<Content />` component |
| BLOG-03 | Syntax highlighting for code blocks | Shiki built into Astro Markdown pipeline; configure dark theme |
| BLOG-04 | Blog posts support tags for categorization | Tags array in frontmatter schema; display on listing and post pages |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.18.0 | Framework (already installed) | Content Layer API, built-in Markdown, Shiki |
| zod | (bundled with astro) | Schema validation for collections | Used by `defineCollection()` -- no separate install |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/mdx | latest | MDX support (optional) | Only if blog posts need interactive components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Content collections | Raw `fetch()` in frontmatter | Loses type safety, schema validation, unified query API |
| YAML config files | JSON config files | YAML is more readable for non-technical content; either works with `file()` loader |
| Shiki (built-in) | Prism, Expressive Code | Shiki is zero-config in Astro; Expressive Code adds copy buttons but is overkill for v1 |

**Installation:**
```bash
# No new packages needed for core functionality
# Astro 5.18+ includes everything: content collections, Zod, Shiki, Markdown
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── content.config.ts          # All collection definitions
├── data/
│   ├── blog/                  # Markdown blog posts
│   │   ├── first-post.md
│   │   └── second-post.md
│   ├── portfolio/             # Portfolio case study Markdown files
│   │   ├── project-crm.md
│   │   └── project-infra.md
│   ├── team.yaml              # Team member profiles
│   ├── testimonials.yaml      # Client testimonials
│   ├── pricing.yaml           # Service tiers
│   └── portfolio-config.yaml  # GitHub repo slugs + manual overrides
├── pages/
│   ├── blog/
│   │   ├── index.astro        # Blog listing
│   │   └── [...id].astro      # Individual blog post (dynamic route)
│   ├── portfolio/
│   │   ├── index.astro        # Portfolio grid
│   │   └── [...id].astro      # Project detail (dynamic route)
│   ├── team.astro             # Team page
│   ├── pricing.astro          # Pricing page
│   └── index.astro            # Homepage (update testimonials to use collection)
└── components/
    ├── BlogPostCard.astro     # Blog listing card
    ├── PortfolioCard.astro    # Portfolio grid card (enhance existing ProjectCard)
    ├── TeamMemberCard.astro   # Team member profile card
    ├── PricingTier.astro      # Pricing tier card
    └── TestimonialCard.astro  # Already exists, update to receive collection data
```

### Pattern 1: Content Collection Definition
**What:** Define all collections in `src/content.config.ts`
**When to use:** Always -- this is the single source of truth for all data schemas
**Example:**
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const team = defineCollection({
  loader: file('./src/data/team.yaml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    photo: z.string(),
    order: z.number().default(0),
  }),
});

const testimonials = defineCollection({
  loader: file('./src/data/testimonials.yaml'),
  schema: z.object({
    id: z.string(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
    company: z.string(),
  }),
});

const pricing = defineCollection({
  loader: file('./src/data/pricing.yaml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    highlighted: z.boolean().default(false),
    cta: z.string().default('Get Started'),
  }),
});

export const collections = { blog, team, testimonials, pricing };
```

### Pattern 2: Custom GitHub API Loader for Portfolio
**What:** Inline loader fetches GitHub repo data at build time, merges with local overrides
**When to use:** Portfolio collection -- fetches from GitHub API, merges with local YAML config
**Example:**
```typescript
// Inside content.config.ts
const portfolio = defineCollection({
  loader: async () => {
    const fs = await import('node:fs');
    const yaml = await import('yaml'); // or use JSON

    // Read local config with repo slugs and overrides
    const configRaw = fs.readFileSync('./src/data/portfolio-config.yaml', 'utf-8');
    const config = yaml.parse(configRaw);

    const token = process.env.GITHUB_PAT;
    const entries = [];

    for (const project of config.projects) {
      let ghData = {};
      if (token && project.repo) {
        const res = await fetch(`https://api.github.com/repos/${project.repo}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          ghData = await res.json();
          // Fetch languages
          const langRes = await fetch(`https://api.github.com/repos/${project.repo}/languages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (langRes.ok) {
            ghData.languages = await langRes.json();
          }
        }
      }

      entries.push({
        id: project.slug,
        title: project.title || ghData.name || project.slug,
        description: project.description || ghData.description || '',
        languages: project.techTags || Object.keys(ghData.languages || {}),
        updatedAt: ghData.updated_at || null,
        screenshots: project.screenshots || [],
        caseStudySlug: project.caseStudySlug || null,
      });
    }
    return entries;
  },
  schema: z.object({
    title: z.string(),
    description: z.string(),
    languages: z.array(z.string()),
    updatedAt: z.string().nullable(),
    screenshots: z.array(z.string()).default([]),
    caseStudySlug: z.string().nullable(),
  }),
});
```

### Pattern 3: Dynamic Routes from Collections
**What:** Generate static pages from collection entries using `getStaticPaths()`
**When to use:** Blog posts, portfolio detail pages
**Example:**
```typescript
// src/pages/blog/[...id].astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<BaseLayout title={post.data.title}>
  <article>
    <Content />
  </article>
</BaseLayout>
```

### Pattern 4: Read Time Calculation
**What:** Compute reading time from post body length
**When to use:** Blog listing and post pages (BLOG-01)
**Example:**
```typescript
function getReadTime(body: string): string {
  const wordsPerMinute = 200;
  const words = body.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}
```

### Anti-Patterns to Avoid
- **Hardcoding data in page files:** The homepage currently has inline `projects` and `testimonials` arrays. These MUST be moved to collections/config files to satisfy TEST-01/TEST-02.
- **Using `Astro.glob()` for content:** This is the legacy approach. Use `getCollection()` from `astro:content` instead.
- **Putting content in `src/content/`:** Astro 5 uses `src/data/` by default for content collections or any path specified in the loader's `base` option. The old `src/content/` convention still works but `src/data/` is the new standard.
- **Exposing PAT in client-side code:** The GitHub PAT must ONLY be used in the content loader (build-time Node.js context) or server endpoints. Never pass it to component props or client scripts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom Markdown parser | Astro's built-in `render()` + `<Content />` | Handles frontmatter, remark/rehype plugins, edge cases |
| Syntax highlighting | Custom code block styling | Shiki (built into Astro) | 200+ languages, consistent themes, zero JS shipped to client |
| Schema validation | Manual type checking of YAML/JSON | Zod via `defineCollection()` schema | Build-time errors, TypeScript inference, transformation |
| Reading time | External reading-time npm package | Simple word count function (~3 lines) | No dependency needed for basic word count |
| YAML parsing in loaders | Manual parsing | `file()` loader handles YAML/JSON natively | Built-in, handles arrays and objects |
| GitHub API client | Octokit SDK | Direct `fetch()` calls | Only need 2 endpoints; SDK is overkill |

**Key insight:** Astro's content layer handles most of the heavy lifting. The custom code needed is minimal: one inline loader for GitHub API, one YAML config for overrides, and page components that query collections.

## Common Pitfalls

### Pitfall 1: Collection Sort Order is Non-Deterministic
**What goes wrong:** Blog posts appear in random order on listing page
**Why it happens:** Astro docs state "the sort order of generated collections is non-deterministic and platform-dependent"
**How to avoid:** Always sort collection results explicitly: `.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())`
**Warning signs:** Posts appearing in different order on different builds

### Pitfall 2: `file()` Loader Requires `id` Field in Data
**What goes wrong:** Build error when using `file()` loader with YAML arrays
**Why it happens:** Each entry in a `file()` collection needs a unique `id` field
**How to avoid:** Include an `id` field in every YAML array entry (e.g., `id: sarah-mitchell` for team members)
**Warning signs:** "Entry missing id" build errors

### Pitfall 3: GitHub API Rate Limits
**What goes wrong:** Build fails when fetching too many repos
**Why it happens:** Unauthenticated: 60 req/hr; Authenticated (PAT): 5,000 req/hr. Each repo = 2 requests (repo + languages)
**How to avoid:** Always use PAT authentication; 5-10 repos = 10-20 requests, well within limits
**Warning signs:** 403 responses from GitHub API

### Pitfall 4: Environment Variable Access in Content Loaders
**What goes wrong:** `import.meta.env.GITHUB_PAT` is undefined in content loader
**Why it happens:** Content loaders run in Node.js build context, not Vite context
**How to avoid:** Use `process.env.GITHUB_PAT` in content loaders (Node.js context), not `import.meta.env`
**Warning signs:** Empty API responses, unauthenticated requests

### Pitfall 5: Missing `content.config.ts` Location
**What goes wrong:** Collections not recognized
**Why it happens:** File must be at `src/content.config.ts` (Astro 5 convention)
**How to avoid:** Place file at exactly `src/content.config.ts`
**Warning signs:** `getCollection()` returns empty results

### Pitfall 6: Shiki Theme Clashing with Dark Site
**What goes wrong:** Code blocks have jarring light background on dark-themed site
**Why it happens:** Default `github-dark` theme may not match the site's exact dark palette
**How to avoid:** Use `github-dark` (matches well with dark sites) or configure `css-variables` theme for full control
**Warning signs:** Visual inconsistency in blog post code blocks

### Pitfall 7: Build Failure Without GitHub PAT
**What goes wrong:** Build crashes in CI/local without PAT configured
**Why it happens:** Custom loader tries to fetch GitHub API without auth
**How to avoid:** Add graceful fallback: if no PAT, use only local override data; log a warning
**Warning signs:** Build errors in fresh clones or CI environments

## Code Examples

### Querying and Displaying Blog Posts
```typescript
// src/pages/blog/index.astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogPostCard from '../../components/BlogPostCard.astro';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const sortedPosts = posts.sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime()
);

function getReadTime(body: string): string {
  const words = body.split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}
---
<BaseLayout title="Blog">
  <section class="container section">
    {sortedPosts.map((post) => (
      <BlogPostCard
        title={post.data.title}
        date={post.data.date}
        excerpt={post.data.excerpt}
        readTime={getReadTime(post.body || '')}
        tags={post.data.tags}
        href={`/blog/${post.id}`}
      />
    ))}
  </section>
</BaseLayout>
```

### Portfolio Config YAML Structure
```yaml
# src/data/portfolio-config.yaml
projects:
  - slug: enterprise-crm
    repo: synctexts/enterprise-crm  # GitHub owner/repo
    title: "Enterprise CRM Dashboard"  # Override GitHub name
    description: null  # Use GitHub description
    techTags: null  # Use GitHub languages
    screenshots:
      - /images/portfolio/crm-dashboard.webp
    caseStudySlug: project-crm  # Links to Markdown case study

  - slug: k8s-platform
    repo: synctexts/k8s-platform
    title: "High-Availability Microservices"
    screenshots: []
    caseStudySlug: project-infra
```

### Team YAML Structure
```yaml
# src/data/team.yaml
- id: john-doe
  name: "John Doe"
  role: "Full-Stack Engineer"
  bio: "10+ years building scalable web applications."
  photo: "/images/team/john.webp"
  order: 1

- id: jane-smith
  name: "Jane Smith"
  role: "DevOps Lead"
  bio: "Infrastructure specialist focused on Kubernetes and CI/CD."
  photo: "/images/team/jane.webp"
  order: 2
```

### Shiki Configuration for Dark Theme
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://synctexts.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/` directory convention | `src/data/` or any path via loader `base` | Astro 5.0 (Dec 2024) | Content lives anywhere, loaders define location |
| `Astro.glob('*.md')` | `getCollection('blog')` via Content Layer API | Astro 5.0 | Type-safe, schema-validated, unified API |
| `getStaticPaths()` with slug param | `getStaticPaths()` with `id` param | Astro 5.0 | Entry `slug` replaced by `id` |
| Separate Prism/Shiki install | Shiki bundled and default | Astro 3.0+ | Zero-config syntax highlighting |

**Deprecated/outdated:**
- `Astro.glob()`: Use `getCollection()` instead
- `src/content/config.ts`: Now `src/content.config.ts` (at `src/` root, not inside `content/` subfolder)
- Entry `.slug` property: Now `.id` in Astro 5

## Open Questions

1. **Specific GitHub repos to showcase**
   - What we know: STATE.md notes "Specific GitHub repos to showcase must be selected before Phase 2 portfolio work"
   - What's unclear: Which repos the user wants to display
   - Recommendation: Create portfolio-config.yaml with placeholder repo slugs; user fills in actual repos before build

2. **Team member photos**
   - What we know: TEAM-01 requires photos
   - What's unclear: Whether actual team photos exist or if placeholders are needed
   - Recommendation: Use placeholder avatar images initially; structure allows easy replacement

3. **Blog content**
   - What we know: BLOG-01/02 require blog posts
   - What's unclear: Whether real blog posts exist or if sample content is needed
   - Recommendation: Create 2-3 sample blog posts demonstrating Markdown features, code blocks, and tags

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is configured") |
| Config file | none -- see Wave 0 |
| Quick run command | `npm run build` (build validates schemas + API calls) |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PORT-01 | Portfolio page shows projects | smoke | `npm run build` (validates loader runs) | N/A |
| PORT-02 | Cards show name, description, languages, date | manual-only | Visual inspection of built portfolio page | N/A |
| PORT-03 | Config file controls displayed repos | smoke | `npm run build` (loader reads config) | N/A |
| PORT-04 | Manual overrides work | smoke | `npm run build` (override merging in loader) | N/A |
| PORT-05 | Detail pages generated | smoke | `npm run build` (getStaticPaths generates pages) | N/A |
| PORT-06 | PAT not in client bundle | manual-only | Inspect `dist/` output for PAT string | N/A |
| TEAM-01 | Team profiles render | smoke | `npm run build` | N/A |
| TEAM-02 | Team data from config | smoke | `npm run build` (schema validation) | N/A |
| TEST-01 | Testimonials show on homepage | manual-only | Visual inspection | N/A |
| TEST-02 | Testimonials from config | smoke | `npm run build` (schema validation) | N/A |
| PRIC-01 | Pricing tiers display | manual-only | Visual inspection | N/A |
| PRIC-02 | Tier details present | manual-only | Visual inspection | N/A |
| PRIC-03 | Pricing from config | smoke | `npm run build` (schema validation) | N/A |
| BLOG-01 | Blog listing with metadata | manual-only | Visual inspection | N/A |
| BLOG-02 | Blog posts render from Markdown | smoke | `npm run build` | N/A |
| BLOG-03 | Syntax highlighting works | manual-only | Visual inspection of code blocks | N/A |
| BLOG-04 | Tags displayed | manual-only | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (catches schema errors, missing data, loader failures)
- **Per wave merge:** `npm run build && npm run preview` (full build + visual check)
- **Phase gate:** Successful build + all pages render correctly in preview

### Wave 0 Gaps
- [ ] `src/content.config.ts` -- content collection definitions (core infrastructure)
- [ ] `src/data/` directory -- content and config files
- [ ] `.env` file with `GITHUB_PAT` -- needed for portfolio loader
- [ ] Sample blog posts, team/testimonials/pricing YAML -- seed data

*(No test framework to install -- validation relies on Astro's build-time schema checking and `npm run build` success)*

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) - Collection definitions, loaders, querying
- [Astro Content API Reference](https://docs.astro.build/en/reference/modules/astro-content/) - getCollection, getEntry, render API
- [Astro Syntax Highlighting docs](https://docs.astro.build/en/guides/syntax-highlighting/) - Shiki configuration, themes
- [Astro 5.0 release blog](https://astro.build/blog/astro-5/) - Content Layer API changes

### Secondary (MEDIUM confidence)
- [GitHub REST API - Repositories](https://docs.github.com/en/rest/repos/repos) - GET /repos/{owner}/{repo} endpoint
- [GitHub PAT docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) - Fine-grained token permissions

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro content collections are well-documented, project already runs Astro 5.18+
- Architecture: HIGH - Content Layer API patterns verified against official docs
- Pitfalls: HIGH - Documented in official Astro docs (sort order, id requirements, etc.)
- GitHub API integration: MEDIUM - Standard REST API usage, but env var access in loaders needs build-time verification

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (Astro ecosystem stable; content collections API is mature)
