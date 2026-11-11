---
title: "Sauh.my — Langkawi Travel Booking"
client: "Sauh.my (Ali Ikhwan)"
industry: "Travel / Tourism Booking"
duration: "Ongoing"
techStack:
  - "Laravel 13"
  - "Inertia"
  - "React 19"
  - "FilamentPHP 5"
  - "Tailwind CSS 4"
  - "MySQL"
  - "Pest 4"
cover: "/images/portfolio/sauh.png"
gallery:
  - "/images/portfolio/sauh.png"
liveUrl: "https://sauh.my"
---

## The Challenge

Sauh.my sells Langkawi travel — holiday packages, ferry tickets, hotels, activities, car rental and boat charters. The original WordPress/WooCommerce site struggled with mixed product types: the booking form and pricing were hard to get right, the mobile experience was weak, and orders and tickets were handled by hand. Owner Ali Ikhwan needed a booking platform that customers on a phone can trust to charge exactly the price shown.

## Our Approach

We rebuilt the site as a mobile-first, Malay-language booking platform on Laravel, Inertia/React and Filament:

- **One cart for every product type** — packages, ferries, hotels, activities, cars and charters, with adult and child pricing and a multi-item cart.
- **Server-side pricing** — every price is calculated on the server, so the amount charged always matches the amount shown.
- **Online payments** — CHIP payment gateway with secured callbacks.
- **Confirmation and tickets** — each order item is confirmed separately by the admin, then the customer receives a PDF e-ticket with a QR code, checked through a two-level ticket verification flow.
- **Filament admin** — product, order and content management for the Sauh.my team.
- **Safe migration** — a re-runnable WordPress importer with 301 redirects, so existing products and search rankings carry over.
- **SEO and analytics** — structured SEO and GA4 e-commerce events across the booking funnel.
- **Tested end to end** — Pest 4 feature and browser tests.

## Results

- A faster, mobile-first booking experience covering all six product types in one place.
- Accurate, server-checked pricing and automatic QR e-tickets in place of manual handling.
- The new platform is live for review, with the production cutover from WordPress to follow.
