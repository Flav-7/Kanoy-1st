import { Link } from "@tanstack/react-router";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  eyebrow,
  title,
  updated,
  backLabel,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  backLabel: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-sand px-6 py-20 text-ink md:px-14 md:py-28">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.3em] text-ink/50 transition-colors hover:text-ink"
        >
          ← {backLabel}
        </Link>

        <div className="eyebrow mt-10">{eyebrow}</div>
        <h1 className="mt-4 font-display text-[10vw] leading-[0.95] tracking-[-0.03em] md:text-[3.4vw]">
          {title}
        </h1>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink/40">{updated}</p>

        <div className="mt-16 space-y-12 border-t border-ink/10 pt-12">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg tracking-[-0.01em] md:text-xl">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/70">
                {section.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
