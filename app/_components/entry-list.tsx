import type { Entry } from "@/lib/guestbook/guestbook";
import { formatKoreanTime } from "@/lib/format";
import { EntryItem } from "./entry-item";

export function EntryList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">아직 남겨진 방명록 글이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryItem
          key={entry.id}
          id={entry.id}
          name={entry.name}
          message={entry.message}
          createdAt={entry.createdAt.toISOString()}
          createdAtText={formatKoreanTime(entry.createdAt)}
          edited={entry.updatedAt !== null}
        />
      ))}
    </ul>
  );
}
