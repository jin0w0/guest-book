"use server";

import { revalidatePath } from "next/cache";
import type { FieldErrors } from "@/lib/guestbook/guestbook";
import { getGuestbook } from "@/lib/guestbook/server";

export type WriteFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "invalid";
      errors: FieldErrors;
      values: { name: string; message: string; password: string };
    };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function writeEntryAction(
  _prev: WriteFormState,
  formData: FormData,
): Promise<WriteFormState> {
  const values = {
    name: text(formData, "name"),
    message: text(formData, "message"),
    password: text(formData, "password"),
  };
  const result = await getGuestbook().write(values);
  if (!result.ok) return { status: "invalid", errors: result.errors, values };

  revalidatePath("/");
  return { status: "success" };
}
