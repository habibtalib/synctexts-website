# Phase 1: Foundation & Migration - Research

**Researched:** 2026-03-09
**Domain:** Astro framework migration, multi-page architecture, glassmorphism design system
**Confidence:** HIGH

## Summary

This phase migrates a vanilla HTML/CSS/JS single-page site (Vite-powered) to an Astro multi-page project. Astro 5.x has simplified hybrid rendering -- the old `output: 'hybrid'` is gone, replaced by the default `output: 'static'` which now natively supports per-route server rendering via `export const prerender = false`. Since all Phase 1 pages are static marketing pages, no adapter is needed yet (the `@astrojs/node` adapter will only be required in Phase 3 when server endpoints for form submission are added).

The existing codebase has a clean separation: CSS custom properties define the full design system, glassmorphism is achieved via `.glass-panel` class with `backdrop-filter`, and scroll animations use IntersectionObserver. All of these port directly to Astro components and layouts. Astro's View Transitions (`<ClientRouter />`) provide the smooth page navigation requested in CONTEXT.md with minimal JavaScript overhead.

**Primary recommendation:** Use Astro 5.x with default static output, `<ClientRouter />` for page transitions, a shared `BaseLayout.astro` for the shell (nav + footer + head), and split the existing CSS into a global stylesheet imported in the layout plus component-scoped styles where beneficial.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All 6 pages in main nav: Home, Portfolio, Team, Blog, Pricing, Contact
- Mobile navigation: slide-in sidebar from the right with glassmorphism panel styling
- Consistent page header across all inner pages: title + subtitle section with gradient text, same layout structure
- Homepage keeps its own distinct full hero (not the page header pattern)
- Subtle fade transition on page navigation (Astro View Transitions or CSS fade-in)
- Homepage includes: Hero, Services, Tech Stack, Portfolio preview (2-3 items), Testimonials preview (2-3 items), Contact CTA/form section
- Portfolio and testimonials previews are placeholder/skeleton in Phase 1 (real data comes in Phase 2)
- Tech stack grid: Add technology icons/logos instead of text-only items (Laravel, Flutter, K8s, etc.)

### Claude's Discretion
- Nav CTA button styling decision
- Active nav link indicator style
- Background glow behavior on inner pages
- Footer layout and content
- Hero copy refresh
- Number of service cards
- Color palette adjustments
- Glassmorphism depth variations
- Font selection
- Animation variety and micro-interactions

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Site uses Astro framework with hybrid rendering (static pages + server endpoints) | Astro 5.x default `output: 'static'` supports hybrid rendering natively. No adapter needed for Phase 1 (all static). Add `@astrojs/node` adapter in Phase 3 when server endpoints are required. |
| FOUND-02 | Multi-page structure with shared layout (Home, Portfolio, Team, Blog, Pricing, Contact) | Astro `src/pages/` directory for file-based routing, `src/layouts/BaseLayout.astro` for shared shell. Inner pages get a `PageHeader` component. |
| FOUND-03 | Sticky navigation with links to all pages and a CTA button | Port existing `.glass-nav` to a `Navigation.astro` component. Add links to all 6 pages. Existing scroll-compact behavior works via client-side script. |
| FOUND-04 | Mobile-responsive navigation (hamburger menu at small breakpoints) | Build slide-in sidebar with glassmorphism styling. Use `aria-expanded` toggle pattern from Astro docs. Script re-runs via `astro:page-load` event. |
| FOUND-05 | Existing glassmorphism design system extended consistently to all new pages | Import existing `style.css` (adapted as `global.css`) in layout. Glass tokens and utilities apply to all pages automatically. Add `PageHeader` component with `.glass-panel` + `.text-gradient`. |
| FOUND-06 | All pages fully responsive across mobile, tablet, and desktop | Existing breakpoints at 900px and 600px. Extend for new page layouts. Mobile sidebar nav replaces the current `display: none` approach. |
| FOUND-07 | Refined homepage sections (hero, services, tech stack) with improved content and polish | Migrate existing sections to Astro components. Add tech icons via Devicon SVGs. Add portfolio/testimonials preview sections as placeholders. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.x (latest 5.18.0) | Framework -- static site generation with optional SSR | Official stable release, default static mode handles hybrid rendering |
| @astrojs/node | 9.x (latest 9.5.2) | Node.js adapter for server endpoints | Only needed in Phase 3 -- install then, not now |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Devicon | CDN or inline SVGs | Technology logos/icons for tech stack grid | Tech stack section -- provides Laravel, Flutter, K8s, Docker, etc. icons |
| Google Fonts (Outfit + Inter) | CDN | Typography | Already in use -- keep loading via `<link>` in layout `<head>` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Devicon CDN | Simple Icons npm package | Devicon has better coverage for dev tools; CDN is simpler for a static site |
| Astro View Transitions | Manual CSS fade-in | View Transitions are built-in, handle back/forward nav, persist elements -- no reason to hand-roll |
| astro-navbar package | Custom hamburger component | Custom gives full control over glassmorphism sidebar aesthetic; astro-navbar is headless but adds a dependency for a simple pattern |

**Installation:**
```bash
npm create astro@latest -- --template minimal
npm install astro
```

Note: For Phase 1, no adapter is needed. The project uses default static output. The `@astrojs/node` adapter should be added in Phase 3 when server endpoints for form submission are introduced.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Navigation.astro      # Sticky nav + mobile sidebar
│   ├── Footer.astro           # Site footer
│   ├── PageHeader.astro       # Inner page title + subtitle (gradient text)
│   ├── Hero.astro             # Homepage hero section
│   ├── ServiceCard.astro      # Individual service card
│   ├── ServicesGrid.astro     # Services section wrapper
│   ├── TechGrid.astro         # Tech stack with icons
│   ├── ProjectCard.astro      # Portfolio preview card
│   ├── TestimonialCard.astro  # Testimonial preview card
│   └── BackgroundGlows.astro  # Background glow effects
├── layouts/
│   └── BaseLayout.astro       # <html>, <head>, nav, footer, View Transitions
├── pages/
│   ├── index.astro            # Homepage (hero, services, tech, previews, contact CTA)
│   ├── portfolio.astro        # Placeholder for Phase 2
│   ├── team.astro             # Placeholder for Phase 2
│   ├── blog.astro             # Placeholder for Phase 2
│   ├── pricing.astro          # Placeholder for Phase 2
│   └── contact.astro          # Contact form (simulated, backend in Phase 3)
├── styles/
│   └── global.css             # Migrated from style.css -- design tokens + utilities
├── scripts/
│   └── animations.js          # IntersectionObserver reveal logic (shared)
public/
├── fonts/                     # If self-hosting fonts later
├── favicon.svg
└── robots.txt
astro.config.mjs               # Minimal config, no adapter yet
```

### Pattern 1: BaseLayout with View Transitions
**What:** Single layout wrapping all pages with consistent head, nav, footer, and View Transitions
**When to use:** Every page
**Example:**
```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
import Navigation from '../components/Navigation.astro';
import Footer from '../components/Footer.astro';
import BackgroundGlows from '../components/BackgroundGlows.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'SyncTexts - Premium Web & DevOps Agency' } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <title>{title} | SyncTexts</title>
  <meta name="description" content={description} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <ClientRouter />
</head>
<body>
  <BackgroundGlows />
  <Navigation />
  <main>
    <slot />
  </main>
  <Footer />
</body>
</html>
```
Source: [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/), [Astro Layouts docs](https://docs.astro.build/en/basics/layouts/)

### Pattern 2: Mobile Sidebar Navigation with Glassmorphism
**What:** Slide-in sidebar from right side, using `aria-expanded` for accessibility, glassmorphism panel styling
**When to use:** Navigation component at mobile breakpoints (under 600px or 768px)
**Example:**
```astro
---
// src/components/Navigation.astro
const currentPath = Astro.url.pathname;
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/team', label: 'Team' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];
---
<nav class="glass-nav">
  <div class="container nav-content">
    <a href="/" class="logo">
      <span class="logo-sync">Sync</span><span class="logo-texts">Texts</span>
      <span class="logo-dot">.</span>
    </a>
    <div class="nav-links-desktop">
      {navLinks.map(link => (
        <a href={link.href} class:list={[{ active: currentPath === link.href }]}>
          {link.label}
        </a>
      ))}
      <a href="/contact" class="btn btn-primary">Start Project</a>
    </div>
    <button class="hamburger" aria-expanded="false" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- Mobile Sidebar -->
<div class="mobile-sidebar glass-panel" aria-hidden="true">
  <div class="sidebar-content">
    {navLinks.map(link => (
      <a href={link.href} class:list={['sidebar-link', { active: currentPath === link.href }]}>
        {link.label}
      </a>
    ))}
    <a href="/contact" class="btn btn-primary">Start Project</a>
  </div>
</div>
<div class="sidebar-overlay" aria-hidden="true"></div>

<script>
  document.addEventListener('astro:page-load', () => {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.mobile-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
      const isOpen = hamburger?.getAttribute('aria-expanded') === 'true';
      hamburger?.setAttribute('aria-expanded', String(!isOpen));
      sidebar?.setAttribute('aria-hidden', String(isOpen));
      overlay?.setAttribute('aria-hidden', String(isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    }

    hamburger?.addEventListener('click', toggleSidebar);
    overlay?.addEventListener('click', toggleSidebar);
  });
</script>
```
Source: [Astro tutorial -- scripts](https://docs.astro.build/en/tutorial/3-components/4/)

### Pattern 3: PageHeader Component for Inner Pages
**What:** Consistent header with gradient title + subtitle for all non-homepage pages
**When to use:** Portfolio, Team, Blog, Pricing, Contact pages
**Example:**
```astro
---
// src/components/PageHeader.astro
interface Props {
  title: string;
  subtitle?: string;
}
const { title, subtitle } = Astro.props;
---
<section class="page-header">
  <div class="container">
    <h1 class="text-gradient">{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </div>
</section>

<style>
  .page-header {
    padding: 10rem 0 4rem;
    text-align: center;
  }
  .page-header h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    margin-bottom: 1rem;
  }
  .page-header p {
    color: var(--text-secondary);
    font-size: 1.15rem;
    max-width: 600px;
    margin: 0 auto;
  }
</style>
```

### Pattern 4: Script Re-execution with View Transitions
**What:** Scripts must use `astro:page-load` instead of `DOMContentLoaded` to work across View Transition navigations
**When to use:** All client-side scripts (nav scroll, reveal animations, hamburger toggle)
**Critical detail:** Bundled module scripts only execute once. Use `astro:page-load` lifecycle event for code that must run on every navigation. Use `data-astro-rerun` attribute on inline scripts if needed.
**Example:**
```astro
<script>
  document.addEventListener('astro:page-load', () => {
    // This runs on initial load AND after every View Transition navigation
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
      nav?.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Re-init IntersectionObserver for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.style.getPropertyValue('--delay');
          if (delay) entry.target.style.transitionDelay = delay;
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  });
</script>
```
Source: [Astro View Transitions docs -- lifecycle events](https://docs.astro.build/en/guides/view-transitions/)

### Anti-Patterns to Avoid
- **Using `DOMContentLoaded` with View Transitions:** Scripts will not re-run on page navigation. Always use `astro:page-load` event instead.
- **Importing CSS in multiple components:** Import global CSS once in the layout, not in individual pages. Component-scoped `<style>` tags are fine for component-specific styles.
- **Using `output: 'hybrid'` in astro.config:** This was removed in Astro 5. Use default `output: 'static'` -- it now supports per-route `prerender = false` natively.
- **Adding `@astrojs/node` adapter prematurely:** Not needed until Phase 3 when server endpoints exist. Adding it now would require a running Node server to serve static pages unnecessarily.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page transitions | Custom AJAX page loader | Astro `<ClientRouter />` View Transitions | Handles browser history, fallbacks, scroll position, accessibility. Custom solutions break back/forward navigation. |
| File-based routing | Custom router / SPA hash routing | Astro `src/pages/` directory | Astro generates routes from file structure automatically. Zero config. |
| CSS scoping | BEM naming or CSS modules manually | Astro `<style>` tags (auto-scoped) | Component styles are scoped automatically. Use `is:global` when intentional. |
| Tech stack icons | Download individual SVGs manually | Devicon CDN or SVG set | Maintained icon set with 700+ dev tool icons, consistent sizing, multiple styles. |
| Active nav link detection | Manual URL comparison in JS | `Astro.url.pathname` in component frontmatter | Server-side, no client JS needed, works with View Transitions. |

**Key insight:** Astro's built-in features (View Transitions, file routing, scoped styles, frontmatter data) eliminate most "plumbing" work. The migration effort is primarily restructuring existing HTML/CSS into components, not writing new infrastructure.

## Common Pitfalls

### Pitfall 1: Scripts Not Running After Navigation
**What goes wrong:** JavaScript behaviors (scroll animations, nav effects) stop working after navigating to a new page
**Why it happens:** With View Transitions, bundled module scripts execute only once. `DOMContentLoaded` never fires again.
**How to avoid:** Use `document.addEventListener('astro:page-load', () => { ... })` for all client-side initialization
**Warning signs:** Features work on first page load but break after clicking a nav link

### Pitfall 2: Scroll Position and Reveal Animations
**What goes wrong:** Reveal animations don't trigger on new pages, or elements appear already revealed
**Why it happens:** IntersectionObserver instances from previous pages are not cleaned up, or `.active` class persists through transitions
**How to avoid:** Re-initialize observers in `astro:page-load`. Ensure `.reveal` elements start without `.active` class in markup.
**Warning signs:** Elements flash or appear without animation on navigated-to pages

### Pitfall 3: Mobile Sidebar State Persisting
**What goes wrong:** Sidebar stays open when navigating to a new page via a sidebar link
**Why it happens:** View Transitions preserve DOM state. The sidebar's `aria-expanded=true` state persists.
**How to avoid:** Close the sidebar in the `astro:before-preparation` or `astro:after-swap` lifecycle event
**Warning signs:** Sidebar visually stays open, body scroll remains locked after navigation

### Pitfall 4: CSS Import Order Conflicts
**What goes wrong:** Component-scoped styles unexpectedly overridden by global styles, or vice versa
**Why it happens:** CSS import order in Astro can differ between dev and build modes
**How to avoid:** Import global CSS at the top of the layout frontmatter. Use component `<style>` tags for component-specific overrides. Rely on specificity, not import order.
**Warning signs:** Styles look different in dev vs production build

### Pitfall 5: Backdrop-filter Not Rendering in Some Contexts
**What goes wrong:** Glassmorphism blur effect disappears on certain elements
**Why it happens:** `backdrop-filter` requires the element to have a non-fully-opaque background and no ancestor with `overflow: hidden` clipping the stacking context
**How to avoid:** Ensure glass panels have `rgba()` backgrounds (not solid). Check parent elements for `overflow: hidden`. Include `-webkit-backdrop-filter` for Safari.
**Warning signs:** Cards appear as flat dark panels without blur effect

## Code Examples

### Astro Config (Phase 1 -- Static Only)
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Default output is 'static' -- all pages prerendered
  // No adapter needed until Phase 3
  site: 'https://synctexts.com',
});
```
Source: [Astro Configuration docs](https://docs.astro.build/en/guides/configuring-astro/)

### Global CSS Import in Layout
```astro
---
// In BaseLayout.astro frontmatter
import '../styles/global.css';
---
```
Source: [Astro Styling docs](https://docs.astro.build/en/guides/styling/)

### Tech Stack Item with Devicon
```astro
---
// src/components/TechGrid.astro
const technologies = [
  { name: 'Laravel', icon: 'laravel' },
  { name: 'FilamentPHP', icon: 'php' },
  { name: 'Flutter', icon: 'flutter' },
  { name: 'Kubernetes', icon: 'kubernetes' },
  { name: 'Terraform', icon: 'terraform' },
  { name: 'Google Analytics', icon: 'google' },
  { name: 'Docker', icon: 'docker' },
];
---
<section id="tech" class="tech-stack section full-width">
  <div class="container">
    <div class="section-heading reveal">
      <h2>Our <span class="text-gradient">Technology Arsenal</span></h2>
      <p>We use the best tools for the job.</p>
    </div>
    <div class="tech-grid reveal">
      {technologies.map(tech => (
        <div class="tech-item glass-panel">
          <img
            src={`https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${tech.icon}/${tech.icon}-original.svg`}
            alt={tech.name}
            width="40"
            height="40"
          />
          <span>{tech.name}</span>
        </div>
      ))}
    </div>
  </div>
</section>
```
Source: [Devicon GitHub](https://github.com/devicons/devicon)

### Placeholder Page Pattern
```astro
---
// src/pages/portfolio.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHeader from '../components/PageHeader.astro';
---
<BaseLayout title="Portfolio" description="Our featured projects and case studies">
  <PageHeader title="Portfolio" subtitle="A selection of our finest work" />
  <section class="container section">
    <p class="coming-soon">Full portfolio coming soon. Check back for detailed case studies.</p>
  </section>
</BaseLayout>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output: 'hybrid'` config | `output: 'static'` (default) with per-route `prerender = false` | Astro 5.0 (Dec 2024) | No config change needed for hybrid behavior; just add adapter + `prerender = false` on specific routes |
| `<ViewTransitions />` component | `<ClientRouter />` component | Astro 5.0 (Dec 2024) | Renamed component; same import path `astro:transitions` |
| Separate CSS files linked in HTML | Frontmatter `import '../styles/global.css'` | Astro standard | Astro handles bundling and optimization automatically |

**Deprecated/outdated:**
- `output: 'hybrid'` -- removed in Astro 5, use default `output: 'static'` instead
- `<ViewTransitions />` -- renamed to `<ClientRouter />` in Astro 5
- Vite as the direct build tool -- Astro uses Vite internally, but you configure through `astro.config.mjs`, not `vite.config.js`

## Open Questions

1. **Devicon icon availability for all listed technologies**
   - What we know: Devicon has icons for Laravel, Flutter, Kubernetes, Docker, Terraform, Google (for Analytics). FilamentPHP specifically may not have a Devicon entry.
   - What's unclear: Exact icon slugs for GTM and FilamentPHP
   - Recommendation: During implementation, check [devicon.dev](https://devicon.dev/) for exact slugs. Fall back to Simple Icons or inline SVGs for any missing icons.

2. **Exact Astro 5.x version to pin**
   - What we know: Latest is 5.18.0 as of March 2026
   - What's unclear: Whether to pin exact version or use caret range
   - Recommendation: Use `astro@^5.0.0` to get patch updates automatically. The 5.x API is stable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (no test framework in project) |
| Config file | none -- see Wave 0 |
| Quick run command | `npm run build` (validates all pages compile) |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Site runs as Astro project, pages load as pre-rendered HTML | smoke | `npm run build` (succeeds = pages generate) | N/A -- build output |
| FOUND-02 | Multi-page routes exist (Home, Portfolio, Team, Blog, Pricing, Contact) | smoke | `npm run build && ls dist/index.html dist/portfolio/index.html dist/team/index.html dist/blog/index.html dist/pricing/index.html dist/contact/index.html` | N/A -- build output |
| FOUND-03 | Sticky nav with links to all pages and CTA | manual-only | Visual inspection in browser | N/A |
| FOUND-04 | Mobile hamburger menu works | manual-only | Visual inspection at mobile viewport | N/A |
| FOUND-05 | Glassmorphism consistent across pages | manual-only | Visual inspection across all pages | N/A |
| FOUND-06 | Responsive across mobile/tablet/desktop | manual-only | Visual inspection at 375px, 768px, 1200px widths | N/A |
| FOUND-07 | Homepage sections migrated and refined | smoke | `npm run build && grep -l "Services\|Tech Stack\|Portfolio" dist/index.html` | N/A -- build output |

### Sampling Rate
- **Per task commit:** `npm run build` (confirms no compilation errors)
- **Per wave merge:** `npm run build && npm run preview` (full build + visual check)
- **Phase gate:** Full build succeeds, all 6 routes generate HTML files, visual review of all pages at 3 viewport widths

### Wave 0 Gaps
- [ ] Astro project initialization (`npm create astro@latest`)
- [ ] Verify build succeeds with all 6 pages generating to `dist/`
- [ ] No automated UI test framework needed for Phase 1 -- all visual requirements verified via build success + manual inspection

## Sources

### Primary (HIGH confidence)
- [Astro On-demand Rendering docs](https://docs.astro.build/en/guides/on-demand-rendering/) -- hybrid rendering, adapter requirements, prerender configuration
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) -- `<ClientRouter />`, lifecycle events, transition directives
- [Astro Project Structure docs](https://docs.astro.build/en/basics/project-structure/) -- directory conventions, src/pages requirement
- [Astro v5 Upgrade Guide](https://docs.astro.build/en/guides/upgrade-to/v5/) -- output mode changes, `<ViewTransitions>` renamed to `<ClientRouter />`
- [Astro Styling docs](https://docs.astro.build/en/guides/styling/) -- global vs scoped styles, import patterns
- [Astro Tutorial: Scripts](https://docs.astro.build/en/tutorial/3-components/4/) -- hamburger menu pattern, client-side JavaScript

### Secondary (MEDIUM confidence)
- [Devicon GitHub](https://github.com/devicons/devicon) -- technology icon library, CDN usage
- [npm: astro](https://www.npmjs.com/package/astro) -- current version 5.18.0
- [npm: @astrojs/node](https://www.npmjs.com/package/@astrojs/node) -- current version 9.5.2

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Astro 5.x docs verified, output modes confirmed, adapter requirements clear
- Architecture: HIGH -- project structure follows Astro conventions, migration path from vanilla HTML is well-documented
- Pitfalls: HIGH -- View Transition script re-execution is documented in official docs, backdrop-filter issues are well-known CSS behavior

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (Astro 5.x API is stable)
