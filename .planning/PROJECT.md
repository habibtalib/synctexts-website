# SyncTexts Agency Website

## What This Is

A full-featured agency website for SyncTexts (synctexts.com) — a tech agency specializing in Web Development (Laravel, FilamentPHP), Mobile (Flutter), DevOps (Kubernetes, Terraform), and Analytics (GA, GTM). The site showcases the agency's services, team, portfolio of past projects (pulled from GitHub private repos), blog articles, client testimonials, and pricing packages. It includes a working contact form and analytics integration.

## Core Value

Potential clients can see SyncTexts' real project portfolio and expertise, then easily get in touch — turning the website into a lead generation engine.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Landing page with hero, services, tech stack sections — existing
- ✓ Dark glassmorphism design system with CSS custom properties — existing
- ✓ Scroll-triggered reveal animations — existing
- ✓ Responsive layout with mobile breakpoints — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Portfolio section pulling data from 5-10 selected GitHub private repos via API
- [ ] Manual override capability for portfolio items (custom descriptions, screenshots)
- [ ] Team page with member profiles, roles, and photos
- [ ] Blog powered by Markdown files in the repo
- [ ] Testimonials section with client reviews and success stories
- [ ] Pricing/packages page showing service tiers
- [ ] Working contact form that sends email and saves to database
- [ ] Google Analytics and GTM integration
- [ ] Redesigned/refined existing sections (hero, services, tech stack, contact)
- [ ] Multi-page site structure (Home, Portfolio, Team, Blog, Pricing, Contact)

### Out of Scope

- Headless CMS — content managed via Markdown and config files, not a CMS
- OAuth/authentication — public-facing marketing site, no user accounts
- E-commerce/payments — pricing is informational, not transactional
- Mobile app — web only

## Context

- Existing codebase is a single-page vanilla HTML/CSS/JS site built with Vite
- Dark theme with glassmorphism aesthetic (indigo #6366f1 primary, pink #ec4899 secondary, dark base #0a0a0c)
- Fonts: Outfit (display) and Inter (body) from Google Fonts
- Current contact form is simulated (no backend)
- No framework, no backend, no database currently
- Agency does DevOps work — self-hosting on own server is planned (likely Docker/containerized)
- GitHub private repos need a personal access token for API access
- Codebase map available at `.planning/codebase/`

## Constraints

- **Design**: Keep and refine the existing dark glassmorphism look — same visual language, extended to new pages
- **Hosting**: Self-hosted on own server (not Vercel/Netlify)
- **Blog**: Markdown files in repo (no external CMS dependency)
- **Portfolio**: GitHub API with PAT for private repo access; 5-10 curated repos via config

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Framework migration needed | Current vanilla setup can't scale to multi-page site with blog, API integration, and SEO needs | — Pending (research phase will recommend) |
| Markdown for blog | Version-controlled, no external dependency, fits developer workflow | — Pending |
| Email + DB for contact form | Ensures no leads are lost; email for notification, DB for tracking | — Pending |
| Self-hosted deployment | Agency has DevOps expertise; full control over infrastructure | — Pending |

---
*Last updated: 2026-03-08 after initialization*
