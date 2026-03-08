# Coding Conventions

**Analysis Date:** 2026-03-08

## Naming Patterns

**Files:**
- Lowercase, single-word names: `main.js`, `style.css`, `index.html`
- No multi-word files exist yet. If adding new JS files, use kebab-case (consistent with web conventions and the existing lowercase pattern).

**Functions:**
- No named functions are exported. All logic lives inside a single `DOMContentLoaded` callback in `main.js`.
- Use camelCase for variables and any future function names (observed: `observerOptions`, `revealElements`, `contactForm`, `originalText`).

**Variables:**
- camelCase throughout: `observerOptions`, `revealElements`, `contactForm`
- DOM element references use descriptive nouns: `nav`, `btn`, `contactForm`

**CSS Classes:**
- kebab-case for all classes: `glass-nav`, `hero-content`, `btn-primary`, `service-card`
- BEM-like flat structure (no nesting conventions like `__` or `--` modifiers), just hyphen-separated descriptors
- Prefix patterns:
  - `bg-` for background elements: `bg-glow`, `bg-glow-1`
  - `btn-` for button variants: `btn-primary`, `btn-secondary`, `btn-lg`, `btn-block`
  - `logo-` for logo parts: `logo-sync`, `logo-texts`, `logo-dot`
  - `glass-` for glassmorphism elements: `glass-nav`, `glass-panel`, `glass-input`

**CSS Custom Properties:**
- Prefixed by category in `:root`: `--bg-*`, `--text-*`, `--glass-*`, `--font-*`
- Use descriptive names: `--bg-base`, `--text-primary`, `--primary-hover`

## Code Style

**Formatting:**
- No formatter (Prettier, etc.) is configured.
- 2-space indentation in HTML and JS.
- 2-space indentation in CSS.
- Single quotes in JavaScript strings.
- Semicolons used in JavaScript.
- Trailing commas not used.

**Linting:**
- No linter (ESLint, etc.) is configured.

**General Rules (inferred from existing code):**
- Use `const` for all variables unless reassignment is needed.
- Use arrow functions for callbacks and event handlers.
- Use template literals sparingly (none currently used; string concatenation not observed either).

## Import Organization

**Order:**
1. CSS imports first: `import './style.css';`
2. No other imports exist. If adding dependencies, follow: external packages, then local modules.

**Path Aliases:**
- None configured. Use relative paths.

**Module System:**
- ES modules (`"type": "module"` in `package.json`).
- Script loaded with `<script type="module" src="/main.js">` in HTML.

## Error Handling

**Patterns:**
- Defensive null checks before accessing DOM elements: `if (contactForm) { ... }`
- No try/catch blocks (no async operations or API calls yet).
- When adding error handling, use the same guard-clause pattern: check for element existence before attaching listeners.

## Logging

**Framework:** None (no `console.log` statements in codebase).

**Patterns:**
- No logging is used. Keep production code free of console statements.

## Comments

**When to Comment:**
- Numbered section comments to delineate logical blocks in `main.js`: `// 1. Navbar Scroll Effect`, `// 2. Intersection Observer...`, `// 3. Simple Form Handling`
- Inline comments for non-obvious behavior: `// Optional: Stop observing once revealed`
- HTML section comments to mark page regions: `<!-- Navigation -->`, `<!-- Hero Section -->`
- CSS section comments using `/* Section Name */` pattern: `/* Navigation */`, `/* Hero Section */`

**JSDoc/TSDoc:**
- Not used. This is a vanilla JS project with no TypeScript.

## Function Design

**Size:** All JS logic is contained in a single `DOMContentLoaded` handler (~60 lines). For new features, extract into separate functions or modules if exceeding ~30 lines.

**Parameters:** Not applicable (no exported functions yet).

**Return Values:** Not applicable.

## Module Design

**Exports:** No exports. `main.js` is a side-effect-only entry point.

**Barrel Files:** Not used.

**Adding New Modules:**
- Create new `.js` files at root level (same directory as `main.js`).
- Import them in `main.js` using ES module syntax: `import './new-module.js';`

## CSS Architecture

**Design System:**
- All design tokens defined as CSS custom properties in `:root` of `style.css`.
- Use `var(--token-name)` references instead of hardcoded values.
- Exception: some hex values appear inline (e.g., `#10b981` for success green in `main.js`, `#64748b` in CSS). New code should define tokens in `:root` instead.

**Layout Patterns:**
- Use `.container` class for max-width centered content (1200px).
- Use CSS Grid for card layouts: `grid-template-columns: repeat(auto-fit, minmax(Xpx, 1fr))`.
- Use Flexbox for inline layouts (nav, hero CTA, footer).

**Responsive Design:**
- Mobile-first is NOT used. Desktop-first with `max-width` media queries.
- Breakpoints: 900px (tablet), 600px (mobile).
- At 600px, nav links are hidden entirely (no hamburger menu implemented).

**Animation Patterns:**
- Scroll-reveal: Add `reveal` class to element, IntersectionObserver adds `active` class.
- Custom delays via `--delay` CSS custom property on elements: `style="--delay: 0.1s"`.
- Use `var(--transition-smooth)` for hover transitions.
- Keyframe animations defined at bottom of `style.css`.

---

*Convention analysis: 2026-03-08*
