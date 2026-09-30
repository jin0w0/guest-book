export const LIMITS = {
  name: { min: 1, max: 20 },
  message: { min: 1, max: 500 },
  password: { min: 4, max: 32 },
} as const;

export type Field = keyof typeof LIMITS;
export type FieldErrors = Partial<Record<Field, string>>;

const LABELS: Record<Field, string> = {
  name: "이름",
  message: "메시지",
  password: "비밀번호",
};

/** 글자 수는 코드 포인트 단위로 센다(이모지 하나 = 1자). */
function length(value: string): number {
  return [...value].length;
}

function check(field: Field, value: string): string | undefined {
  const { min, max } = LIMITS[field];
  const label = LABELS[field];
  if (length(value) < min) {
    return min === 1 ? `${label}을(를) 입력해 주세요.` : `${label}은(는) ${min}자 이상이어야 합니다.`;
  }
  if (length(value) > max) return `${label}은(는) ${max}자 이하여야 합니다.`;
  return undefined;
}

export function validate(values: Partial<Record<Field, string>>): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of Object.keys(values) as Field[]) {
    const error = check(field, values[field]!);
    if (error) errors[field] = error;
  }
  return errors;
}
