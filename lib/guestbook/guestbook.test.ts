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
