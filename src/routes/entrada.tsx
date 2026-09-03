import { createFileRoute } from "@tanstack/react-router";
import { CinematicEntrance } from "@/components/entrada/CinematicEntrance";
import { useLenisGsap } from "@/components/entrada/lenisGsap";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";

const title = "KANOY — Entrada no estúdio";

export const Route = createFileRoute("/entrada")({
  head: () => ({
    meta: [{ title }, { name: "robots", content: "noindex" }],
  }),
  component: EntradaPage,
});

function EntradaPage() {
  useLenisGsap();

  return (
    <main className="relative" style={{ background: "#f7f2e6" }}>
      <LanguageSwitcher />
      <CinematicEntrance />
    </main>
  );
}
