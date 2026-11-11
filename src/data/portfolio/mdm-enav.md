---
title: "MDM — Maritime Data Management & VTMIS (eNav)"
client: "Jabatan Laut Malaysia (Marine Department Malaysia)"
industry: "Government / Maritime"
duration: "Ongoing"
techStack:
  - ".NET 10"
  - "ABP Framework"
  - "Vue 3"
  - "SignalR"
  - "NATS JetStream"
  - "TimescaleDB"
  - "Tile38"
  - "ASP.NET"
  - "MongoDB"
cover: "/images/portfolio/mdm.png"
gallery:
  - "/images/portfolio/mdm.png"
liveUrl: "http://mdm.enav.my"
---

## The Challenge

Jabatan Laut Malaysia (the Marine Department) runs Malaysia's Vessel Traffic Management Information System (VTMIS) under the national e-Navigation initiative. Operators use it around the clock to track vessels from AIS feeds, monitor aids to navigation, respond to alarms and produce reports. The first-generation platform kept the service running, but it was built on ageing components, and its data pipeline could lose vessel position data under load. The department needed the system modernised without disrupting daily operations.

## Our Approach

We support and operate the current platform while delivering its successor, MDM v2:

- **Current platform (v1)** — an ASP.NET application with role-based access for officers and administrators, live dashboard updates over SignalR, and a replicated MongoDB data layer for high availability.
- **Modern .NET core (v2)** — a ground-up rebuild on .NET 10 and the ABP Framework, porting around 30 modules with tenancy and fine-grained permissions, instead of a risky change of language.
- **Durable data pipeline** — AIS messages flow through a NATS JetStream ingestion spine, so position data is buffered and replayable instead of silently dropped.
- **Purpose-built data stores** — TimescaleDB for vessel position history and Tile38 for live geofencing.
- **Vue 3 operator console** — live vessel tracking, alarms with a configurable condition engine, aids-to-navigation monitoring with health alarms, charts and weather layers, and a reports catalogue with scheduling.
- **Messaging and maritime data** — two-way AIS and DSC messaging, AIS binary message decoding, shore-station network monitoring, and LRIT long-range vessel tracking.
- **MDM Lite** — a mobile view for operators on the move, with an Android app wrapper and push notifications in progress.
- **Safe cutover** — a parity harness, a reversible switchover path and monitoring with alerting, so the move from v1 to v2 can be verified before it happens.

## Results

- A dependable central platform for the Marine Department's maritime data, in daily use by operational users.
- The v2 feature migration is complete and built against v1 parity, with large automated test suites on both the backend and the frontend.
- MDM v2 is now in user acceptance testing and cutover readiness, ahead of a staged production switchover.
