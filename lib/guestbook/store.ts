export type StoredEntry = {
  id: number;
  name: string;
  message: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type NewStoredEntry = Omit<StoredEntry, "id" | "updatedAt">;

/** 방명록 글의 영속화만 담당한다. 규칙은 방명록 모듈이 가진다. */
export interface EntryStore {
  insert(entry: NewStoredEntry): Promise<StoredEntry>;
  all(): Promise<StoredEntry[]>;
  findById(id: number): Promise<StoredEntry | null>;
  updateMessage(id: number, message: string, updatedAt: Date): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
