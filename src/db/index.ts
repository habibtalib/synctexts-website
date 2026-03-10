import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const dbDir = path.join(process.cwd(), 'data');
mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'submissions.db');
const sqlite = new Database(dbPath);

export const db = drizzle({ client: sqlite, schema });
