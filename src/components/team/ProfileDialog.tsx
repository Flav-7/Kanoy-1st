import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getMyProfile, saveMyProfile } from "@/lib/team/team.functions";
import { TEAM_COPY } from "./team-i18n";

const fieldClass =
  "w-full border-b border-studio-foreground/20 bg-transparent py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none";

/** Name and job title; the job title replaces the name across the calendar. */
export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { language } = useLanguage();
  const t = TEAM_COPY[language];
  const { refresh } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    getMyProfile()
      .then((res) => {
        if (res.ok && res.value) {
          setName(res.value.name);
          setJobTitle(res.value.jobTitle ?? "");
          setEmail(res.value.email);
        }
      })
      .catch(() => setMessage({ kind: "error", text: t.errors.UNKNOWN }));
  }, [open, t.errors.UNKNOWN]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await saveMyProfile({ data: { name, jobTitle } });
      if (!res.ok) {
        setMessage({ kind: "error", text: t.errors[res.error] });
        return;
      }
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setMessage({ kind: "ok", text: t.profile.saved });
    } catch (err) {
      console.error(err);
      setMessage({ kind: "error", text: t.errors.UNKNOWN });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md border-white/10 bg-ink p-8 text-studio-foreground shadow-2xl sm:rounded-xl md:p-10">
        <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
          {t.profile.title}
        </DialogTitle>
        <DialogDescription className="text-sm text-studio-muted">
          {t.profile.text}
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-5" noValidate>
          <p className="text-xs text-studio-muted">{email}</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.profile.name}
            </span>
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.profile.jobTitle}
            </span>
            <input
              maxLength={60}
              value={jobTitle}
              placeholder={t.profile.jobTitlePlaceholder}
              onChange={(e) => setJobTitle(e.target.value)}
              className={fieldClass}
            />
          </label>
          {message && (
            <p
              role={message.kind === "error" ? "alert" : "status"}
              className={`text-sm ${message.kind === "error" ? "text-destructive" : "text-accent"}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-kanoy mt-2 self-end bg-accent text-ink disabled:opacity-60"
          >
            {t.save}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
