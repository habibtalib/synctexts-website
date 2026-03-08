# Testing Patterns

**Analysis Date:** 2026-03-08

## Test Framework

**Runner:**
- None configured. No test framework is installed.
- `CLAUDE.md` explicitly states: "No test framework is configured."

**Assertion Library:**
- None.

**Run Commands:**
```bash
# No test commands available in package.json scripts.
# Only available scripts: dev, build, preview
```

## Test File Organization

**Location:**
- No test files exist in the codebase.

**Naming:**
- Not established. When adding tests, follow the convention: `[filename].test.js` co-located with source files, or in a `__tests__/` directory at root.

## Current Test Coverage

**Coverage:** Zero. No tests exist for any functionality.

## What Needs Testing

The codebase has three testable behaviors in `main.js`:

**1. Navbar Scroll Effect:**
- File: `main.js` (lines 5-12)
- Behavior: Adds `scrolled` class to `.glass-nav` when `window.scrollY > 50`
- Test approach: Mock `window.scrollY`, dispatch scroll event, assert class toggle

**2. Intersection Observer Reveal Animations:**
- File: `main.js` (lines 14-36)
- Behavior: Adds `active` class to `.reveal` elements when they enter viewport; applies `--delay` as `transitionDelay`; unobserves after revealing
- Test approach: Mock `IntersectionObserver`, simulate entry, assert class and style changes

**3. Contact Form Submission:**
- File: `main.js` (lines 38-63)
- Behavior: Prevents default submit, shows "Sending..." state, simulates API call with `setTimeout`, shows "Message Sent!" with green background, resets form after 3 seconds
- Test approach: Create form DOM, dispatch submit event, use fake timers to verify state transitions

## Recommended Test Setup

**If adding tests, use Vitest** (already using Vite as build tool):

```bash
npm install -D vitest jsdom @testing-library/dom
```

**Vitest Config** (create `vitest.config.js`):
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
```

**Add script to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## Recommended Test Structure

**File placement:** Create `main.test.js` at root level (co-located with `main.js`).

**Suite organization pattern:**
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Navbar Scroll Effect', () => {
  beforeEach(() => {
    document.body.innerHTML = '<nav class="glass-nav"></nav>';
  });

  it('adds scrolled class when scrollY > 50', () => {
    // arrange, act, assert
  });

  it('removes scrolled class when scrollY <= 50', () => {
    // arrange, act, assert
  });
});

describe('Contact Form', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form class="contact-form">
        <button type="submit">Send Message</button>
      </form>
    `;
  });

  it('prevents default form submission', () => {
    // test e.preventDefault() is called
  });

  it('shows sending state on submit', () => {
    // test button text changes to "Sending..."
  });
});
```

## Mocking

**Framework:** Use Vitest built-in `vi` (if Vitest is adopted).

**Patterns for this codebase:**
```javascript
// Mock IntersectionObserver (not available in jsdom)
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
global.IntersectionObserver = vi.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: vi.fn(),
}));

// Fake timers for setTimeout-based form logic
vi.useFakeTimers();
// ... trigger form submit ...
vi.advanceTimersByTime(1500); // simulate API delay
// ... assert "Message Sent!" state ...
vi.advanceTimersByTime(3000); // simulate reset delay
// ... assert button reset ...
vi.useRealTimers();
```

**What to Mock:**
- `IntersectionObserver` (not available in jsdom)
- `window.scrollY` (for navbar scroll tests)
- `setTimeout` via fake timers (for form submission flow)

**What NOT to Mock:**
- DOM manipulation (let jsdom handle it)
- CSS class toggling (test actual DOM state)
- Event listeners (dispatch real events)

## Fixtures and Factories

**Test Data:**
- No fixtures exist. Tests should create minimal DOM fragments inline using `document.body.innerHTML`.

**Location:**
- Not established. If needed, create `__fixtures__/` at root.

## Test Types

**Unit Tests:**
- Not implemented. Priority: test the three behaviors in `main.js` described above.

**Integration Tests:**
- Not applicable for current scope (single static page).

**E2E Tests:**
- Not configured. Could use Playwright if visual/interaction testing becomes necessary.
- The contact form currently has no backend, so E2E testing would only validate client-side state changes.

## Refactoring for Testability

The current `main.js` wraps everything in a `DOMContentLoaded` callback, making it hard to test in isolation. To enable testing:

1. Extract each feature into named, exported functions in `main.js`:
```javascript
export function initNavScroll(nav) { ... }
export function initRevealAnimations() { ... }
export function initContactForm(form) { ... }
```

2. Keep the `DOMContentLoaded` handler as a thin orchestrator:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll(document.querySelector('.glass-nav'));
  initRevealAnimations();
  initContactForm(document.querySelector('.contact-form'));
});
```

3. Test the exported functions directly in `main.test.js`.

---

*Testing analysis: 2026-03-08*
