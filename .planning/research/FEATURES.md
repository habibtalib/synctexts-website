# Feature Research

**Domain:** Tech agency marketing website (lead generation)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features prospects assume exist. Missing these makes the agency look unprofessional or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-page navigation** | Single-page sites feel amateur for agencies; prospects expect dedicated pages for services, portfolio, about/team, contact | MEDIUM | 5-6 pages: Home, Portfolio, Team, Blog, Pricing, Contact. Keep nav to 4-6 items max (research shows this is optimal). Sticky header with CTA button. |
| **Services overview with detail** | Prospects need to know what you do in under 5 seconds. Service pages are "the workhorse of lead generation" | LOW | Already partially exists. Expand each service into its own section or sub-page with specifics, process description, and relevant tech stack. |
| **Portfolio / case studies page** | 66% of B2B marketers cite case studies as top-3 most effective content for lead generation. Prospects evaluate past work before contacting. | HIGH | Pull from GitHub API (private repos via PAT). Need 5-10 curated projects. Each needs: title, description, tech tags, screenshots, and optionally a "View Details" link. Manual override config for custom descriptions/images since auto-pulled GitHub data alone is insufficient. |
| **Working contact form** | A simulated form signals "this site is a demo, not a business." Broken or fake forms actively lose leads. | MEDIUM | Keep to 3-4 fields max (name, email, message + optional company/budget). Must send email notification AND persist to database so leads are never lost. Add clear CTA copy ("Start Your Project" beats "Submit"). |
| **Responsive design** | Over 60% of web traffic is mobile. Non-responsive = immediate bounce. | LOW | Already exists. Verify it extends properly to all new pages. |
| **Fast load times** | Core Web Vitals are a Google ranking factor. Slow agency sites signal "they can't even build their own site well." | LOW | Static site or SSG approach inherently fast. Optimize images (WebP), minimize JS bundles. Target <2s LCP. |
| **SEO fundamentals** | Agency websites compete for "[city] web development agency" and similar queries. No SEO = invisible. | MEDIUM | Proper meta tags, Open Graph, structured data (JSON-LD for Organization, LocalBusiness), sitemap.xml, semantic HTML. Each page needs unique title/description. Blog content drives long-tail SEO. |
| **About / Team page** | Prospects hire people, not logos. Missing team page reduces trust significantly. | LOW | Member profiles with photo, name, role, short bio. No need for social links unless team wants them. Keep it authentic -- real photos, not stock. |
| **Footer with contact details** | The footer answers logistical questions: where you work, how to reach you. Missing footer info looks sketchy. | LOW | Email, location (city/country), copyright, nav links, possibly social icons. |
| **SSL / HTTPS** | Browser warnings on non-HTTPS sites destroy trust instantly. | LOW | Infrastructure concern, not code. Self-hosted = set up via Let's Encrypt / Caddy auto-TLS. |

### Differentiators (Competitive Advantage)

Features that set SyncTexts apart. Not expected, but make the agency memorable and build trust.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Live GitHub portfolio integration** | Most agencies use static screenshots. Pulling real repo data (languages, commit activity, descriptions) proves technical credibility in a way competitors cannot fake. | HIGH | Use GitHub REST API with PAT for private repos. Show: repo name, description, primary languages, last updated. Config file defines which repos to display + manual overrides for descriptions/screenshots. Cache API responses (rebuild on deploy or periodic refresh). |
| **Technical blog (Markdown-powered)** | Positions agency as thought leaders. Drives organic SEO traffic. Markdown in-repo means developer-friendly workflow with version control -- no CMS dependency. | MEDIUM | Markdown files with YAML frontmatter (title, date, author, tags, description). Need: listing page with pagination, individual post pages, tag filtering, syntax highlighting for code blocks, estimated read time. RSS feed is a bonus. |
| **Client testimonials with context** | Social proof with specific outcomes ("reduced deploy time by 80%") converts far better than generic praise. Placed strategically near CTAs. | LOW | Start with 3-5 curated testimonials. Each needs: quote, client name, role, company, optionally a photo/logo. Carousel or grid layout. Place on homepage AND as standalone section. Data in config file, not hardcoded. |
| **Transparent pricing tiers** | Most agencies hide pricing ("contact us for a quote"). Showing ballpark tiers filters leads and builds trust. Signals confidence. | LOW | 3 tiers is standard (Starter/Growth/Enterprise or similar). Show what's included, starting price, and CTA per tier. Add "Custom" option for enterprise. Data-driven from config file. |
| **Scroll-triggered animations** | Creates a polished, modern feel. Already partially implemented. Extending to new pages maintains the premium aesthetic. | LOW | Already exists with IntersectionObserver. Extend to new sections. Keep subtle -- animations should enhance, not distract. |
| **Dark glassmorphism design system** | Distinctive visual identity. Most agency sites use light themes. Dark + glassmorphism feels premium and technical. | LOW | Already established. Extend consistently to new pages. Document the design tokens (colors, blur values, border styles) for consistency. |
| **Analytics dashboard integration** | GA4 + GTM demonstrates the agency practices what it preaches. Track form submissions, page views, scroll depth. | LOW | Drop in GA4 snippet + GTM container. Set up conversion tracking for form submissions. This is table stakes for the agency's analytics service offering -- "we use what we sell." |
| **Structured data / rich snippets** | JSON-LD markup for Organization, LocalBusiness, and BlogPosting enables rich results in Google (star ratings, article previews, business info). Competitors rarely bother. | MEDIUM | Add JSON-LD to relevant pages. Organization schema on all pages, BlogPosting on blog posts, FAQ schema if applicable. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Headless CMS (Contentful, Strapi, etc.)** | "We need easy content editing" | Adds external dependency, hosting cost, API complexity, and auth management. For a small agency site with infrequent updates, it is massive overkill. | Markdown files in the repo + config JSON/YAML for structured data (testimonials, pricing, team). Developers edit directly; non-devs can use GitHub's web editor. |
| **User authentication / client portal** | "Clients could log in to see project status" | Adds auth system, session management, security surface area, and ongoing maintenance for a feature almost no prospects will use on a marketing site. | Link to external project management tools (Linear, Notion) if needed. The website's job is lead generation, not project management. |
| **Live chat widget** | "Instant support improves conversion" | Requires someone to actually respond in real-time, or it becomes a worse experience than no chat. Third-party widgets (Intercom, Drift) add 200-500KB of JS, hurt performance, and look spammy. | Contact form with clear response time expectation ("We reply within 24 hours"). Add WhatsApp/Telegram link if instant messaging is desired. |
| **E-commerce / online payments** | "Let clients pay for packages online" | Adds payment processing (Stripe integration), invoicing, tax handling, and legal complexity. Pricing page is informational -- actual projects need scoping calls first. | "Start Your Project" CTA that leads to contact form. Handle payments through invoicing tools (Paddle, Xero) after scoping. |
| **AI chatbot** | "Everyone's adding AI in 2026" | Novelty that adds complexity without clear ROI for a small agency site. Can give wrong answers about services/pricing. Maintenance burden for prompt engineering. | Well-structured FAQ section or service pages that answer common questions. The content itself should be the "chatbot." |
| **Internationalization (i18n)** | "We want to reach global clients" | Multiplies content maintenance by N languages. Translation quality issues. Most tech agencies operate in English regardless of location. | Write all content in English. Add a single "We work with clients worldwide" statement. |
| **Real-time notifications / WebSockets** | "Show live project activity" | Over-engineered for a marketing site. Adds infrastructure complexity (WebSocket server, connection management). | Static "Recent Activity" section updated on build/deploy showing latest blog posts or GitHub activity. |
| **Complex multi-step contact form** | "Qualify leads better with more fields" | Each additional field reduces form completion by 5-10%. Agency-side qualification happens on the sales call, not the form. | 3-4 fields maximum. Add an optional "Budget range" dropdown if lead qualification is critical. Keep friction low. |

## Feature Dependencies

```
[Multi-page site structure]
    |
    +--requires--> [Navigation / routing system]
    |                  |
    |                  +--requires--> [Framework or static site generator]
    |
    +--enables--> [Portfolio page]
    |                 |
    |                 +--requires--> [GitHub API integration]
    |                 +--enhanced-by--> [Manual override config]
    |                 +--enhanced-by--> [Project detail pages]
    |
    +--enables--> [Blog]
    |                 |
    |                 +--requires--> [Markdown processing pipeline]
    |                 +--requires--> [Frontmatter parsing]
    |                 +--enhanced-by--> [Syntax highlighting]
    |                 +--enhanced-by--> [RSS feed]
    |                 +--enhanced-by--> [Tag filtering]
    |
    +--enables--> [Team page]
    |                 +--requires--> [Team data config file]
    |
    +--enables--> [Pricing page]
    |                 +--requires--> [Pricing data config file]
    |
    +--enables--> [Testimonials section]
                      +--requires--> [Testimonials data config file]

[Contact form (frontend)]
    +--requires--> [Backend / API endpoint]
    +--requires--> [Email sending service]
    +--enhanced-by--> [Database persistence]
    +--enhanced-by--> [Form validation (client + server)]
    +--enhanced-by--> [Spam protection (honeypot / reCAPTCHA)]

[SEO fundamentals]
    +--requires--> [Per-page meta tags]
    +--requires--> [Sitemap generation]
    +--enhanced-by--> [Structured data / JSON-LD]
    +--enhanced-by--> [Blog content (long-tail SEO)]
    +--enhanced-by--> [Open Graph tags]

[Analytics integration]
    +--independent--> (can be added at any phase)

[Design system extension]
    +--requires--> [Existing glassmorphism tokens documented]
    +--enables--> [Consistent styling across all new pages]
```

### Dependency Notes

- **Multi-page structure requires framework/SSG:** The current vanilla HTML cannot scale to 6+ pages with shared layouts, markdown processing, and dynamic data. This is the foundational dependency -- everything else builds on top of the framework choice.
- **Portfolio requires GitHub API integration:** The portfolio page's core differentiator is live GitHub data. The API integration must work before the portfolio page can be built beyond static mockups.
- **Blog requires Markdown pipeline:** Frontmatter parsing, Markdown-to-HTML conversion, and listing/detail page generation are prerequisites. The SSG/framework choice directly impacts how this works.
- **Contact form requires backend:** Even a minimal backend (serverless function, small API server, or SSG form handler) is needed. This is the only feature requiring server-side code beyond build-time processing.
- **Analytics is independent:** GA4/GTM can be dropped in at any phase with a script tag. No dependencies.

## MVP Definition

### Launch With (v1)

Minimum to replace the current single-page site with something that generates leads.

- [ ] **Multi-page structure with navigation** -- foundation for everything else
- [ ] **Refined homepage** (hero, services, tech stack, testimonials preview, CTA) -- first impression
- [ ] **Portfolio page with GitHub integration** -- the primary differentiator; proves credibility
- [ ] **Working contact form with email delivery** -- converts visitors to leads (the site's core purpose)
- [ ] **Team page** -- builds trust; low complexity
- [ ] **SEO fundamentals** (meta tags, sitemap, semantic HTML) -- ensures discoverability
- [ ] **Analytics integration** (GA4 + GTM) -- measures what matters from day one

### Add After Validation (v1.x)

Features to add once the core site is live and generating traffic.

- [ ] **Blog with Markdown** -- add when ready to invest in content creation; drives organic traffic over time
- [ ] **Pricing page** -- add when service tiers are finalized and the team is ready to publish rates
- [ ] **Testimonials as dedicated section** -- add when 3+ real client testimonials are collected (can show on homepage first)
- [ ] **Structured data / JSON-LD** -- add after core pages exist to enhance search presence
- [ ] **RSS feed for blog** -- add after blog has 5+ posts
- [ ] **Contact form database persistence** -- add after email delivery is confirmed working; prevents lead loss

### Future Consideration (v2+)

Features to defer until the site is established and traffic warrants investment.

- [ ] **Project detail pages** (individual case study pages per portfolio item) -- defer until there is enough content per project to justify standalone pages
- [ ] **Blog tag/category filtering** -- defer until blog has 15+ posts; premature taxonomy is wasted effort
- [ ] **Newsletter signup** -- defer until blog has consistent publishing cadence
- [ ] **Client logo bar** -- defer until 5+ recognizable client logos are available with permission

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-page structure + nav | HIGH | HIGH | P1 |
| Refined homepage sections | HIGH | MEDIUM | P1 |
| Portfolio (GitHub API) | HIGH | HIGH | P1 |
| Working contact form (email) | HIGH | MEDIUM | P1 |
| Team page | MEDIUM | LOW | P1 |
| SEO fundamentals | HIGH | MEDIUM | P1 |
| GA4 + GTM integration | MEDIUM | LOW | P1 |
| Responsive design (new pages) | HIGH | LOW | P1 |
| Blog (Markdown) | HIGH | MEDIUM | P2 |
| Pricing page | MEDIUM | LOW | P2 |
| Testimonials section | MEDIUM | LOW | P2 |
| Contact form (DB persistence) | MEDIUM | MEDIUM | P2 |
| Spam protection | MEDIUM | LOW | P2 |
| Structured data / JSON-LD | MEDIUM | MEDIUM | P2 |
| Open Graph / social sharing | LOW | LOW | P2 |
| RSS feed | LOW | LOW | P3 |
| Project detail pages | MEDIUM | HIGH | P3 |
| Blog tag filtering | LOW | MEDIUM | P3 |
| Newsletter signup | LOW | MEDIUM | P3 |
| Client logo bar | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- the site cannot function as a lead generation tool without these
- P2: Should have, add within first month -- enhances credibility and SEO
- P3: Nice to have, future consideration -- only valuable at scale

## Competitor Feature Analysis

| Feature | Typical Small Agency | Top-Tier Agency | SyncTexts Approach |
|---------|---------------------|-----------------|-------------------|
| Portfolio | Static screenshots with descriptions | Interactive case studies with metrics, client testimonials per project, filterable by industry/tech | GitHub API-driven with manual overrides. Start simple (card grid), evolve to case studies. Unique angle: live repo data proves real work. |
| Blog | WordPress blog, often neglected | Regular technical content, SEO-optimized, multiple authors | Markdown in repo. Developer-friendly workflow. Focus on technical depth (Laravel, K8s, Terraform content) for SEO. |
| Contact | Basic form or just an email link | Multi-step qualification form, meeting scheduler (Calendly), live chat | Simple 3-4 field form with email + DB. Clear response time. Optional: add Calendly link alongside form. |
| Pricing | Hidden ("Contact us") | Transparent tiers or "Starting at" ranges | Transparent tiers. This is a differentiator -- most agencies hide pricing. |
| Team | Stock photos or no team page | Real photos, personality, social links, individual specialties | Real photos, roles, short bios. Keep authentic. |
| Design | Template-based, generic | Custom design system, animations, dark/light modes | Dark glassmorphism (already established). Distinctive and memorable. Extend consistently. |
| Performance | Often slow (WordPress, heavy plugins) | Fast, optimized, high Lighthouse scores | Static/SSG approach = inherently fast. Lighthouse 90+ target. Agency that builds fast sites should have a fast site. |
| SEO | Basic meta tags at best | Full technical SEO (structured data, sitemap, canonical URLs, blog strategy) | Full technical SEO. Blog drives long-tail. Structured data for rich snippets. |

## Sources

- [Orbit Media Studios - Lead Generation Best Practices](https://www.orbitmedia.com/blog/lead-generation-website-practices/)
- [New Media Campaigns - Writing Case Studies for Agency Websites](https://www.newmediacampaigns.com/blog/tips-for-writing-agency-website-case-studies)
- [Webflow Blog - How to Write the Perfect Web Design Case Study](https://webflow.com/blog/write-the-perfect-case-study)
- [Monday.com - Lead Generation Forms Best Practices 2026](https://monday.com/blog/crm-and-sales/lead-generation-forms/)
- [Venture Harbour - Best Contact Form Design Examples 2026](https://ventureharbour.com/15-contact-form-examples-help-design-ultimate-contact-page/)
- [FuturMedia - Best Digital Agency Websites 2026](https://futurmedia.co.uk/blog/best-digital-agency-websites)
- [Grafit Agency - B2B Website Best Practices 2026](https://www.grafit.agency/blog/best-practices-for-building-a-high-performing-b2b-website-in-2026)
- [Orbit Media - Social Proof Web Design](https://www.orbitmedia.com/blog/social-proof-web-design/)
- [Hosted.md - How to Optimize Markdown Blog Posts for SEO](https://hosted.md/blog/how-to-optimize-markdown-blog-posts-for-seo)
- [Hygraph - Top 12 Static Site Generators 2026](https://hygraph.com/blog/top-12-ssgs)

---
*Feature research for: SyncTexts tech agency website*
*Researched: 2026-03-08*
