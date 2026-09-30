import { describe, expect, it } from "vitest";
import { createGuestbook } from "./guestbook";
import { createMemoryEntryStore } from "./memory-store";

function setup() {
  let clock = new Date("2026-09-30T05:00:00Z").getTime();
  const guestbook = createGuestbook({
    store: createMemoryEntryStore(),
    now: () => new Date(clock),
  });
  const advance = (ms: number) => {
    clock += ms;
  };
  return { guestbook, advance };
}

describe("방명록 글 작성과 목록 조회", () => {
  it("작성한 방명록 글이 목록에 나타나고 비밀번호는 드러나지 않는다", async () => {
    const { guestbook } = setup();

    const result = await guestbook.write({
      name: "철수",
      message: "안녕하세요",
      password: "1234",
    });

    expect(result.ok).toBe(true);
    const entries = await guestbook.list();
    expect(entries).toEqual([
      {
        id: expect.any(Number),
        name: "철수",
        message: "안녕하세요",
        createdAt: new Date("2026-09-30T05:00:00Z"),
        updatedAt: null,
      },
    ]);
  });

  it("목록은 작성 시각 최신순이고, 같은 시각이면 나중에 남긴 방명록 글이 위에 온다", async () => {
    const { guestbook, advance } = setup();
    const valid = { message: "안녕", password: "1234" };

    await guestbook.write({ ...valid, name: "첫째" });
    advance(60_000);
    await guestbook.write({ ...valid, name: "둘째" });
    await guestbook.write({ ...valid, name: "셋째" });

    const names = (await guestbook.list()).map((entry) => entry.name);
    expect(names).toEqual(["셋째", "둘째", "첫째"]);
  });

  it.each([
    ["이름이 비었을 때", { name: "" }, "name"],
    ["이름이 공백뿐일 때", { name: "   " }, "name"],
    ["이름이 20자를 넘을 때", { name: "가".repeat(21) }, "name"],
    ["메시지가 공백뿐일 때", { message: " \n " }, "message"],
    ["메시지가 500자를 넘을 때", { message: "가".repeat(501) }, "message"],
    ["비밀번호가 4자 미만일 때", { password: "123" }, "password"],
    ["비밀번호가 32자를 넘을 때", { password: "a".repeat(33) }, "password"],
  ] as const)("%s 해당 항목의 입력 오류로 거부되고 남겨지지 않는다", async (_, override, field) => {
    const { guestbook } = setup();

    const result = await guestbook.write({
      name: "철수",
      message: "안녕하세요",
      password: "1234",
      ...override,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid");
    expect(Object.keys(result.errors)).toEqual([field]);
    expect(await guestbook.list()).toEqual([]);
  });

  it("여러 항목이 잘못되면 모든 항목의 입력 오류를 함께 알려 준다", async () => {
    const { guestbook } = setup();

    const result = await guestbook.write({ name: "", message: "", password: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["message", "name", "password"]);
  });

  it("경계 길이(이름 20자, 메시지 500자, 비밀번호 4자와 32자)는 허용된다", async () => {
    const { guestbook } = setup();

    const short = await guestbook.write({
      name: "가".repeat(20),
      message: "가".repeat(500),
      password: "1234",
    });
    const long = await guestbook.write({
      name: "영희",
      message: "안녕",
      password: "a".repeat(32),
    });

    expect(short.ok).toBe(true);
    expect(long.ok).toBe(true);
  });

  it("이름과 메시지의 앞뒤 공백은 정리하고, 메시지 안의 줄바꿈은 그대로 둔다", async () => {
    const { guestbook } = setup();

    await guestbook.write({
      name: "  철수  ",
      message: "\n 첫 줄\n둘째 줄 \n",
      password: "1234",
    });

    const [entry] = await guestbook.list();
    expect(entry.name).toBe("철수");
    expect(entry.message).toBe("첫 줄\n둘째 줄");
  });

  it("다른 사람과 같은 이름으로도 방명록 글을 남길 수 있다", async () => {
    const { guestbook } = setup();

    await guestbook.write({ name: "철수", message: "하나", password: "1234" });
    const second = await guestbook.write({ name: "철수", message: "둘", password: "5678" });

    expect(second.ok).toBe(true);
    expect(await guestbook.list()).toHaveLength(2);
  });
});

describe("메시지 수정", () => {
  async function withEntry() {
    const ctx = setup();
    const result = await ctx.guestbook.write({
      name: "철수",
      message: "처음 메시지",
      password: "1234",
    });
    if (!result.ok) throw new Error("setup failed");
    return { ...ctx, id: result.entry.id };
  }

  it("맞는 비밀번호로 수정하면 메시지와 수정 시각만 바뀐다", async () => {
    const { guestbook, advance, id } = await withEntry();
    advance(5 * 60_000);

    const result = await guestbook.editMessage({ id, password: "1234", message: "  고친 메시지\n" });

    expect(result).toEqual({ ok: true });
    expect(await guestbook.list()).toEqual([
      {
        id,
        name: "철수",
        message: "고친 메시지",
        createdAt: new Date("2026-09-30T05:00:00Z"),
        updatedAt: new Date("2026-09-30T05:05:00Z"),
      },
    ]);
  });

  it("틀린 비밀번호로 수정하면 비밀번호 불일치로 거부되고 메시지는 그대로다", async () => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.editMessage({ id, password: "0000", message: "몰래 고침" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
    const [entry] = await guestbook.list();
    expect(entry.message).toBe("처음 메시지");
    expect(entry.updatedAt).toBeNull();
  });

  it("없는 방명록 글을 수정하면 이미 삭제된 방명록 글로 거부된다", async () => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.editMessage({ id: id + 1, password: "1234", message: "고침" });

    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it.each([
    ["공백뿐인 새 메시지", " \n "],
    ["500자를 넘는 새 메시지", "가".repeat(501)],
  ])("%s는 메시지 입력 오류로 거부된다", async (_, message) => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.editMessage({ id, password: "1234", message });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid");
    if (result.reason !== "invalid") return;
    expect(Object.keys(result.errors)).toEqual(["message"]);
    expect((await guestbook.list())[0].message).toBe("처음 메시지");
  });

  it("비밀번호 확인이 새 메시지 검증보다 먼저다", async () => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.editMessage({ id, password: "0000", message: "" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
  });

  it("수정해도 목록 순서는 작성 시각 기준 그대로다", async () => {
    const { guestbook, advance, id } = await withEntry();
    advance(60_000);
    await guestbook.write({ name: "영희", message: "나중 글", password: "5678" });
    advance(60_000);

    await guestbook.editMessage({ id, password: "1234", message: "고침" });

    const names = (await guestbook.list()).map((entry) => entry.name);
    expect(names).toEqual(["영희", "철수"]);
  });

  it("이름이 같아도 다른 사람의 비밀번호로는 수정할 수 없다", async () => {
    const { guestbook, id } = await withEntry();
    await guestbook.write({ name: "철수", message: "다른 철수", password: "5678" });

    const result = await guestbook.editMessage({ id, password: "5678", message: "고침" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
  });
});

describe("방명록 글 삭제", () => {
  async function withEntry() {
    const ctx = setup();
    const result = await ctx.guestbook.write({ name: "철수", message: "안녕", password: "1234" });
    if (!result.ok) throw new Error("setup failed");
    return { ...ctx, id: result.entry.id };
  }

  it("맞는 비밀번호로 삭제하면 목록에서 사라진다", async () => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.remove({ id, password: "1234" });

    expect(result).toEqual({ ok: true });
    expect(await guestbook.list()).toEqual([]);
  });

  it("틀린 비밀번호로 삭제하면 비밀번호 불일치로 거부되고 방명록 글은 남는다", async () => {
    const { guestbook, id } = await withEntry();

    const result = await guestbook.remove({ id, password: "0000" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
    expect(await guestbook.list()).toHaveLength(1);
  });

  it("이미 삭제한 방명록 글을 다시 삭제하거나 수정하면 이미 삭제된 방명록 글로 거부된다", async () => {
    const { guestbook, id } = await withEntry();
    await guestbook.remove({ id, password: "1234" });

    expect(await guestbook.remove({ id, password: "1234" })).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(await guestbook.editMessage({ id, password: "1234", message: "고침" })).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("이름이 같아도 다른 사람의 비밀번호로는 삭제할 수 없다", async () => {
    const { guestbook, id } = await withEntry();
    await guestbook.write({ name: "철수", message: "다른 철수", password: "5678" });

    const result = await guestbook.remove({ id, password: "5678" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
    expect(await guestbook.list()).toHaveLength(2);
  });
});
