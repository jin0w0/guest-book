import { hashPassword } from "./password";
import type { EntryStore, StoredEntry } from "./store";
import { validate, type FieldErrors } from "./validation";

export type { FieldErrors } from "./validation";

/** 목록에 보이는 방명록 글. 비밀번호 해시는 절대 포함하지 않는다. */
export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type WriteInput = { name: string; message: string; password: string };

export type Invalid = { ok: false; reason: "invalid"; errors: FieldErrors };

export type WriteResult = { ok: true; entry: Entry } | Invalid;

type Deps = { store: EntryStore; now?: () => Date };

export function createGuestbook({ store, now = () => new Date() }: Deps) {
  return {
    async write(input: WriteInput): Promise<WriteResult> {
      const name = input.name.trim();
      const message = input.message.trim();
      // 비밀번호는 입력 그대로 쓴다. 공백도 비밀번호의 일부다.
      const errors = validate({ name, message, password: input.password });
      if (hasErrors(errors)) return { ok: false, reason: "invalid", errors };

      const stored = await store.insert({
        name,
        message,
        passwordHash: await hashPassword(input.password),
        createdAt: now(),
      });
      return { ok: true, entry: toEntry(stored) };
    },

    async list(): Promise<Entry[]> {
      return (await store.all()).sort(newestFirst).map(toEntry);
    },
  };
}

export type Guestbook = ReturnType<typeof createGuestbook>;

/** 작성 시각 내림차순, 같으면 id 내림차순. 수정 시각은 순서에 영향을 주지 않는다. */
function newestFirst(a: StoredEntry, b: StoredEntry): number {
  return b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

function toEntry({ id, name, message, createdAt, updatedAt }: StoredEntry): Entry {
  return { id, name, message, createdAt, updatedAt };
}
