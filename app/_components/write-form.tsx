"use client";

import { useActionState } from "react";
import { writeEntryAction, type WriteFormState } from "@/app/actions";

const initialState: WriteFormState = { status: "idle" };

export function WriteForm() {
  const [state, action, pending] = useActionState(writeEntryAction, initialState);
  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" ? state.values : undefined;

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Field label="이름" error={errors.name}>
          <input
            name="name"
            required
            maxLength={20}
            defaultValue={values?.name}
            autoComplete="nickname"
            className={inputClass}
          />
        </Field>
        <Field label="비밀번호" error={errors.password}>
          <input
            name="password"
            type="password"
            required
            minLength={4}
            maxLength={32}
            defaultValue={values?.password}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="메시지" error={errors.message}>
        <textarea
          name="message"
          required
          maxLength={500}
          rows={3}
          defaultValue={values?.message}
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "남기는 중…" : "남기기"}
      </button>
    </form>
  );
}

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}
