import { createFileRoute } from "@tanstack/react-router";
import { StudioBackdrop } from "@/components/kanoy/StudioBackdrop";
import { StudioAndPortal } from "@/components/kanoy/StudioAndPortal";
import { Services } from "@/components/kanoy/Services";
import { Process } from "@/components/kanoy/Process";
import { About, Pricing, Contact } from "@/components/kanoy/Closing";
import { Problem } from "@/components/kanoy/Problem";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";
import { QuickNav } from "@/components/kanoy/QuickNav";

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
      <LanguageSwitcher />
      <QuickNav />
      <StudioBackdrop />
      <StudioAndPortal />
      <About />
      <Problem />
      <Services />
      <Process />
      <Pricing />
      <Contact />
    </main>
  );
}
