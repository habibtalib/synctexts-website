---
title: "Building Scalable APIs with Node.js"
date: 2026-02-15
excerpt: "Design patterns and architectural strategies for building APIs that handle millions of requests."
tags: ["Node.js", "API", "Backend"]
draft: false
---

Building an API that serves a handful of users is straightforward. Building one that gracefully handles millions of requests per day while remaining maintainable requires deliberate architectural decisions from the start. In this post, we walk through the patterns we use at SyncTexts when designing production-grade Node.js APIs.

## Layered Architecture

The single most impactful decision is separating your code into clear layers. We follow a three-layer pattern: **routes** (HTTP concerns), **services** (business logic), and **repositories** (data access). This separation means your business logic never imports Express, and your route handlers never write SQL.

```typescript
// services/user.service.ts
import type { UserRepository } from '../repositories/user.repository';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    return user;
  }

  async createUser(data: CreateUserInput) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
    return this.userRepo.create(data);
  }
}
```

This pattern makes testing trivial -- inject a mock repository and test business rules in isolation, without spinning up a database or HTTP server.

## Rate Limiting and Caching

At scale, not every request should hit your database. We use a two-tier caching strategy: an in-memory LRU cache for hot data (user sessions, feature flags) and Redis for shared state across multiple Node.js processes.

Rate limiting belongs at the infrastructure layer, not in application code. We deploy it as middleware that checks a sliding window counter in Redis, returning `429 Too Many Requests` before the request ever reaches business logic.

## Connection Pooling

One of the most common performance bottlenecks we see in client codebases is missing or misconfigured connection pooling. Every database query that opens and closes a TCP connection adds 5-10ms of overhead. With a properly configured pool, connections are reused, and queries execute in under 1ms for simple lookups.

```typescript
// config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Structured Logging

JSON-structured logs are non-negotiable in production. They enable filtering, alerting, and correlation across distributed services. Every request gets a unique trace ID injected via middleware, and every log line includes it. When something goes wrong at 3 AM, you can trace a single request across every service it touched.

## Key Takeaways

The patterns above are not novel -- they are battle-tested. The difference between a prototype API and a production API is not cleverness; it is discipline in applying these fundamentals consistently across every endpoint, every service, and every deployment.
