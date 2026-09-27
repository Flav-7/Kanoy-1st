import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useDismiss } from "@/components/kanoy/useDismiss";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { currentPushState, disablePush, enablePush, type PushState } from "@/lib/team/push-client";
import { TEAM_COPY } from "./team-i18n";

/**
 * Bell in the calendar header: shows whether this device gets notifications
 * for new/changed activities in the user's areas, and turns them on/off.
 * Each phone/computer is subscribed separately.
 */
export function NotificationsButton() {
  const { language } = useLanguage();
  const t = TEAM_COPY[language].notifications;
  const [state, setState] = useState<PushState | "unconfigured" | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(open, rootRef, () => setOpen(false));

  useEffect(() => {
    currentPushState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (state === "on") {
        await disablePush();
        setState("off");
      } else {
        setState(await enablePush());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (state === null) return null;
  const Icon = state === "on" ? BellRing : state === "off" ? Bell : BellOff;
  const message =
    state === "on"
      ? t.on
      : state === "off"
        ? t.off
        : state === "install"
          ? t.install
          : state === "denied"
            ? t.denied
            : state === "unconfigured"
              ? t.unconfigured
              : t.unsupported;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t.label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          state === "on" ? "border-accent text-accent" : "border-white/15 text-studio-muted"
        }`}
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t.label}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-ink p-4 text-sm text-studio-foreground shadow-2xl"
        >
          <p className="leading-relaxed">{message}</p>
          {(state === "on" || state === "off") && (
            <button
              type="button"
              disabled={busy}
              onClick={toggle}
              className={`mt-3 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-60 ${
                state === "on"
                  ? "border border-white/15 text-studio-foreground"
                  : "bg-accent text-ink"
              }`}
            >
              {state === "on" ? t.disable : t.enable}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
