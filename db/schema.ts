import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const guestbookEntries = pgTable("guestbook_entries", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  message: text().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
