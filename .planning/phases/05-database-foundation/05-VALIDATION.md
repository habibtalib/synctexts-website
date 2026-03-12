---
phase: 5
slug: database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | Manual verification only |
| **Full suite command** | Manual verification only |
| **Estimated runtime** | ~30 seconds (manual checks) |

---

## Sampling Rate

- **After every task commit:** Manual inspection of generated SQL / schema changes
- **After every plan wave:** Manual DB verification (see Manual-Only Verifications)
- **Before `/gsd:verify-work`:** All manual verification steps must pass
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | INFRA-01 | manual-only | N/A | N/A | ⬜ pending |
| TBD | 01 | 1 | INFRA-02 | manual-only | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — verification is manual per CLAUDE.md.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `db:generate` creates migration SQL with correct ALTER TABLE statements | INFRA-01 | No test framework; one-time migration verification | 1. Run `npm run db:generate` 2. Open `drizzle/0000_*.sql` 3. Verify 8 `ALTER TABLE submissions ADD COLUMN` statements (not CREATE TABLE) |
| `db:migrate` applies migration without data loss | INFRA-01 | Requires actual DB file; destructive if wrong | 1. Copy `data/submissions.db` to temp location 2. Run `npm run db:migrate` on copy 3. Verify `.bak` file created 4. Query DB: all existing rows preserved + 8 new columns exist |
| `drizzle-kit push` absent from npm scripts | INFRA-01 | One-time config check | Inspect `package.json` — no script uses `drizzle-kit push` |
| WAL journal mode active on connection | INFRA-02 | Requires runtime DB connection | 1. Start app or run DB init 2. `sqlite3 data/submissions.db "PRAGMA journal_mode;"` → must return `wal` |
| busy_timeout = 5000 on connection | INFRA-02 | Per-connection PRAGMA; requires runtime check | 1. Add temporary `console.log(sqlite.pragma('busy_timeout'))` or check via sqlite3 CLI after app startup |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined
- [ ] Sampling continuity: manual check after each task commit
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
