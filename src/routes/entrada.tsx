import { createFileRoute, Link } from "@tanstack/react-router";
import { CinematicEntrance } from "@/components/entrada/CinematicEntrance";
import { useLenisGsap } from "@/components/entrada/lenisGsap";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const title = "KANOY — Entrada no estúdio";

export const Route = createFileRoute("/entrada")({
  head: () => ({
    meta: [{ title }, { name: "robots", content: "noindex" }],
  }),
  component: EntradaPage,
});

function EntradaPage() {
  useLenisGsap();
  const { dict } = useLanguage();

  return (
    <main className="relative" style={{ background: "#f7f2e6" }}>
      <LanguageSwitcher>
        <Link
          to="/"
          hash="contact"
          search={{ openContact: true }}
          className="btn-kanoy bg-accent text-ink"
          style={{ padding: "10px 18px", fontSize: "9px" }}
        >
          {dict.entrada.talkToUs}
        </Link>
      </LanguageSwitcher>
      <CinematicEntrance />
    </main>
  );
}
