import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { guestbookEntries } from "@/db/schema";
import type { EntryStore } from "./store";

export function createDrizzleEntryStore(databaseUrl: string): EntryStore {
  const db = drizzle(neon(databaseUrl));

  return {
    async insert(entry) {
      const [row] = await db.insert(guestbookEntries).values(entry).returning();
      return row;
    },
    async all() {
      return db.select().from(guestbookEntries);
    },
    async findById(id) {
      const [row] = await db
        .select()
        .from(guestbookEntries)
        .where(eq(guestbookEntries.id, id));
      return row ?? null;
    },
    async updateMessage(id, message, updatedAt) {
      const rows = await db
        .update(guestbookEntries)
        .set({ message, updatedAt })
        .where(eq(guestbookEntries.id, id))
        .returning({ id: guestbookEntries.id });
      return rows.length > 0;
    },
    async delete(id) {
      const rows = await db
        .delete(guestbookEntries)
        .where(eq(guestbookEntries.id, id))
        .returning({ id: guestbookEntries.id });
      return rows.length > 0;
    },
  };
}
