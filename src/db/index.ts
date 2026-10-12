import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const dbDir = path.join(process.cwd(), 'data');
mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'submissions.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('synchronous = NORMAL');

// The drizzle migrations only ALTER an existing table — there is no base
// CREATE TABLE migration — so a fresh volume would 500 on every query.
// Mirrors drizzle/meta/0001_snapshot.json; a no-op on existing databases.
sqlite.exec(`CREATE TABLE IF NOT EXISTS \`submissions\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`name\` text NOT NULL,
  \`email\` text NOT NULL,
  \`company\` text,
  \`message\` text NOT NULL,
  \`ip\` text,
  \`created_at\` text NOT NULL,
  \`read\` integer DEFAULT false NOT NULL,
  \`rate_limited\` integer DEFAULT false NOT NULL,
  \`service_type\` text,
  \`budget\` text,
  \`timeline\` text,
  \`lead_score\` integer,
  \`lead_status\` text DEFAULT 'new' NOT NULL,
  \`notes\` text,
  \`hubspot_id\` text,
  \`hubspot_synced_at\` text,
  \`cal_booking_uid\` text,
  \`cal_scheduled_at\` text
)`);

export { sqlite };
export const db = drizzle({ client: sqlite, schema });
