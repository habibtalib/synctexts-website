# Technology Stack

**Analysis Date:** 2026-03-08

## Languages

**Primary:**
- HTML5 - Page structure in `index.html`
- CSS3 - Styling and design system in `style.css`
- JavaScript (ES Modules) - Client-side interactivity in `main.js`

**Secondary:**
- None

## Runtime

**Environment:**
- Node.js (required for Vite dev server and build tooling)
- Browser (runtime target for the static site)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- None (vanilla HTML/CSS/JS, no frontend framework)

**Testing:**
- None configured

**Build/Dev:**
- Vite ^5.0.0 - Dev server with HMR and production bundler

## Key Dependencies

**Critical:**
- Vite ^5.0.0 (devDependency) - Only dependency; handles dev server, HMR, and production builds

**Infrastructure:**
- esbuild 0.21.5 - Bundled with Vite for fast transpilation (transitive dependency)
- Rollup - Bundled with Vite for production builds (transitive dependency)

**External Resources (CDN):**
- Google Fonts - Outfit (display) and Inter (body) font families loaded via `<link>` in `index.html`

## Configuration

**Environment:**
- `.env` file listed in `.gitignore` - existence noted, not currently referenced in code
- No environment variables are consumed by the application code

**Build:**
- `package.json` - Defines three scripts: `dev`, `build`, `preview`
- No `vite.config.js` or `vite.config.ts` present - uses Vite defaults
- `"type": "module"` in `package.json` enables ES module syntax

**Build Commands:**
```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js >= 12 (per esbuild engine requirement)
- npm (any modern version supporting lockfileVersion 3)
- Run `npm install` then `npm run dev`

**Production:**
- Static file hosting only (output is plain HTML/CSS/JS in `dist/`)
- No server-side runtime required
- No database required

---

*Stack analysis: 2026-03-08*
