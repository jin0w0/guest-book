export type StoredEntry = {
  id: number;
  name: string;
  message: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type NewStoredEntry = Omit<StoredEntry, "id" | "updatedAt">;

/**
 * 방명록 글의 영속화만 담당한다. 규칙은 방명록 모듈이 가진다.
 * id는 Postgres integer 범위(1 ~ 2^31-1)의 정수만 받는다. 그 밖의 값은 구현이 예외를 던질 수 있다.
 */
export interface EntryStore {
  insert(entry: NewStoredEntry): Promise<StoredEntry>;
  all(): Promise<StoredEntry[]>;
  findById(id: number): Promise<StoredEntry | null>;
  updateMessage(id: number, message: string, updatedAt: Date): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}

export const MAX_ENTRY_ID = 2 ** 31 - 1;

export function isValidEntryId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= MAX_ENTRY_ID;
}
