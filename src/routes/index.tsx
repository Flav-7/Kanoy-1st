import { createFileRoute } from "@tanstack/react-router";
import { StudioScene } from "@/components/kanoy/StudioScene";
import { Portal } from "@/components/kanoy/Portal";
import { Services } from "@/components/kanoy/Services";
import { Process } from "@/components/kanoy/Process";
import { About, Pricing, Contact } from "@/components/kanoy/Closing";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";
import { QuickNav } from "@/components/kanoy/QuickNav";
import { SurrealField } from "@/components/kanoy/SurrealField";
import { CursorTrail } from "@/components/kanoy/CursorTrail";

const title = "KANOY — Websites that make people stop scrolling";
const description =
  "KANOY is a digital studio building premium websites, reservation and booking systems, and custom digital systems for real businesses.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background">
      <SurrealField />
      <CursorTrail />
      <LanguageSwitcher />
      <QuickNav />
      <StudioScene />
      <Portal />
      <Services />
      <About />
      <Process />
      <Pricing />
      <Contact />
    </main>
  );
}
