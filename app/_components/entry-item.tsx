"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { editMessageAction, removeEntryAction, type EntryFormState } from "@/app/actions";
import { inputClass } from "./write-form";

type Props = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  createdAtText: string;
  edited: boolean;
};

type Mode = "view" | "edit" | "remove";

export function EntryItem(props: Props) {
  const [mode, setMode] = useState<Mode>("view");

  return (
    <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{props.name}</span>
        <span className="text-xs text-zinc-500">
          <time dateTime={props.createdAt}>{props.createdAtText}</time>
          {props.edited && " (수정됨)"}
        </span>
      </div>

      {mode === "edit" ? (
        <EditForm id={props.id} message={props.message} onDone={() => setMode("view")} />
      ) : (
        <>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{props.message}</p>
          {mode === "remove" ? (
            <RemoveForm id={props.id} onCancel={() => setMode("view")} />
          ) : (
            <div className="mt-3 flex justify-end gap-2">
              <SmallButton onClick={() => setMode("edit")}>수정</SmallButton>
              <SmallButton onClick={() => setMode("remove")}>삭제</SmallButton>
            </div>
          )}
        </>
      )}
    </li>
  );
}

function EditForm({ id, message, onDone }: { id: number; message: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: EntryFormState, formData: FormData) => {
      const next = await editMessageAction(prev, formData);
      if (next.status === "success") onDone();
      return next;
    },
    { status: "idle" },
  );
  const values = state.status === "idle" || state.status === "success" ? undefined : state.values;

  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="message"
        aria-label="메시지"
        required
        maxLength={500}
        rows={3}
        defaultValue={values?.message ?? message}
        className={inputClass}
      />
      {/* 방명록 글이 이미 없어도 편집하던 메시지는 남겨 둔다(다시 남길 때 복사할 수 있게). */}
      {state.status === "gone" ? (
        <GoneNotice />
      ) : (
        <PasswordRow pending={pending} submitLabel="저장" onCancel={onDone} defaultValue={values?.password} />
      )}
      {state.status === "error" && <ErrorText>{state.error}</ErrorText>}
    </form>
  );
}

/** 성공하면 방명록 글이 목록에서 사라지므로 이 폼도 함께 없어진다. */
function RemoveForm({ id, onCancel }: { id: number; onCancel: () => void }) {
  const [state, action, pending] = useActionState(removeEntryAction, { status: "idle" });
  const values = state.status === "error" ? state.values : undefined;
  if (state.status === "gone") return <GoneNotice />;

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <PasswordRow pending={pending} submitLabel="삭제" onCancel={onCancel} defaultValue={values?.password} />
      {state.status === "error" && <ErrorText>{state.error}</ErrorText>}
    </form>
  );
}

/** 다른 곳에서 먼저 지워진 방명록 글. 안내를 읽은 뒤 목록을 새로 고친다. */
function GoneNotice() {
  const router = useRouter();

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <ErrorText>이미 삭제된 방명록 글입니다.</ErrorText>
      <SmallButton onClick={() => router.refresh()}>확인</SmallButton>
    </div>
  );
}

function PasswordRow({
  pending,
  submitLabel,
  onCancel,
  defaultValue,
}: {
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        name="password"
        type="password"
        aria-label="비밀번호"
        placeholder="비밀번호"
        required
        maxLength={32}
        defaultValue={defaultValue}
        autoComplete="current-password"
        className={`${inputClass} sm:flex-1`}
      />
      <div className="flex justify-end gap-2">
        <SmallButton onClick={onCancel}>취소</SmallButton>
        <SmallButton type="submit" disabled={pending} primary>
          {submitLabel}
        </SmallButton>
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}

function SmallButton({
  primary,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  const look = primary
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "border border-zinc-300 dark:border-zinc-700";
  return (
    <button
      type={type}
      className={`rounded-md px-3 py-1 text-sm disabled:opacity-50 ${look}`}
      {...rest}
    />
  );
}
