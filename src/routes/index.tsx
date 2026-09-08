import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudioBackdrop } from "@/components/kanoy/StudioBackdrop";
import { StudioAndPortal } from "@/components/kanoy/StudioAndPortal";
import { Services } from "@/components/kanoy/Services";
import { Process } from "@/components/kanoy/Process";
import { About, Contact } from "@/components/kanoy/Closing";
import { Problem } from "@/components/kanoy/Problem";
import { LanguageSwitcher } from "@/components/kanoy/LanguageSwitcher";
import { QuickNav } from "@/components/kanoy/QuickNav";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const title = "KANOY — Websites that make people stop scrolling";
const description =
  "KANOY is a digital studio building premium websites, reservation and booking systems, and custom digital systems for real businesses.";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { openContact?: boolean } =>
    search["openContact"] === true ? { openContact: true } : {},
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
  const { openContact } = Route.useSearch();
  const { dict } = useLanguage();
  const [showTalkToUs, setShowTalkToUs] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      const contact = document.getElementById("contact");
      const inContact = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.5 : false;
      setShowTalkToUs(pastHero && !inContact);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-background">
      <LanguageSwitcher>
        <Link
          to="/"
          hash="contact"
          search={{ openContact: true }}
          aria-hidden={!showTalkToUs}
          tabIndex={showTalkToUs ? 0 : -1}
          className={`btn-kanoy bg-accent text-ink transition-opacity duration-300 ${
            showTalkToUs ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ padding: "10px 18px", fontSize: "9px" }}
        >
          {dict.entrada.talkToUs}
        </Link>
      </LanguageSwitcher>
      <QuickNav />
      <StudioBackdrop />
      <StudioAndPortal />
      <About />
      <Problem />
      <Services />
      <Process />
      <Contact autoOpenModal={openContact} />
    </main>
  );
}
