import type { Entry } from "@/lib/guestbook/guestbook";
import { formatKoreanTime } from "@/lib/format";

export function EntryList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">아직 남겨진 방명록 글이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{entry.name}</span>
            <time dateTime={entry.createdAt.toISOString()} className="text-xs text-zinc-500">
              {formatKoreanTime(entry.createdAt)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.message}</p>
        </li>
      ))}
    </ul>
  );
}
