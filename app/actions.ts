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
  /** 방명록 글이 이미 없다. 안내를 보인 뒤 화면에서 목록을 새로 고친다. */
  | { status: "gone"; values: EntryFormValues }
  | { status: "error"; error: string; values: EntryFormValues };

type EntryFormValues = { message: string; password: string };

const WRONG_PASSWORD_MESSAGE = "비밀번호가 일치하지 않습니다.";

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
    if (result.reason === "not-found") return { status: "gone", values };
    const error =
      result.reason === "invalid" ? (result.errors.message ?? "") : WRONG_PASSWORD_MESSAGE;
    return { status: "error", error, values };
  }

  revalidatePath("/");
  return { status: "success" };
}

export async function removeEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const values = { message: "", password: text(formData, "password") };
  const result = await getGuestbook().remove({ id: entryId(formData), password: values.password });
  if (!result.ok) {
    if (result.reason === "not-found") return { status: "gone", values };
    return { status: "error", error: WRONG_PASSWORD_MESSAGE, values };
  }

  revalidatePath("/");
  return { status: "success" };
}
