---
title: "PinjamNow — Personal Financing Website"
client: "PinjamNow / JCE Ventures Sdn. Bhd."
industry: "Finance / Personal Financing"
duration: "Ongoing"
techStack:
  - "Next.js 16"
  - "Payload CMS 3"
  - "PostgreSQL"
  - "Docker"
  - "Caddy"
  - "PostHog"
cover: "/images/portfolio/pinjamnow.png"
gallery:
  - "/images/portfolio/pinjamnow.png"
liveUrl: "https://pinjamnow.my"
---

## The Challenge

PinjamNow is a Malaysian personal-financing brand operated by JCE Ventures Sdn. Bhd. It needed a modern, bilingual website that explains its products clearly and turns visitors into complete loan applications — without the team re-typing applications into the back office.

## Our Approach

The new site runs on Next.js with Payload CMS, built together with developer naqibfaiq, while SyncTexts delivered the integration with the [CLMS lending platform](/portfolio/clms):

- **Bilingual content** — Bahasa Melayu and English pages for personal financing, 2ndHope and Quick Cash, plus careers and articles, all editable in Payload CMS.
- **Multi-step loan application** — a guided form that loads employer and employment lists from CLMS and submits each application directly into it.
- **Agent referrals** — referral links (`?ref=`) that credit applications to the right agent.
- **Lead capture and analytics** — a WhatsApp contact button and PostHog product analytics.
- **Simple hosting** — containerised with Docker behind Caddy.

## Results

- A clean, bilingual brand site with clear product pages.
- Online applications arrive in CLMS ready for processing, with no re-keying.
- Agent referrals are tracked from the first click to the submitted application.
