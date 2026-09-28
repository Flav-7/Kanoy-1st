import { useEffect, type ReactNode } from "react";
import { Delete } from "lucide-react";
import { PIN_LENGTH } from "@/lib/app/pin";

/**
 * The code entry of the lock screen: dots on top, a 3×4 keypad below (like a
 * banking app). Physical keyboards work too. `leftKey` fills the bottom-left
 * slot (the Face ID button); `shake` replays the wrong-code animation.
 */
export function PinPad({
  value,
  onChange,
  onComplete,
  leftKey,
  disabled,
  shake,
  deleteLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  leftKey?: ReactNode;
  disabled?: boolean;
  shake?: number;
  deleteLabel: string;
}) {
  const press = (digit: string) => {
    if (disabled || value.length >= PIN_LENGTH) return;
    const next = value + digit;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete?.(next);
  };
  const erase = () => !disabled && onChange(value.slice(0, -1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") erase();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const key =
    "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white/[0.07] text-2xl font-light text-studio-foreground transition-colors active:bg-white/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-20 sm:w-20";

  return (
    <div className="flex flex-col items-center">
      <div
        key={shake}
        role="status"
        aria-label={`${value.length}/${PIN_LENGTH}`}
        className={`mb-10 flex gap-4 ${shake ? "animate-[pin-shake_0.4s_ease-in-out]" : ""}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border transition-colors ${
              i < value.length ? "border-accent bg-accent" : "border-white/40"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-7 gap-y-4 sm:gap-x-9">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => press(d)}
            className={key}
          >
            {d}
          </button>
        ))}
        <div className="flex items-center justify-center">{leftKey}</div>
        <button type="button" disabled={disabled} onClick={() => press("0")} className={key}>
          0
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={erase}
          aria-label={deleteLabel}
          className={`${key} bg-transparent`}
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
