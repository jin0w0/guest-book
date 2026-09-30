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

export type EntryFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string; values: { message: string; password: string } };

const DENIED_MESSAGES = {
  "wrong-password": "비밀번호가 일치하지 않습니다.",
  "not-found": "이미 삭제된 방명록 글입니다.",
} as const;

function entryId(formData: FormData): number {
  return Number(text(formData, "id"));
}

export async function editMessageAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const values = { message: text(formData, "message"), password: text(formData, "password") };
  const result = await getGuestbook().editMessage({ id: entryId(formData), ...values });
  if (!result.ok) {
    const error =
      result.reason === "invalid" ? (result.errors.message ?? "") : DENIED_MESSAGES[result.reason];
    return { status: "error", error, values };
  }

  revalidatePath("/");
  return { status: "success" };
}

export async function removeEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const password = text(formData, "password");
  const result = await getGuestbook().remove({ id: entryId(formData), password });
  if (!result.ok) {
    return { status: "error", error: DENIED_MESSAGES[result.reason], values: { message: "", password } };
  }

  revalidatePath("/");
  return { status: "success" };
}
