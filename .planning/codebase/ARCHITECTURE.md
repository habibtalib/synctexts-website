# Architecture

**Analysis Date:** 2026-03-08

## Pattern Overview

**Overall:** Static Single-Page Application (SPA-like landing page)

**Key Characteristics:**
- Single HTML file with all page sections defined inline (no routing, no components)
- Vanilla CSS with a design-token system via CSS custom properties in `:root`
- Vanilla JavaScript ES module for all interactivity (no framework, no virtual DOM)
- Vite as dev server and build tool; zero runtime dependencies
- No backend; contact form submission is simulated client-side

## Layers

**Markup (Content & Structure):**
- Purpose: Defines all visible content and semantic page structure
- Location: `index.html`
- Contains: Navigation, hero, services, projects, tech stack, contact form, footer -- all as `<section>` elements with anchor IDs (`#services`, `#tech`, `#contact`, `#projects`)
- Depends on: `style.css` (loaded via Vite import in `main.js`), `main.js` (loaded as ES module at bottom of `<body>`)
- Used by: Browser directly; Vite dev server serves it as the entry HTML

**Styles (Design System & Presentation):**
- Purpose: Full visual design system and responsive layout
- Location: `style.css`
- Contains: CSS custom properties (design tokens), glassmorphism utility classes, component styles, animations, responsive breakpoints
- Depends on: Google Fonts (Outfit, Inter) loaded via `<link>` in `index.html`
- Used by: Imported by `main.js` via `import './style.css'`; Vite processes it during build

**Behavior (Client-Side Interactivity):**
- Purpose: Scroll-triggered animations, navbar effects, form handling
- Location: `main.js`
- Contains: Three distinct behaviors wrapped in a single `DOMContentLoaded` listener
- Depends on: `style.css` (imported), DOM elements with specific classes (`.glass-nav`, `.reveal`, `.contact-form`)
- Used by: Loaded by `index.html` via `<script type="module" src="/main.js">`

## Data Flow

**Page Load:**

1. Browser loads `index.html` from Vite dev server (or static hosting in production)
2. `main.js` is loaded as an ES module, which imports `style.css` (Vite handles CSS injection)
3. `DOMContentLoaded` fires, initializing three behavior modules

**Scroll Animation Flow:**

1. `IntersectionObserver` is created with threshold `0.1` and bottom margin `-50px`
2. All elements with class `.reveal` are registered with the observer
3. When an element enters the viewport, its `--delay` CSS custom property is applied as `transitionDelay`, then class `active` is added
4. CSS transitions in `.reveal` / `.reveal.active` handle the opacity and translateY animation
5. Element is unobserved after reveal (one-shot animation)

**Navbar Scroll Effect:**

1. `scroll` event listener checks `window.scrollY > 50`
2. Toggles `.scrolled` class on `.glass-nav` element
3. CSS handles the visual change (tighter padding, darker background, box-shadow)

**Contact Form Submission:**

1. Form `submit` event is intercepted with `preventDefault()`
2. Button text changes to "Sending..." with reduced opacity
3. `setTimeout` (1500ms) simulates an API call
4. Button shows "Message Sent!" with green background, form is reset
5. After 3000ms, button reverts to original state

**State Management:**
- No application state. All state is DOM-based (CSS classes toggled by JS).
- No data stores, no state management libraries, no local storage usage.

## Key Abstractions

**Design Token System:**
- Purpose: Centralized visual configuration for the entire site
- Location: `style.css` lines 1-23 (`:root` block)
- Pattern: CSS custom properties (`--bg-base`, `--primary`, `--secondary`, `--font-display`, `--font-body`, `--glass-border`, `--glass-shadow`, `--transition-smooth`)
- Usage: Referenced throughout `style.css` via `var()` function

**Glassmorphism Component Pattern:**
- Purpose: Reusable frosted-glass card appearance
- Location: `style.css` lines 104-118 (`.glass-panel` class)
- Pattern: Apply `.glass-panel` class to any element for backdrop blur, semi-transparent background, subtle border, and hover lift effect
- Examples: Service cards, project cards, contact wrapper, tech items in `index.html`

**Reveal Animation Pattern:**
- Purpose: Scroll-triggered entrance animations with staggered delays
- Location: CSS in `style.css` lines 497-506, JS in `main.js` lines 15-36
- Pattern: Add `.reveal` class to any element. Optionally set `style="--delay: 0.3s"` for stagger. JS adds `.active` class when element enters viewport.
- Examples: Section headings, service cards, project cards, tech grid in `index.html`

## Entry Points

**HTML Entry (Vite):**
- Location: `index.html`
- Triggers: Vite dev server serves this as the root; `vite build` uses it as the entry point
- Responsibilities: Defines all page content, loads fonts, references `main.js`

**JavaScript Entry:**
- Location: `main.js`
- Triggers: Loaded by `index.html` via `<script type="module">`
- Responsibilities: Imports CSS, initializes navbar scroll behavior, scroll-reveal animations, and contact form handler

## Error Handling

**Strategy:** Minimal -- no structured error handling exists

**Patterns:**
- Contact form uses `preventDefault()` but has no validation beyond HTML `required` attributes
- No try/catch blocks anywhere in `main.js`
- No error boundaries, no fallback UI, no error logging
- `if (contactForm)` null check is the only defensive code in `main.js` line 40

## Cross-Cutting Concerns

**Logging:** None. No console.log or logging framework.
**Validation:** HTML5 `required` attributes on form inputs only. No JS validation.
**Authentication:** Not applicable -- static marketing site.
**SEO:** Basic meta tags (`description`, `viewport`, `charset`) in `index.html` `<head>`. Semantic HTML elements used throughout.
**Accessibility:** No ARIA attributes. Nav links hidden at 600px breakpoint with no mobile menu alternative.
**Performance:** Google Fonts loaded with `preconnect`. CSS animations use `transform` and `opacity` (GPU-accelerated). IntersectionObserver used instead of scroll event for reveal animations.

---

*Architecture analysis: 2026-03-08*
