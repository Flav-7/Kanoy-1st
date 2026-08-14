import { createFileRoute } from "@tanstack/react-router";
import { StudioScene } from "@/components/kanoy/StudioScene";
import { Services } from "@/components/kanoy/Services";
import { Process } from "@/components/kanoy/Process";
import { About, Pricing, Contact } from "@/components/kanoy/Closing";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";

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
      <StudioScene />
      <Services />
      <About />
      <Process />
      <Pricing />
      <Contact />
    </main>
  );
}
