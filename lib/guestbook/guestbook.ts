import { hashPassword, verifyPassword } from "./password";
import { isValidEntryId, type EntryStore, type StoredEntry } from "./store";
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

export type EditInput = { id: number; password: string; message: string };

export type Denied =
  | { ok: false; reason: "wrong-password" }
  | { ok: false; reason: "not-found" };

export type EditResult = { ok: true } | Denied | Invalid;

export type RemoveInput = { id: number; password: string };

export type RemoveResult = { ok: true } | Denied;

const NOT_FOUND ={ ok: false, reason: "not-found" } as const;
const WRONG_PASSWORD = { ok: false, reason: "wrong-password" } as const;

type Deps ={ store: EntryStore; now?: () => Date };

export function createGuestbook({ store, now = () => new Date() }: Deps) {
  /** 방명록 글이 있고 비밀번호가 맞으면 null, 아니면 거부 사유. */
  async function authorize(id: number, password: string): Promise<Denied | null> {
    // 존재할 수 없는 id(조작된 요청 등)는 저장소에 묻지 않고 없는 방명록 글로 본다.
    if (!isValidEntryId(id)) return NOT_FOUND;
    const stored = await store.findById(id);
    if (!stored) return NOT_FOUND;
    if (!(await verifyPassword(password, stored.passwordHash))) return WRONG_PASSWORD;
    return null;
  }

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

    async editMessage(input: EditInput): Promise<EditResult> {
      const denied = await authorize(input.id, input.password);
      if (denied) return denied;

      const message = input.message.trim();
      const errors = validate({ message });
      if (hasErrors(errors)) return { ok: false, reason: "invalid", errors };

      // 확인과 갱신 사이에 다른 요청이 지웠을 수도 있다.
      const updated = await store.updateMessage(input.id, message, now());
      return updated ? { ok: true } : NOT_FOUND;
    },

    async remove(input: RemoveInput): Promise<RemoveResult> {
      const denied = await authorize(input.id, input.password);
      if (denied) return denied;

      const deleted = await store.delete(input.id);
      return deleted ? { ok: true } : NOT_FOUND;
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
