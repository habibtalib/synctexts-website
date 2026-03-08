# Codebase Concerns

**Analysis Date:** 2026-03-08

## Tech Debt

**Fake Contact Form Submission:**
- Issue: The contact form in `main.js` (lines 39-63) uses `setTimeout` to simulate an API call. Form data is never sent anywhere --- it is silently discarded after a fake "Sending..." animation.
- Files: `main.js`
- Impact: Users believe their message was sent when it was not. Every lead is lost.
- Fix approach: Integrate a real backend (e.g., Formspree, Netlify Forms, a serverless function, or a mailto: fallback). At minimum, surface a warning that the form is non-functional.

**Incomplete Task Checklist:**
- Issue: `task.md` shows UI implementation and polish tasks as unchecked (lines 14-24), despite all of those items being implemented. The task tracker is stale.
- Files: `task.md`
- Impact: Misleading for contributors; suggests work is incomplete.
- Fix approach: Update checkboxes to reflect completed state, or remove `task.md` if no longer needed.

**Planning Artifacts Committed to Repo:**
- Issue: `implementation_plan.md` and `task.md` are development-time planning documents committed alongside production code. They reference scratch paths (`/Users/habib/.gemini/antigravity/scratch/`) and contain implementation discussion, not documentation.
- Files: `implementation_plan.md`, `task.md`
- Impact: Clutters the repository root. Exposes internal tooling paths.
- Fix approach: Move to `.planning/` or remove from the repository entirely.

## Known Bugs

**Missing Favicon Asset:**
- Symptoms: Browser requests `/vite.svg` (referenced in `index.html` line 6) but the file does not exist in the project root or a `public/` directory. This produces a 404 in the browser console.
- Files: `index.html` (line 6)
- Trigger: Load any page in the browser.
- Workaround: None currently. Replace with an actual favicon file or remove the `<link>` tag.

**No Mobile Navigation:**
- Symptoms: On viewports under 600px, `.nav-links` is set to `display: none` (`style.css` line 528) with no hamburger menu or alternative navigation. Users on mobile devices have no way to navigate to sections or access the "Start Project" CTA from the navbar.
- Files: `style.css` (lines 525-528), `index.html` (lines 30-35)
- Trigger: View the site on any screen narrower than 600px.
- Workaround: Users can scroll manually to find sections, but the primary CTA button is inaccessible from the nav.

**Project "View Details" Links Go Nowhere:**
- Symptoms: All three project cards link to `href="#"` which scrolls to top of page instead of showing project details.
- Files: `index.html` (lines 102, 113, 124)
- Trigger: Click any "View Details" link in the projects section.
- Workaround: None. These are placeholder links.

## Security Considerations

**No Form Input Sanitization:**
- Risk: The contact form collects user input (name, email, message) with no client-side validation beyond the `required` attribute. If a backend is added later, unsanitized input could lead to XSS or injection vulnerabilities.
- Files: `index.html` (lines 159-169), `main.js` (lines 39-63)
- Current mitigation: The form data is never actually transmitted, so the risk is latent.
- Recommendations: When adding a backend, implement server-side sanitization. Add client-side validation patterns (e.g., email format regex). Use `textContent` instead of `innerHTML` if displaying user input.

**No Content Security Policy:**
- Risk: No CSP headers or meta tags are configured. The site loads external fonts from `fonts.googleapis.com` and `fonts.gstatic.com` without restricting other sources.
- Files: `index.html` (lines 11-15)
- Current mitigation: None.
- Recommendations: Add a `<meta http-equiv="Content-Security-Policy">` tag or configure CSP headers on the hosting platform. Restrict `font-src`, `style-src`, and `script-src` to known origins.

**No Subresource Integrity on External Resources:**
- Risk: Google Fonts CSS is loaded without SRI hashes. A compromised CDN could inject malicious styles.
- Files: `index.html` (lines 13-15)
- Current mitigation: None. Low risk given that Google Fonts is widely trusted, but best practice is to self-host fonts for a static site.
- Recommendations: Self-host the Outfit and Inter font files, or add SRI attributes to external `<link>` tags.

## Performance Bottlenecks

**Render-Blocking Google Fonts:**
- Problem: Two Google Fonts requests (`preconnect` + stylesheet) block initial render. On slow connections, users see a flash of unstyled text (FOUT) or delayed first paint.
- Files: `index.html` (lines 11-15)
- Cause: External font stylesheet loaded synchronously in `<head>`.
- Improvement path: Add `font-display: swap` (already included via `&display=swap` in the URL, which is good). Consider self-hosting fonts to eliminate the external request entirely. Use `<link rel="preload">` for the font files.

**Large Background Blur Effects:**
- Problem: `.bg-glow` elements use `filter: blur(120px)` on 500-600px elements, and `.glass-panel` uses `backdrop-filter: blur(16px)`. These are GPU-intensive on lower-end devices and can cause jank during scroll.
- Files: `style.css` (lines 78-101 for bg-glow, lines 104-112 for glass-panel)
- Cause: Multiple large blur filters composited simultaneously.
- Improvement path: Reduce blur radius or use pre-blurred background images. Consider using `will-change: transform` on glow elements. Add `@media (prefers-reduced-motion)` to disable blur on devices that request it.

## Fragile Areas

**Single-File CSS Architecture:**
- Files: `style.css` (530 lines)
- Why fragile: All styles for every section (nav, hero, services, projects, tech stack, contact, footer, animations, responsive) live in a single file with no clear separation. Adding new sections or modifying existing ones risks unintended cascade effects.
- Safe modification: Search for the section comment header (e.g., `/* Services */`, `/* Contact Form */`) before editing. Test all sections after changes.
- Test coverage: No visual regression testing. Manual browser inspection is the only verification method.

**Inline Style Manipulation in JS:**
- Files: `main.js` (lines 44-60)
- Why fragile: The form submission handler directly mutates `btn.style.opacity`, `btn.style.background`, and `btn.innerText`. These inline styles override CSS and are not reset cleanly if the user submits the form rapidly (double-click or spam).
- Safe modification: Use CSS classes (e.g., `.btn--sending`, `.btn--success`) instead of inline style manipulation. Add a debounce or disable the button during the fake submission.
- Test coverage: None.

**Hardcoded Animation Delays via CSS Custom Properties:**
- Files: `index.html` (lines 64, 69, 74, 96, 107, 118) and `main.js` (lines 24-27)
- Why fragile: Animation stagger delays are set as inline `style="--delay: 0.Xs"` in HTML, then read in JS via `getPropertyValue('--delay')`. This coupling between HTML attributes and JS behavior is implicit and undocumented. Adding a new card without the `--delay` property silently works but without stagger.
- Safe modification: Document the pattern. Consider computing delays in JS based on element index instead.

## Scaling Limits

**Static Site with No Build-Time Optimization:**
- Current capacity: Single HTML page with ~190 lines, adequate for current scope.
- Limit: Adding more sections, pages, or dynamic content will make `index.html` unwieldy. No templating, no component system, no routing.
- Scaling path: If the site grows beyond a landing page, migrate to a static site generator (Astro, 11ty) or a framework (Next.js, Nuxt). The current Vite setup supports this migration.

**No Image Optimization Pipeline:**
- Current capacity: The site currently uses no images (only emoji icons and text).
- Limit: Adding project screenshots, team photos, or case study imagery without an optimization pipeline will bloat page weight.
- Scaling path: Add `vite-plugin-imagemin` or use `<picture>` with WebP/AVIF sources when images are introduced.

## Dependencies at Risk

**Vite Version Range:**
- Risk: `package.json` specifies `"vite": "^5.0.0"` which allows any 5.x version. A breaking minor release could affect builds.
- Impact: Build failures or unexpected behavior after `npm install` on a clean environment.
- Migration plan: Pin to a specific version (e.g., `"vite": "5.0.0"`) or at least `"~5.0.0"`. The `package-lock.json` mitigates this for existing installs.

## Missing Critical Features

**No Analytics Integration:**
- Problem: The site advertises Google Analytics and GTM as core services but has no analytics tracking implemented on the site itself.
- Blocks: Cannot measure visitor engagement, conversion rates, or marketing effectiveness for the agency's own site.

**No SEO Metadata Beyond Basics:**
- Problem: Only `<title>` and a single `<meta name="description">` are present. Missing Open Graph tags, Twitter Card tags, structured data (JSON-LD), canonical URL, and sitemap.
- Files: `index.html` (lines 8-9)
- Blocks: Poor social media link previews, limited search engine visibility.

**No Accessibility (a11y) Support:**
- Problem: No ARIA labels, no skip-to-content link, no focus-visible styles, no alt text (though no images exist yet), form inputs lack associated `<label>` elements (using placeholder-only pattern which is an a11y anti-pattern).
- Files: `index.html` (lines 161-167), `style.css`
- Blocks: Site is not usable with screen readers or keyboard-only navigation.

## Test Coverage Gaps

**No Test Framework:**
- What's not tested: Everything. There are zero tests --- no unit tests, no integration tests, no E2E tests, no visual regression tests.
- Files: All (`index.html`, `main.js`, `style.css`)
- Risk: Any change can break scroll animations, form behavior, responsive layout, or visual design without detection.
- Priority: Medium. For a simple static landing page, manual testing is viable but fragile. If the site grows, add Playwright for E2E visual testing at minimum.

---

*Concerns audit: 2026-03-08*
