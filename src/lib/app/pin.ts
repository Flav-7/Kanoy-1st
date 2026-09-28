/** Shared by the keypad and the server (server/applock.ts re-checks everything). */
export const PIN_LENGTH = 6;

/** 6 digits, and not one of the codes everyone tries first (repeated or in sequence). */
export function pinProblem(pin: string): "format" | "too_simple" | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return "format";
  const digits = pin.split("").map(Number);
  const same = digits.every((d) => d === digits[0]);
  const ascending = digits.every((d, i) => i === 0 || d === (digits[i - 1]! + 1) % 10);
  const descending = digits.every((d, i) => i === 0 || d === (digits[i - 1]! + 9) % 10);
  return same || ascending || descending ? "too_simple" : null;
}
