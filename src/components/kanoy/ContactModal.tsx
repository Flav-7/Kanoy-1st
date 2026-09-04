import { useState, type FormEvent, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, translations, type Language } from "@/lib/i18n/translations";
import { sendContactEmail } from "@/lib/contact/send-contact-email";
import { FLAGS } from "./flags";

const CONTACT_EMAIL = "hello@kanoy.studio";

type Step = "choice" | "form" | "success" | "error";

const fieldClass =
  "w-full border-b border-studio-foreground/20 bg-transparent py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function ContactModal() {
  const { dict, language } = useLanguage();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choice");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [replyLanguage, setReplyLanguage] = useState<Language>(language);
  const m = translations[replyLanguage].contact.modal;

  const reset = () => {
    setStep("choice");
    setPending(false);
    setForm({ name: "", email: "", phone: "", message: "" });
    setReplyLanguage(language);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await sendContactEmail({
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          replyLanguage,
        },
      });
      setStep("success");
    } catch (err) {
      console.error(err);
      setStep("error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="btn-kanoy bg-accent text-ink">
          {dict.contact.contactBtn}
        </button>
      </DialogTrigger>
      <DialogContent className="w-[92vw] max-w-2xl border-white/10 bg-ink p-8 text-studio-foreground shadow-2xl sm:rounded-xl md:p-12">
        {step === "choice" && (
          <>
            <DialogTitle className="font-display text-2xl tracking-[-0.02em] md:text-3xl">
              {m.title}
            </DialogTitle>
            <DialogDescription className="sr-only">{m.title}</DialogDescription>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Project enquiry")}`}
                onClick={() => setOpen(false)}
                className="flex flex-col gap-2 rounded-lg border border-studio-foreground/15 p-6 text-left transition-colors hover:border-accent"
              >
                <span className="font-display text-lg tracking-[-0.01em]">{m.emailTitle}</span>
                <span className="text-sm leading-relaxed text-studio-muted">{m.emailDesc}</span>
              </a>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex flex-col gap-2 rounded-lg border border-studio-foreground/15 p-6 text-left transition-colors hover:border-accent"
              >
                <span className="font-display text-lg tracking-[-0.01em]">{m.formTitle}</span>
                <span className="text-sm leading-relaxed text-studio-muted">{m.formDesc}</span>
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <DialogTitle className="font-display text-2xl tracking-[-0.02em] md:text-3xl">
              {m.formTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">{m.formTitle}</DialogDescription>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <Field label={m.replyLanguageLabel}>
                <div className="flex gap-2">
                  {LANGUAGES.map(({ code, label }) => {
                    const Flag = FLAGS[code];
                    const active = replyLanguage === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setReplyLanguage(code)}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors ${
                          active
                            ? "border-accent bg-accent text-ink"
                            : "border-studio-foreground/20 text-studio-muted hover:text-studio-foreground"
                        }`}
                      >
                        <Flag className="h-3 w-4 rounded-[2px] object-cover" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label={m.nameLabel} required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={m.namePlaceholder}
                  className={fieldClass}
                />
              </Field>
              <Field label={m.emailLabel} required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={m.emailPlaceholder}
                  className={fieldClass}
                />
              </Field>
              <Field label={m.phoneLabel}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={m.phonePlaceholder}
                  className={fieldClass}
                />
              </Field>
              <Field label={m.messageLabel} required>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={m.messagePlaceholder}
                  className={`${fieldClass} resize-none`}
                />
              </Field>
              <div className="mt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep("choice")}
                  className="text-xs uppercase tracking-[0.3em] text-studio-muted hover:text-studio-foreground"
                >
                  {m.back}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-kanoy bg-accent text-ink disabled:opacity-60"
                >
                  {pending ? m.sending : m.submit}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <DialogTitle className="font-display text-2xl tracking-[-0.02em] md:text-3xl">
              {m.successTitle}
            </DialogTitle>
            <DialogDescription className="mt-4 text-studio-muted">
              {m.successText}
            </DialogDescription>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-kanoy mt-8 bg-accent text-ink"
            >
              {m.close}
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center">
            <DialogTitle className="font-display text-2xl tracking-[-0.02em] md:text-3xl">
              {m.formTitle}
            </DialogTitle>
            <DialogDescription className="mt-4 text-studio-muted">{m.errorText}</DialogDescription>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="btn-kanoy bg-accent text-ink"
              >
                {m.retry}
              </button>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-xs uppercase tracking-[0.3em] text-studio-muted hover:text-studio-foreground"
              >
                {m.emailTitle}
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
