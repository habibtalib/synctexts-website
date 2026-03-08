# Codebase Structure

**Analysis Date:** 2026-03-08

## Directory Layout

```
synctexts-website/
├── .planning/
│   └── codebase/          # Architecture and codebase analysis docs
├── index.html             # Single-page HTML entry point (all sections)
├── main.js                # JavaScript entry point (behavior layer)
├── style.css              # Complete stylesheet (design system + components)
├── package.json           # Vite dev dependency, npm scripts
├── package-lock.json      # Lockfile
├── .gitignore             # Ignores node_modules, dist, .env, .vite, .DS_Store
├── CLAUDE.md              # Claude Code guidance file
├── implementation_plan.md # Original implementation plan
└── task.md                # Task checklist
```

**Build output (not committed):**
```
dist/                      # Vite production build output
node_modules/              # npm dependencies
```

## Directory Purposes

**Root (`/`):**
- Purpose: Everything lives at root level. No `src/` directory, no subdirectories for code.
- Contains: All source files (`index.html`, `main.js`, `style.css`), config files, documentation
- Key files: `index.html` (Vite entry), `main.js` (JS entry), `style.css` (all styles)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents used by GSD planning commands
- Contains: Markdown analysis files (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: By Claude Code mapping commands
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML entry point; contains all page markup
- `main.js`: JavaScript module entry; imports CSS, initializes all behaviors

**Configuration:**
- `package.json`: npm scripts (`dev`, `build`, `preview`) and Vite dependency
- `.gitignore`: Standard ignores for Node.js + Vite project

**Core Logic:**
- `main.js`: All JavaScript behavior (64 lines total) -- navbar scroll, reveal animations, form handler
- `style.css`: Complete design system and component styles (533 lines total)

**Documentation:**
- `CLAUDE.md`: Project overview, commands, architecture summary, design system reference
- `implementation_plan.md`: Original project plan and design decisions
- `task.md`: Implementation task checklist

**Testing:**
- No test files exist. No test framework is configured.

## Naming Conventions

**Files:**
- Lowercase with no separators: `main.js`, `style.css`, `index.html`
- Documentation files use UPPERCASE or snake_case: `CLAUDE.md`, `implementation_plan.md`, `task.md`

**CSS Classes:**
- Kebab-case throughout: `.glass-nav`, `.hero-content`, `.service-card`, `.bg-glow-1`
- BEM-like but not strict BEM: `.nav-content`, `.nav-links`, `.logo-sync`, `.logo-texts`
- Utility classes: `.container`, `.section`, `.text-gradient`, `.reveal`, `.active`
- Component classes: `.glass-panel`, `.glass-input`, `.btn`, `.btn-primary`, `.btn-lg`

**CSS Custom Properties:**
- Double-dash prefix with kebab-case: `--bg-base`, `--primary`, `--font-display`, `--glass-border`
- Grouped by concern: `--bg-*` for backgrounds, `--text-*` for text colors, `--glass-*` for glass effects

**HTML IDs:**
- Lowercase, used as anchor targets: `#services`, `#tech`, `#contact`, `#projects`
- Form element IDs: `#name`, `#email`, `#message`

**JavaScript:**
- camelCase for variables and functions: `observerOptions`, `revealElements`, `contactForm`, `originalText`
- No named functions; all logic uses arrow functions and event listeners

## Where to Add New Code

**New Page Section:**
- Add HTML markup in `index.html` between existing `<section>` blocks
- Add corresponding CSS in `style.css` following the existing section pattern (section heading, grid layout, card components)
- Add `.reveal` class to elements that should animate on scroll (automatically picked up by existing IntersectionObserver in `main.js`)
- Use `.glass-panel` class for card-style components

**New Interactive Behavior:**
- Add inside the `DOMContentLoaded` callback in `main.js`
- Follow the existing pattern: query DOM element, attach event listener, manipulate classes/styles

**New CSS Component:**
- Add to `style.css` following the existing section organization (comments separate sections)
- Use existing CSS custom properties from `:root` for colors, fonts, transitions
- Follow the `.glass-panel` pattern for new card-like components
- Add responsive overrides in the existing `@media` blocks at the bottom of the file

**New Page (if site grows beyond single page):**
- Currently not supported by the architecture. Would require either:
  - Adding Vite multi-page config and new HTML files at root
  - Migrating to a framework with routing

**New npm Dependency:**
- Add via `npm install` (devDependencies for build tools, dependencies for runtime)
- Import in `main.js` using ES module syntax

**New Static Assets (images, icons, fonts):**
- Place in root or create a `public/` directory (Vite serves `public/` as static assets at `/`)
- Reference in HTML with absolute paths from root (e.g., `/images/logo.svg`)

## Special Directories

**`node_modules/`:**
- Purpose: npm dependencies (currently only Vite)
- Generated: Yes, via `npm install`
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes, via `npm run build`
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD codebase analysis and planning documents
- Generated: By Claude Code
- Committed: Yes

---

*Structure analysis: 2026-03-08*
