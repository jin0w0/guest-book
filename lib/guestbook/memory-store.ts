import { isValidEntryId, type EntryStore, type StoredEntry } from "./store";

/** Postgres처럼 integer 범위를 벗어난 id는 예외로 거부한다. */
function assertId(id: number): void {
  if (!isValidEntryId(id)) throw new Error(`invalid entry id: ${id}`);
}

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
      assertId(id);
      const row = rows.get(id);
      return row ? { ...row } : null;
    },
    async updateMessage(id, message, updatedAt) {
      assertId(id);
      const row = rows.get(id);
      if (!row) return false;
      rows.set(id, { ...row, message, updatedAt });
      return true;
    },
    async delete(id) {
      assertId(id);
      return rows.delete(id);
    },
  };
}
