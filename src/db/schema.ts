import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  message: text('message').notNull(),
  ip: text('ip'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  rateLimited: integer('rate_limited', { mode: 'boolean' }).notNull().default(false),
});
