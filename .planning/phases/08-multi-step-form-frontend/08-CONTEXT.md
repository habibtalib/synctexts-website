# Phase 8: Multi-Step Form Frontend - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing single-step contact form with a 3-step service-branched wizard that collects service_type, budget, and timeline (fields the API already accepts from Phase 7), persists progress via sessionStorage, shows animated step transitions, and presents a "Book a Discovery Call" CTA after submission. Backend API unchanged — frontend only.

</domain>

<decisions>
## Implementation Decisions

### Step Flow
- 3 steps: Step 1 (Service Selection) → Step 2 (Project Details) → Step 3 (Contact Info)
- No service-specific branch questions — all three services share the same Step 2 (budget + timeline dropdowns)
- Step 2 fields (budget, timeline) are optional — visitor can advance without selecting them (API handles NULL gracefully, lead just scores lower)
- Service selection on Step 1 auto-advances to Step 2 (no "Next" button needed for Step 1)

### Step Indicator
- Numbered dots (1, 2, 3) connected by lines with labels below: "Service", "Details", "Contact"
- Current step: indigo filled dot. Completed steps: checkmark icon. Pending: outline dot
- Completed step dots are clickable — visitor can jump back to any completed step with data preserved
- Connecting line animates fill with indigo color (~300ms, synced with step slide transition)
- Step indicator hidden on the confirmation/success screen

### Form Field Presentation
- Step 1: Three clickable glassmorphism cards with icon, service name, and 1-line description. Cards have indigo glow border + subtle scale-up (1.02) on hover. Selected card gets solid indigo border
- Step 2: Styled glass select dropdowns (`.glass-input` style) for budget and timeline. Labels above each field. Placeholder text: "Select budget range...", "Select timeline..."
- Step 3: Name (required), Email (required), Company (optional), Message (required) — same fields as current form, same validation rules

### Human-Friendly Labels
- Services: "Web Development", "DevOps", "Analytics"
- Budget: "Under $5K", "$5K – $15K", "$15K – $50K", "$50K+"
- Timeline: "ASAP", "1–3 Months", "3–6 Months", "Just Exploring"
- Enum values sent to API: `web_dev`, `devops`, `analytics`, `under_5k`, `5k_15k`, `15k_50k`, `50k_plus`, `asap`, `1_3_months`, `3_6_months`, `exploring`

### Transitions and Animations
- Step transitions: horizontal slide (next step slides in from right, previous slides in from left). Duration ~300ms ease
- `prefers-reduced-motion`: all animations become instant state changes (accessibility fallback)
- Service cards: glow + scale hover effect matching existing ServiceCard/ProjectCard patterns

### State Persistence (FORM-06)
- sessionStorage stores current step and all entered field values
- Page refresh restores visitor to their current step with all data intact
- sessionStorage cleared immediately on successful submission

### Post-Submission
- Form area replaced with success panel: green checkmark icon, "Message Sent!" heading, "We'll get back to you within 24 hours." text
- Prominent "Book a Discovery Call" button (`.btn-primary` style) links to external Cal.com booking page in new tab
- Cal.com URL configured via environment variable or constant (Phase 9 will embed it directly)
- Step indicator hidden on success screen

### Inline Validation (FORM-05)
- Per-step validation: cannot advance to next step with invalid/missing required fields
- Inline error messages below each field (same pattern as current form: `.field-error` spans)
- Step 3 validation unchanged from current: name ≥ 2 chars, valid email, message ≥ 10 chars

### Preserved Behaviors
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

</decisions>

<specifics>
## Specific Ideas

- Service cards should feel like the existing ServiceCard component — glassmorphism with hover glow, not flat radio buttons
- Step indicator inspired by common wizard patterns (Stripe checkout, Typeform) — clean numbered dots, not a chunky progress bar
- The form should feel like a natural upgrade of the existing contact form, not a completely different component

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/contact.astro`: Current single-step form — will be replaced/extended. Has `.glass-input`, `.field-error`, `.success-panel`, `.spinner` CSS already defined
- `src/scripts/contact-form.ts`: Current validation + submission logic — rewrite for multi-step but reuse validation patterns (`validateField`, `showFieldError`, `showErrorSummary`)
- `src/components/ServiceCard.astro`: Existing service card styling for reference (hover effects, glass panel)
- `src/lib/validation.ts`: Server-side validation with enum checks — client-side mirrors these rules

### Established Patterns
- Glass inputs: `.glass-input` class on all form fields
- Error display: `.field-error` spans below fields, `.input-error` class on invalid inputs, `.form-errors` summary box
- Success panel: `.success-panel` with `.success-icon` checkmark replaces form on success
- Submit loading: button disabled + spinner during submission
- View Transitions: `astro:page-load` event listener (not DOMContentLoaded)
- GTM tracking: `window.dataLayer.push()` on form events

### Integration Points
- `src/pages/api/contact.ts`: POST endpoint — already accepts service_type, budget, timeline as optional fields
- `src/pages/contact.astro`: Primary file to modify — HTML structure + scoped CSS
- `src/scripts/contact-form.ts`: Primary file to rewrite — multi-step state machine + validation + submission
- Enum constants from `src/lib/validation.ts`: `VALID_SERVICE_TYPES`, `VALID_BUDGETS`, `VALID_TIMELINES` for client-side select options

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-multi-step-form-frontend*
*Context gathered: 2026-03-16*
