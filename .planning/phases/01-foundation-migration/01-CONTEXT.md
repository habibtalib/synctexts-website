# Phase 1: Foundation & Migration - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the existing single-page vanilla HTML/CSS/JS site to an Astro multi-page project with hybrid rendering. Establish shared layout shell, responsive navigation with mobile hamburger menu, and extend the glassmorphism design system consistently across all page routes. Refine the homepage sections with improved content and polish. All content pages (blog, portfolio, team, pricing, testimonials) are scaffolded as empty/placeholder pages — their actual content is Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Navigation
- All 6 pages in main nav: Home, Portfolio, Team, Blog, Pricing, Contact
- Mobile navigation: slide-in sidebar from the right with glassmorphism panel styling
- Active page indicator: Claude's discretion (color change, underline, or both)
- CTA button in nav: Claude's discretion on whether to keep a highlighted "Start Project" / "Contact Us" button vs equal-weight links

### Page Layout & Shell
- Consistent page header across all inner pages: title + subtitle section with gradient text, same layout structure
- Homepage keeps its own distinct full hero (not the page header pattern)
- Subtle fade transition on page navigation (Astro View Transitions or CSS fade-in)
- Background glows: Claude's discretion on how they adapt to inner pages
- Footer design: Claude's discretion (can expand from current minimal to multi-column if it fits)

### Homepage Sections
- Homepage includes: Hero, Services, Tech Stack, Portfolio preview (2-3 items), Testimonials preview (2-3 items), Contact CTA/form section
- Portfolio and testimonials previews are placeholder/skeleton in Phase 1 (real data comes in Phase 2)
- Hero copy: Claude's discretion on whether to refresh messaging
- Services cards: Claude's discretion on keeping 3 or expanding to 4-6
- Tech stack grid: Add technology icons/logos instead of text-only items (Laravel, Flutter, K8s, etc.)

### Design System
- Colors: Claude's discretion on palette adjustments for the expanded site (current indigo/pink/dark base is the starting point)
- Glassmorphism depth: Claude's discretion on whether to introduce depth variations (e.g., subtle, medium, prominent glass panels)
- Typography: Claude's discretion on keeping Outfit/Inter or adjusting
- Animations: Claude's discretion on animation variety and micro-interactions (current fade-up reveal is the baseline)

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

</decisions>

<specifics>
## Specific Ideas

- Tech stack items should show actual technology logos/icons, not just text labels
- Mobile nav should be a slide-in sidebar with the same glassmorphism aesthetic (frosted glass panel)
- Page transitions should feel smooth but not slow — subtle fade, not elaborate animations
- Homepage should have preview sections for portfolio and testimonials that link to their full pages

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.glass-panel` class: Backdrop blur + semi-transparent bg + border. Apply to sidebar, page headers, cards on all pages.
- `.glass-nav` with `.scrolled` state: Navbar with scroll-triggered compact mode. Port directly to Astro layout.
- `.reveal` + IntersectionObserver pattern: Scroll animations. Reuse across all new pages.
- `.text-gradient` utility: Gradient text effect. Use in page headers.
- `.btn` / `.btn-primary` / `.btn-secondary`: Button system. Reuse throughout.
- CSS custom properties in `:root`: Full design token system ready to extend.

### Established Patterns
- Desktop-first responsive with `max-width` breakpoints at 900px and 600px
- CSS Grid for card layouts: `repeat(auto-fit, minmax(Xpx, 1fr))`
- Flexbox for nav and inline layouts
- Kebab-case CSS classes, camelCase JS variables
- 2-space indentation, single quotes, semicolons in JS
- HTML section comments (`<!-- Section Name -->`) and CSS section comments (`/* Section Name */`)

### Integration Points
- `index.html` sections → split into Astro components/pages
- `style.css` → can be imported globally or split into component-scoped styles
- `main.js` → behaviors move into Astro `<script>` tags or shared scripts
- Google Fonts links → move to Astro `<head>` via layout component

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-migration*
*Context gathered: 2026-03-09*
