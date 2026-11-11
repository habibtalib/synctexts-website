---
title: "CLMS — Loan Origination & Management SaaS"
client: "DMC Capital (2ndHope) / CLMS"
industry: "Finance / Lending SaaS"
duration: "Ongoing"
techStack:
  - "Laravel 13"
  - "Inertia"
  - "React 19"
  - "Tailwind CSS 4"
  - "MySQL"
  - "Laravel Reverb"
  - "Expo / React Native"
  - "AWS"
cover: "/images/portfolio/clms.png"
gallery:
  - "/images/portfolio/clms.png"
liveUrl: "https://clms.my"
---

## The Challenge

DMC Capital runs personal financing for Malaysian borrowers through its 2ndHope and [PinjamNow](/portfolio/pinjamnow) brands. Its first loan system (CLCS, built on Filament v2) had outgrown its original design, and staff worked through a long list of application statuses without a clear view of where each case stood. The business needed a back office that gives each team its own workspace, keeps every application moving through a clear workflow, and could later be offered to other licensed lenders as a product.

## Our Approach

We rebuilt the platform from the ground up as CLMS, a Laravel and Inertia/React application:

- **Role-based panels** — separate workspaces for operations, telemarketing, agents, agencies, administrators and funders, plus dedicated credit, documentation and finance desks, each with its own navigation and record scope.
- **Clear application workflow** — 26+ application statuses grouped into a 7-stage progress stepper, with a single write path and automatic assignee routing.
- **Credit and documentation** — Experian and CTOS credit-bureau checks, generated agreements and PDF forms, and electronic signing.
- **Collections and payouts** — collections tracking, commission and payout calculation, payslips and invoices.
- **Built-in communication** — a WhatsApp inbox and telephony, with real-time updates over Laravel Reverb.
- **Multi-tenant SaaS** — a separate database for every lender, 19 sellable modules grouped into plans, usage metering, and LHDN MyInvois e-invoicing, all run from a dedicated control plane.
- **Staff mobile app** — an Expo/React Native app with VoIP callback calls and biometric unlock.
- **Quality first** — hosted on AWS in the Malaysia region and covered by thousands of automated Pest tests.

## Results

- Replaced the first-generation CLCS system with a role-based platform the whole team works in.
- PinjamNow's online application form feeds straight into CLMS, so new applications land in the workflow without re-keying.
- A productised, multi-tenant platform now offered to other Malaysian licensed lenders at clms.my.
