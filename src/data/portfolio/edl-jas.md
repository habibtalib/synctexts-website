---
title: "EDL — Enviro Digital Library @JAS"
client: "Department of Environment Malaysia (Jabatan Alam Sekitar)"
industry: "Government / Environment"
duration: "Ongoing"
techStack:
  - "Laravel"
  - "FilamentPHP"
  - "SQL Server"
  - "Tailwind CSS"
cover: "/images/portfolio/edl.png"
gallery:
  - "/images/portfolio/edl.png"
liveUrl: "https://edl.doe.gov.my"
---

## The Challenge

The Department of Environment's e-library (Perpustakaan Enviro Digital) ran on a legacy ASP.NET Web Forms application. It needed modernization without disrupting the existing data or forcing a risky big-bang migration.

## Our Approach

We rewrote the e-library on Laravel with FilamentPHP using the **strangler pattern** — the new application runs directly on the existing SQL Server database, reading the legacy tables as-is so it can operate side-by-side with the old system during cutover.

- **Digital collections** — searchable environmental documents, books, and e-books.
- **Image gallery & data bank** for environmental media and datasets.
- **Public landing experience** with category browsing and a unified search across collections.
- **Incremental migration** that de-risks the transition from the legacy stack.

## Results

- A modern, responsive public library experience over the same trusted dataset.
- Zero-downtime cutover path via side-by-side operation with the legacy app.
- A maintainable Laravel/Filament codebase replacing legacy Web Forms.
