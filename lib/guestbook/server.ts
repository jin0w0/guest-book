import { createDrizzleEntryStore } from "./drizzle-store";
import { createGuestbook, type Guestbook } from "./guestbook";

let instance: Guestbook | undefined;

/** 운영용 방명록 모듈. DATABASE_URL은 첫 사용 시점에 읽는다. */
export function getGuestbook(): Guestbook {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
    instance = createGuestbook({ store: createDrizzleEntryStore(url) });
  }
  return instance;
}
