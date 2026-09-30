import { connection } from "next/server";
import { getGuestbook } from "@/lib/guestbook/server";
import { EntryList } from "./_components/entry-list";
import { WriteForm } from "./_components/write-form";

export default async function Home() {
  await connection();
  const entries = await getGuestbook().list();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">방명록</h1>
        <p className="text-sm text-zinc-500">황지인 · 202404340</p>
      </header>
      <WriteForm />
      <EntryList entries={entries} />
    </main>
  );
}
