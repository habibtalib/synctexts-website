# Phase 8: Multi-Step Form Frontend - Research

**Researched:** 2026-03-16
**Domain:** Vanilla TypeScript multi-step form wizard (Astro + CSS transitions + sessionStorage)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Step Flow**
- 3 steps: Step 1 (Service Selection) → Step 2 (Project Details) → Step 3 (Contact Info)
- No service-specific branch questions — all three services share the same Step 2 (budget + timeline dropdowns)
- Step 2 fields (budget, timeline) are optional — visitor can advance without selecting them (API handles NULL gracefully, lead just scores lower)
- Service selection on Step 1 auto-advances to Step 2 (no "Next" button needed for Step 1)

**Step Indicator**
- Numbered dots (1, 2, 3) connected by lines with labels below: "Service", "Details", "Contact"
- Current step: indigo filled dot. Completed steps: checkmark icon. Pending: outline dot
- Completed step dots are clickable — visitor can jump back to any completed step with data preserved
- Connecting line animates fill with indigo color (~300ms, synced with step slide transition)
- Step indicator hidden on the confirmation/success screen

**Form Field Presentation**
- Step 1: Three clickable glassmorphism cards with icon, service name, and 1-line description. Cards have indigo glow border + subtle scale-up (1.02) on hover. Selected card gets solid indigo border
- Step 2: Styled glass select dropdowns (`.glass-input` style) for budget and timeline. Labels above each field. Placeholder text: "Select budget range...", "Select timeline..."
- Step 3: Name (required), Email (required), Company (optional), Message (required) — same fields as current form, same validation rules

**Human-Friendly Labels**
- Services: "Web Development", "DevOps", "Analytics"
- Budget: "Under $5K", "$5K – $15K", "$15K – $50K", "$50K+"
- Timeline: "ASAP", "1–3 Months", "3–6 Months", "Just Exploring"
- Enum values sent to API: `web_dev`, `devops`, `analytics`, `under_5k`, `5k_15k`, `15k_50k`, `50k_plus`, `asap`, `1_3_months`, `3_6_months`, `exploring`

**Transitions and Animations**
- Step transitions: horizontal slide (next step slides in from right, previous slides in from left). Duration ~300ms ease
- `prefers-reduced-motion`: all animations become instant state changes (accessibility fallback)
- Service cards: glow + scale hover effect matching existing ServiceCard/ProjectCard patterns

**State Persistence (FORM-06)**
- sessionStorage stores current step and all entered field values
- Page refresh restores visitor to their current step with all data intact
- sessionStorage cleared immediately on successful submission

**Post-Submission**
- Form area replaced with success panel: green checkmark icon, "Message Sent!" heading, "We'll get back to you within 24 hours." text
- Prominent "Book a Discovery Call" button (`.btn-primary` style) links to external Cal.com booking page in new tab
- Cal.com URL configured via environment variable or constant (Phase 9 will embed it directly)
- Step indicator hidden on success screen

**Inline Validation (FORM-05)**
- Per-step validation: cannot advance to next step with invalid/missing required fields
- Inline error messages below each field (same pattern as current form: `.field-error` spans)
- Step 3 validation unchanged from current: name ≥ 2 chars, valid email, message ≥ 10 chars

**Preserved Behaviors**
- Honeypot field persists (hidden, same mechanism)
- GTM `contact_form_submit` dataLayer event fires on success/error (same tracking)
- `astro:page-load` event listener pattern for View Transition compatibility

### Claude's Discretion
- Exact CSS for step indicator (glass background, dot sizing, line thickness)
- Service card icon choices (emoji or SVG)
- Service card description copy
- Exact slide animation easing curve
- Form layout within the existing `.contact-wrapper` container
- Whether to use CSS transitions or JS-driven animations for step slides
- Cal.com URL configuration approach (env var vs constant)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORM-01 | User can select a service type (Web Dev, DevOps, Analytics) as the first step | Clickable service cards in Step 1 auto-advancing to Step 2; enum values from `ALLOWED_SERVICE_TYPES` in `validation.ts` |
| FORM-02 | User sees service-specific questions after selecting a service type | Decided: all services share same Step 2 (budget + timeline) — no branching logic required |
| FORM-03 | User sees a progress indicator showing current step and total steps | Step indicator: numbered dots + connecting line; hidden on success screen |
| FORM-04 | User can navigate back to previous steps without losing entered data | Completed step dots are clickable; form state machine tracks entered values in sessionStorage |
| FORM-05 | User sees inline validation errors per step before advancing | Per-step validation using existing `validateField`/`showFieldError` patterns; Step 1 required, Step 2 optional, Step 3 same rules as current |
| FORM-06 | User's form progress persists across page refresh via sessionStorage | sessionStorage key stores `{step, service_type, budget, timeline, name, email, company, message}`; hydrated on `astro:page-load` |
| FORM-07 | User sees animated step transitions consistent with the existing design system | Horizontal slide transitions, ~300ms ease, CSS transform, `prefers-reduced-motion` fallback |
| FORM-08 | User sees a "Book a Discovery Call" CTA after successful form submission | Success panel includes `.btn-primary` link to Cal.com URL in new tab; step indicator hidden |

</phase_requirements>

---

## Summary

This phase replaces the existing single-step `contact.astro` form with a 3-step wizard. The work is entirely front-end: HTML structure changes in `contact.astro` and a full rewrite of `contact-form.ts`. The API endpoint (`/api/contact`) is unchanged and already accepts all fields this form will send.

The primary technical challenge is the multi-step state machine: managing which step is visible, persisting all entered values across steps and page refreshes, and correctly wiring the step indicator's visual state to navigation. The secondary challenge is fitting the step indicator and three service-selection cards into the existing `.contact-wrapper` layout without breaking the responsive 900px grid collapse.

All required libraries already exist — this is a vanilla TypeScript task with no new dependencies. Enum constants (`ALLOWED_SERVICE_TYPES`, `ALLOWED_BUDGETS`, `ALLOWED_TIMELINES`) are importable from `src/lib/validation.ts` for client-side select option population, but since this is a browser script, the enum arrays should be duplicated as constants in `contact-form.ts` (same pattern as the existing `validateField` function which already mirrors server-side validation).

**Primary recommendation:** Implement as a single TypeScript state machine in `contact-form.ts` that owns step transitions, sessionStorage sync, and submission — keeping the existing function signatures (`validateField`, `showFieldError`, `showErrorSummary`) intact.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (vanilla) | project default | Form state machine, validation, submission | No new dependency; project already uses `.ts` scripts compiled by Vite |
| CSS transitions | browser native | Horizontal slide step animations | No JS animation library needed; CSS `transform: translateX` + `transition` is sufficient |
| sessionStorage | browser native | Form state persistence across refresh | Spec: sessionStorage cleared on tab close (not localStorage), per-tab isolation matches expectation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ALLOWED_SERVICE_TYPES` / `ALLOWED_BUDGETS` / `ALLOWED_TIMELINES` from `src/lib/validation.ts` | — | Enum values for selects and card data | Duplicate as constants in client script; do NOT import server file in browser bundle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions | JS animation (GSAP, anime.js) | CSS transitions are zero-dependency and sufficient for 300ms slide; JS animation adds 30–90KB |
| sessionStorage | URL params for state | URL params are shareable but expose partial form data in history; sessionStorage is private and tab-scoped |
| Inline `<script>` in `.astro` | `<script src="...ts">` | Inline scripts lose TypeScript compilation; external script file matches existing pattern |

**Installation:** No new packages required.

---

## Architecture Patterns

### File Touch Map
```
src/
├── pages/
│   └── contact.astro          # HTML structure rewrite: step indicator + 3 step panels + success panel
├── scripts/
│   └── contact-form.ts        # Full rewrite: state machine, sessionStorage, step nav, validation, submit
└── styles/
    └── global.css             # No changes needed — all new CSS goes in contact.astro <style>
```

The `contact.astro` `<style>` block is already scoped and contains all form-specific CSS (`.field-error`, `.form-errors`, `.input-error`, `.spinner`, `.success-panel`, `.success-icon`). New CSS (step indicator, service cards, slide panels) goes in the same block.

### Pattern 1: Three-Panel Visibility Toggle with CSS Classes

**What:** Each step is a `<div class="form-step">`. Only one has `data-step-active` (or `.is-active`). Transitions use CSS `transform: translateX` and `opacity`. The container clips with `overflow: hidden`.

**When to use:** Any multi-step form where all steps exist in DOM simultaneously (required for sessionStorage hydration on refresh).

**Example:**
```typescript
// Source: established pattern verified against MDN CSS transitions docs
function showStep(targetStep: number, direction: 'forward' | 'back'): void {
  const steps = document.querySelectorAll<HTMLElement>('.form-step');
  const current = document.querySelector<HTMLElement>('.form-step.is-active');
  const next = document.querySelector<HTMLElement>(`[data-step="${targetStep}"]`);

  if (!current || !next) return;

  // Set entry direction before making visible
  next.classList.add(direction === 'forward' ? 'enter-from-right' : 'enter-from-left');
  next.classList.add('is-active');

  // Trigger reflow then start transition
  next.getBoundingClientRect();
  next.classList.remove('enter-from-right', 'enter-from-left');

  current.classList.add(direction === 'forward' ? 'exit-to-left' : 'exit-to-right');
  current.addEventListener('transitionend', () => {
    current.classList.remove('is-active', 'exit-to-left', 'exit-to-right');
  }, { once: true });
}
```

**CSS companion:**
```css
.form-step {
  /* All steps share the same grid area — only .is-active is visible */
  display: none;
}
.form-step.is-active {
  display: block;
}

@media (prefers-reduced-motion: no-preference) {
  .form-step {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .form-step.enter-from-right { transform: translateX(40px); opacity: 0; }
  .form-step.enter-from-left  { transform: translateX(-40px); opacity: 0; }
  .form-step.exit-to-left     { transform: translateX(-40px); opacity: 0; }
  .form-step.exit-to-right    { transform: translateX(40px); opacity: 0; }
}
```

### Pattern 2: sessionStorage State Object

**What:** One key (`contact_form_state`) stores a JSON object with all field values and the current step number. Read on `astro:page-load`, written after every navigation and field change that would be expensive to lose.

**When to use:** Any form requiring refresh survival.

**Example:**
```typescript
// Source: MDN Web Docs — sessionStorage
const STORAGE_KEY = 'contact_form_state';

interface FormState {
  step: 1 | 2 | 3;
  service_type: string | null;
  budget: string | null;
  timeline: string | null;
  name: string;
  email: string;
  company: string;
  message: string;
}

function loadState(): FormState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState(state: FormState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or private mode — silent fail, form still works
  }
}

function clearState(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
```

### Pattern 3: Step Indicator DOM Update

**What:** The step indicator is static HTML with 3 dots and 2 connecting lines. A `updateIndicator(step: number)` function reads current state and applies classes.

**When to use:** Called after every step transition and on hydration from sessionStorage.

**Example:**
```typescript
// Source: derived from CONTEXT.md decisions
function updateIndicator(currentStep: number, completedSteps: Set<number>): void {
  for (let i = 1; i <= 3; i++) {
    const dot = document.querySelector<HTMLElement>(`[data-indicator-step="${i}"]`);
    if (!dot) continue;
    dot.classList.toggle('is-current', i === currentStep);
    dot.classList.toggle('is-complete', completedSteps.has(i));
    dot.classList.toggle('is-pending', i > currentStep && !completedSteps.has(i));

    // Completed dots are clickable back-nav targets
    if (completedSteps.has(i)) {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
    } else {
      dot.removeAttribute('role');
      dot.removeAttribute('tabindex');
    }
  }

  // Fill connecting lines up to current step
  for (let i = 1; i <= 2; i++) {
    const line = document.querySelector<HTMLElement>(`[data-indicator-line="${i}"]`);
    if (line) {
      line.classList.toggle('is-filled', currentStep > i);
    }
  }
}
```

### Pattern 4: Service Card Selection

**What:** Three `<button>` or `<div role="button">` cards. Clicking sets `service_type`, saves to sessionStorage, adds `.is-selected` border class, then auto-advances to step 2.

**When to use:** Step 1 only; replaces radio buttons with visual card affordance.

**Example:**
```typescript
// Source: derived from CONTEXT.md decisions + existing ServiceCard.astro pattern
function initServiceCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-service-value]');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Deselect all
      cards.forEach(c => c.classList.remove('is-selected'));
      // Select clicked
      card.classList.add('is-selected');
      // Save to state
      state.service_type = card.dataset.serviceValue || null;
      state.step = 2;
      saveState(state);
      // Auto-advance
      showStep(2, 'forward');
      updateIndicator(2, new Set([1]));
    });
  });
}
```

### Pattern 5: Per-Step Validation Gate

**What:** Before advancing from Step 3, validate all required fields. Step 1 gates: service_type must be set (card click is the only way forward so this is handled automatically by auto-advance). Step 2 fields are optional — no gate. Step 3: reuse existing validation functions.

**Example:**
```typescript
// Source: reuse of existing validateField / showFieldError from contact-form.ts
function validateStep3(): boolean {
  const errors = {
    name: validateField('name', (document.getElementById('name') as HTMLInputElement)?.value ?? ''),
    email: validateField('email', (document.getElementById('email') as HTMLInputElement)?.value ?? ''),
    message: validateField('message', (document.getElementById('message') as HTMLTextAreaElement)?.value ?? ''),
  };

  let hasError = false;
  for (const [fieldId, error] of Object.entries(errors)) {
    if (error) {
      showFieldError(fieldId, error);
      hasError = true;
    } else {
      showFieldError(fieldId, null);
    }
  }
  return !hasError;
}
```

### Anti-Patterns to Avoid

- **Removing steps from DOM on transition:** Breaks sessionStorage hydration. All three step panels must exist in the DOM at all times — control visibility with CSS classes only.
- **Using `localStorage` instead of `sessionStorage`:** localStorage persists across browser sessions and tabs. The requirement specifies sessionStorage (tab-scoped, clears on close).
- **Importing `src/lib/validation.ts` in the browser script:** The `validation.ts` file is a server module. Copy the enum arrays as plain constants in `contact-form.ts` (this mirrors the existing pattern where `validateField` already duplicates server logic).
- **Replacing `.contact-wrapper` innerHTML on step transition:** The current success handler replaces `wrapper.innerHTML` — this approach works for the final success state but must NOT be used for step transitions (it destroys all other steps' DOM nodes and sessionStorage hydration breaks).
- **Setting `display: none` via JS inline styles:** Use CSS class toggles instead; inline styles compete with scoped Astro CSS and make animation sequencing harder.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state persistence | Custom cookie or IndexedDB wrapper | `sessionStorage` directly | sessionStorage is synchronous, tab-scoped, and needs no abstraction for 8 fields |
| CSS slide animation | JS requestAnimationFrame loop | CSS `transition` + class swap | Zero-dependency, GPU-composited, respects `prefers-reduced-motion` natively |
| Enum label mapping | Server-side lookup | Inline constant map in `contact-form.ts` | Client script cannot import server modules; a 10-line object is the right tool |
| Step indicator | Third-party stepper library | Plain HTML + CSS | No library covers this design; a custom 3-dot indicator is 20 lines of CSS |

**Key insight:** This is a vanilla TypeScript rewrite of a small form — every abstraction adds maintenance burden with no payoff at this scale.

---

## Common Pitfalls

### Pitfall 1: Astro View Transition re-init race condition
**What goes wrong:** After a View Transition, the `astro:page-load` event fires and `initContactForm()` runs. If sessionStorage hydration sets step 2 but the DOM paint hasn't settled, the slide animation classes may interfere with the initial display state.
**Why it happens:** `astro:page-load` fires after the new page is inserted but before paint stabilization in some browsers.
**How to avoid:** In `initContactForm()`, skip all animation classes during hydration — directly set `is-active` without `enter-from-right/left` classes. Only animate on user-triggered transitions.
**Warning signs:** On refresh/navigation, form flickers to step 1 then jumps to saved step.

### Pitfall 2: `select` element styling in dark mode
**What goes wrong:** `<select>` elements ignore most CSS styling (background, border-radius) in Safari/Chrome on macOS because the OS renders the native picker.
**Why it happens:** Native `<select>` is a replaced element — `appearance: auto` defers to the OS.
**How to avoid:** Add `appearance: none; -webkit-appearance: none;` to `.glass-input` when applied to `<select>`. The arrow indicator is lost and must be replaced with a CSS background-image SVG arrow or a `::after` pseudo-element on a wrapper div.
**Warning signs:** Select field looks unstyled (white background) in Safari despite `.glass-input` class.

### Pitfall 3: sessionStorage JSON parse failure
**What goes wrong:** If the stored JSON is malformed (e.g., partial write before crash), `JSON.parse` throws and the form may fail to initialize.
**Why it happens:** Browser crash mid-write, or manually corrupted storage during development.
**How to avoid:** Always wrap `sessionStorage.getItem` + `JSON.parse` in try/catch and fall back to `defaultState()` — this is shown in the Pattern 2 example above.
**Warning signs:** Form silently fails to load in console with "SyntaxError: Unexpected token".

### Pitfall 4: `.contact-wrapper` grid breaks with added step indicator
**What goes wrong:** The current `.contact-wrapper` is `display: grid; grid-template-columns: 1fr 1fr`. Adding a full-width step indicator above the form area disrupts the two-column layout.
**Why it happens:** A child spanning only one column won't be full-width.
**How to avoid:** Wrap the step indicator in a `grid-column: 1 / -1` container so it spans both columns, or restructure `.contact-wrapper` to use a nested layout (`flex-direction: column` for the right-side form area).
**Warning signs:** Step indicator appears half-width or only above the form column.

### Pitfall 5: Completed-step dot click back-navigation losing current step's data
**What goes wrong:** Visitor fills in Step 3 fields, clicks back to Step 1, changes service. On returning to Step 3, name/email/message fields are empty.
**Why it happens:** If sessionStorage is only written on step advance (not on field input), back-navigation doesn't capture intermediate state.
**How to avoid:** Write sessionStorage on `input` and `change` events for all Step 3 fields, not just on "Submit" click. Step 2 selects should also save on `change`.
**Warning signs:** Test: fill step 3, click step 1 dot, return — step 3 fields blank.

### Pitfall 6: `transitionend` event fires multiple times
**What goes wrong:** The `transitionend` listener added to the exiting step fires once per transitioned CSS property (e.g., both `transform` and `opacity` fire separately).
**Why it happens:** `transitionend` is per-property, not per-element.
**How to avoid:** Use `{ once: true }` in `addEventListener` AND filter by `e.propertyName === 'transform'` inside the handler to avoid double-execution of cleanup code.

---

## Code Examples

### Step Indicator HTML Structure
```html
<!-- Source: decision from CONTEXT.md, standard wizard pattern -->
<div class="step-indicator" id="step-indicator" aria-label="Form progress">
  <div class="step-dot is-current" data-indicator-step="1" aria-label="Step 1: Service">
    <span class="step-dot-number">1</span>
    <span class="step-dot-check">&#10003;</span>
  </div>
  <div class="step-line" data-indicator-line="1"></div>
  <div class="step-dot is-pending" data-indicator-step="2" aria-label="Step 2: Details">
    <span class="step-dot-number">2</span>
    <span class="step-dot-check">&#10003;</span>
  </div>
  <div class="step-line" data-indicator-line="2"></div>
  <div class="step-dot is-pending" data-indicator-step="3" aria-label="Step 3: Contact">
    <span class="step-dot-number">3</span>
    <span class="step-dot-check">&#10003;</span>
  </div>
</div>
<div class="step-labels" aria-hidden="true">
  <span>Service</span>
  <span>Details</span>
  <span>Contact</span>
</div>
```

### Service Card HTML Structure (Step 1)
```html
<!-- Source: CONTEXT.md decision + existing ServiceCard.astro pattern -->
<div class="form-step is-active" data-step="1">
  <div class="service-select-grid">
    <button class="service-select-card glass-panel" data-service-value="web_dev" type="button">
      <span class="service-select-icon">&#128187;</span>
      <span class="service-select-name">Web Development</span>
      <span class="service-select-desc">Custom sites, apps, and e-commerce</span>
    </button>
    <button class="service-select-card glass-panel" data-service-value="devops" type="button">
      <span class="service-select-icon">&#9881;&#65039;</span>
      <span class="service-select-name">DevOps</span>
      <span class="service-select-desc">CI/CD, infrastructure, and deployment</span>
    </button>
    <button class="service-select-card glass-panel" data-service-value="analytics" type="button">
      <span class="service-select-icon">&#128202;</span>
      <span class="service-select-name">Analytics</span>
      <span class="service-select-desc">Data pipelines, dashboards, and insights</span>
    </button>
  </div>
</div>
```

### Select Dropdown Styling (Step 2 — the `appearance: none` fix)
```css
/* Source: MDN Web Docs — appearance property */
.glass-input[type="select"],
select.glass-input {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;
  color-scheme: dark;
}
/* Ensure option background matches dark theme */
select.glass-input option {
  background: #0a0a0c;
  color: #ffffff;
}
```

### GTM tracking pattern (unchanged)
```typescript
// Source: existing contact-form.ts pattern — preserve exactly
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'contact_form_submit',
  form_status: 'success', // or 'error'
});
```

### Submission payload assembly
```typescript
// Source: derived from API endpoint (src/pages/api/contact.ts) field expectations
const payload = {
  name: state.name.trim(),
  email: state.email.trim(),
  company: state.company.trim() || undefined,  // omit empty string
  message: state.message.trim(),
  service_type: state.service_type || undefined,
  budget: state.budget || undefined,
  timeline: state.timeline || undefined,
  website: (document.querySelector<HTMLInputElement>('[name="website"]')?.value) || '', // honeypot
};
```

### Success panel with Cal.com CTA
```typescript
// Source: CONTEXT.md decisions
const CAL_URL = 'https://cal.com/synctexts/discovery'; // or import.meta.env.PUBLIC_CAL_URL

wrapper.innerHTML = `
  <div class="success-panel">
    <div class="success-icon">&#10003;</div>
    <h2>Message Sent!</h2>
    <p>We'll get back to you within 24 hours.</p>
    <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg" style="margin-top:1.5rem;">
      Book a Discovery Call
    </a>
  </div>
`;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-step form libraries (formik, react-hook-form) | Vanilla state machine for non-React projects | Ongoing | No framework overhead; direct DOM manipulation is idiomatic for this Astro SSR project |
| `localStorage` for form persistence | `sessionStorage` for tab-scoped persistence | Browser standard | sessionStorage expires on tab close, which is the correct UX (no stale state from old sessions) |
| CSS keyframe animations for step transitions | CSS `transition` + class swap | Ongoing | Simpler authoring, better `prefers-reduced-motion` integration |

**Deprecated/outdated:**
- `DOMContentLoaded` event listener: Replaced by `astro:page-load` in this project for View Transition compatibility (already established in existing `contact-form.ts`).
- `display:none/block` toggled via JS inline style: Use CSS class toggles for all visibility control in this project.

---

## Open Questions

1. **Cal.com URL — env var vs inline constant**
   - What we know: Phase 9 will embed Cal.com directly; Phase 8 only needs a link URL
   - What's unclear: Whether a `PUBLIC_CAL_URL` env var is already defined in the project, or should be added
   - Recommendation: Use `import.meta.env.PUBLIC_CAL_URL ?? 'https://cal.com/synctexts/discovery'` with a hardcoded fallback — zero config needed for Phase 8 to work, Phase 9 can parameterize later

2. **`.contact-wrapper` layout for new step indicator**
   - What we know: Current layout is `grid-template-columns: 1fr 1fr` with contact-info left, form right
   - What's unclear: Whether the step indicator sits above the entire two-column grid, or only above the form column
   - Recommendation: Place step indicator inside the form column (right side), not spanning both columns. This matches the Stripe/Typeform pattern where the indicator is part of the form area, not a page-level header.

3. **Service card icon choice**
   - What we know: Claude's discretion; existing `ServiceCard.astro` uses emoji icons
   - What's unclear: Whether emoji render consistently across platforms for the three cards
   - Recommendation: Use emoji matching the existing homepage service icons for visual consistency; emoji render consistently on all modern platforms and require no SVG authoring.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured — `CLAUDE.md` states "No test framework is configured" |
| Config file | N/A |
| Quick run command | `npm run build` (TypeScript compilation check) |
| Full suite command | `npm run build && npm run preview` (manual verification) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | Service selection card click sets service_type and auto-advances | manual | `npm run build` (TS compiles) | ❌ Wave 0 |
| FORM-02 | All services share same Step 2 (no branch logic) | manual | `npm run build` | ❌ Wave 0 |
| FORM-03 | Step indicator reflects current/completed/pending state visually | manual | `npm run build` | ❌ Wave 0 |
| FORM-04 | Back navigation restores data; completed dots clickable | manual | `npm run build` | ❌ Wave 0 |
| FORM-05 | Inline errors shown before step advance; Step 3 blocks submit | manual | `npm run build` | ❌ Wave 0 |
| FORM-06 | Refresh restores step and field values from sessionStorage | manual | `npm run build` | ❌ Wave 0 |
| FORM-07 | Slide animations fire on transition; instant with `prefers-reduced-motion` | manual | `npm run build` | ❌ Wave 0 |
| FORM-08 | Success panel shows with Cal.com CTA after submit | manual | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` — verifies TypeScript compiles without errors
- **Per wave merge:** `npm run build && npm run preview` — manual browser walkthrough of all 3 steps
- **Phase gate:** Full manual verification checklist before `/gsd:verify-work`

### Wave 0 Gaps
- No test files to create — project has no test framework
- `npm run build` is the only automated gate; all functional requirements require manual browser testing
- Consider adding a Wave 0 task to set up a `data-testid` attribute convention on key elements to enable future automation

*(Note: No test infrastructure exists in this project — all FORM requirements are verified manually via `npm run preview`)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reads: `src/pages/contact.astro`, `src/scripts/contact-form.ts`, `src/lib/validation.ts`, `src/styles/global.css`, `src/components/ServiceCard.astro`, `src/pages/api/contact.ts`
- `.planning/phases/08-multi-step-form-frontend/08-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- MDN Web Docs patterns: sessionStorage API, CSS transitions, `transitionend` event, `appearance` property for select styling — all well-established browser APIs with no version concerns
- Astro `astro:page-load` event — verified as established pattern in existing codebase

### Tertiary (LOW confidence)
- None — all findings are grounded in direct codebase evidence or well-established browser APIs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tools already present in codebase
- Architecture: HIGH — patterns derived from existing code and locked decisions in CONTEXT.md
- Pitfalls: HIGH — derived from direct inspection of existing CSS, existing form code, and known browser behavior
- Test coverage: HIGH — no test framework exists; this is confirmed in CLAUDE.md

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (stable browser APIs; Astro patterns change slowly)
