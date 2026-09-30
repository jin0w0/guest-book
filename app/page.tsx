import { connection } from "next/server";
import { getGuestbook } from "@/lib/guestbook/server";
import { EntryList } from "./_components/entry-list";
import { WriteForm } from "./_components/write-form";

export default async function Home() {
  await connection();
  const entries = await getGuestbook().list();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">방명록</h1>
      <WriteForm />
      <EntryList entries={entries} />
    </main>
  );
}
