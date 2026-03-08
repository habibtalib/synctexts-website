# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SyncTexts agency landing page — a single-page marketing site built with Vite + vanilla HTML/CSS/JS. Dark-themed glassmorphism design showcasing Web Development, DevOps, and Analytics services.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

This is a simple static site with three core files:

- **`index.html`** — Single-page structure with sections: nav, hero, services, projects, tech stack, contact form, footer. All sections use `reveal` class for scroll-triggered animations.
- **`style.css`** — CSS custom properties in `:root` define the full design system (colors, fonts, glass effects). Key patterns: `.glass-panel` for glassmorphism cards, `.text-gradient` for gradient text, `.reveal`/`.active` for scroll animations.
- **`main.js`** — ES module entry point. Handles navbar scroll effect, IntersectionObserver-based reveal animations, and contact form submission (currently simulated, no backend).

## Design System

- **Colors**: Dark base (`#0a0a0c`), indigo primary (`#6366f1`), pink secondary (`#ec4899`)
- **Fonts**: Outfit (display/headings), Inter (body) — loaded from Google Fonts
- **Patterns**: Glassmorphism via `backdrop-filter: blur()` with semi-transparent backgrounds and subtle borders
- **Responsive breakpoints**: 900px (contact grid collapses, hero shrinks), 600px (nav links hidden)
