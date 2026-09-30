import type { EntryStore, StoredEntry } from "./store";

export function createMemoryEntryStore(): EntryStore {
  const rows = new Map<number, StoredEntry>();
  let nextId = 1;

  return {
    async insert(entry) {
      const row = { ...entry, id: nextId++, updatedAt: null };
      rows.set(row.id, row);
      return { ...row };
    },
    async all() {
      return [...rows.values()].map((row) => ({ ...row }));
    },
    async findById(id) {
      const row = rows.get(id);
      return row ? { ...row } : null;
    },
    async updateMessage(id, message, updatedAt) {
      const row = rows.get(id);
      if (!row) return false;
      rows.set(id, { ...row, message, updatedAt });
      return true;
    },
    async delete(id) {
      return rows.delete(id);
    },
  };
}
