import { useEffect, useRef, useState } from "react";
import { gsap } from "./lenisGsap";
import kanoyLogo from "@/assets/branding/kanoy-logo.jpg";
import { MINI_SITES } from "../kanoy/mini-sites-data";
import { MiniSite } from "../kanoy/mini-sites";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ContactModal } from "../kanoy/ContactModal";

// corridor-walk.mp4 exported as a 240-frame JPG sequence (30fps, 8s) in
// public/frames/corridor/ — swapping <img src> is synchronous, unlike
// video.currentTime (async seek), so scroll-scrubbing is exact and never
// stalls regardless of scroll speed.
const TOTAL_FRAMES = 240;
const frameSrc = (n: number) => `/frames/corridor/ezgif-frame-${String(n).padStart(3, "0")}.jpg`;

const THUMBS = [
  { id: "restaurant", left: "10%", top: "38%", w: 220, rot: -6 },
  { id: "hotel", left: "78%", top: "58%", w: 200, rot: 5 },
  { id: "barber", left: "16%", top: "68%", w: 180, rot: 4 },
] as const;

type TabId = "about" | "services" | "process" | "contact";
const CONTACT_EMAIL = "hello@kanoy.studio";

/**
 * FASE 1 — hero cinematográfico, seguindo o vídeo de referência:
 *   1. logo K + "Kanoy" e headline direto sobre a imagem (sem cartão branco);
 *   2. sequência de imagens real a avançar pelo corredor — miniaturas de
 *      websites do portfolio aparecem flutuando por cima a meio do trajeto;
 *   3. perto do fim, um cartão bege pequeno aparece SOBRE a cena (com
 *      margem, fundo ainda visível à volta — não é uma página nova) com
 *      títulos à esquerda e o conteúdo de cada secção à direita.
 */
export function CinematicEntrance() {
  const { dict } = useLanguage();
  const [tab, setTab] = useState<TabId>("about");

  const wrapperRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const currentFrame = useRef(1);

  useEffect(() => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const im = new Image();
      im.src = frameSrc(i);
    }
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollVh = reduced ? 200 : 380;
    const sequenceStart = 0.12;
    const sequenceEnd = 0.6;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: `+=${scrollVh}%`,
          scrub: true,
          pin: frameRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const t = Math.min(1, Math.max(0, (p - sequenceStart) / (sequenceEnd - sequenceStart)));
            const frame = Math.round(1 + t * (TOTAL_FRAMES - 1));
            if (frame !== currentFrame.current) {
              currentFrame.current = frame;
              img.src = frameSrc(frame);
            }
          },
        },
      });

      // NOTE: positions/durations below are timeline seconds, and scrub
      // maps scroll 0->1 onto them, so they must sum to exactly 1.
      tl.to([logoRef.current, headlineRef.current], { opacity: 0, y: "-3%", duration: 0.08 }, 0.05)
        .to(hintRef.current, { opacity: 0, duration: 0.05 }, 0.03)
        // 0.2 -> 0.5: portfolio thumbnails float in over the walk, then out
        .to(thumbRefs.current, { opacity: 1, y: "-1.5%", stagger: 0.03, duration: 0.1 }, 0.2)
        .to(thumbRefs.current, { opacity: 0, y: "-3%", stagger: 0.02, duration: 0.08 }, 0.48)
        // 0.62 -> 0.7: the sequence never opens the door — hide that cut with blur
        .to(frameRef.current, { filter: "blur(20px)", duration: 0.04, ease: "power1.in" }, 0.62)
        .to(frameRef.current, { filter: "blur(0px)", duration: 0.04, ease: "power1.out" }, 0.66)
        // 0.68 -> 0.85: dim slightly + the inset card floats in over the scene
        .to(scrimRef.current, { opacity: 1, duration: 0.14 }, 0.68)
        .fromTo(
          cardRef.current,
          { opacity: 0, y: "3%" },
          { opacity: 1, y: "0%", duration: 0.17 },
          0.7,
        );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const items: { id: TabId; n: string; label: string }[] = [
    { id: "about", n: "01", label: dict.nav.about },
    { id: "services", n: "02", label: dict.nav.services },
    { id: "process", n: "03", label: dict.nav.process },
    { id: "contact", n: "04", label: dict.nav.contact },
  ];

  return (
    <section ref={wrapperRef} className="relative h-[480vh]" aria-label="KANOY">
      <div
        ref={frameRef}
        className="relative h-screen w-full overflow-hidden"
        style={{ background: "#0d100f" }}
      >
        <img
          ref={imgRef}
          src={frameSrc(1)}
          alt="Entrada no estúdio KANOY"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,16,15,0.4) 0%, transparent 30%, transparent 65%, rgba(13,16,15,0.3) 100%)",
          }}
        />
        <div
          ref={scrimRef}
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(13,16,15,0.4)", opacity: 0 }}
        />

        {/* logo + headline, straight over the photo — no card behind them */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-center">
          <div ref={logoRef} className="flex items-center">
            <img
              src={kanoyLogo}
              alt="KANOY"
              className="h-[7vw] w-auto max-h-14 md:h-11"
              style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))" }}
            />
          </div>
          <div ref={headlineRef} className="max-w-xl">
            <p
              className="font-logo text-[4.6vw] leading-[1.15] tracking-[-0.01em] text-white md:text-3xl"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}
            >
              We build websites that make people stop scrolling.
            </p>
          </div>
        </div>

        {/* portfolio thumbnails, floating over the walk */}
        {THUMBS.map((t, i) => {
          const site = MINI_SITES.find((s) => s.id === t.id)!;
          return (
            <div
              key={t.id}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-0"
              style={{
                left: t.left,
                top: t.top,
                transform: `translate(-50%,-50%) rotate(${t.rot}deg)`,
              }}
            >
              <div className="overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
                <MiniSite site={site} width={t.w} />
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-14 text-center">
          <span ref={hintRef} className="text-[10px] uppercase tracking-[0.4em] text-white/70">
            {dict.entrada.scrollHint}
          </span>
        </div>

        {/* inset card — floats over the still-visible scene, not a new page */}
        <div
          ref={cardRef}
          className="absolute inset-0 flex items-center justify-center px-6 opacity-0 md:px-16"
        >
          <div className="grid w-full max-w-3xl grid-cols-1 gap-8 rounded-[28px] bg-[#f7f2e6]/97 p-7 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.55)] md:grid-cols-[220px_1fr] md:p-10">
            <ul className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-visible md:border-r md:border-ink/10 md:pr-5">
              {items.map((item) => (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-baseline gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                      tab === item.id ? "bg-ink/5 opacity-100" : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    <span className="font-display text-[11px] text-accent">{item.n}</span>
                    <span className="font-display text-xs whitespace-nowrap uppercase tracking-[0.1em] text-ink">
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="min-h-[220px]">
              {tab === "about" && (
                <>
                  <span className="eyebrow text-accent">{dict.about.eyebrow}</span>
                  <h2 className="mt-3 font-display text-2xl leading-[1.08] tracking-tight text-ink md:text-3xl">
                    {dict.about.titleLine1}
                    <br />
                    {dict.about.titleLine2}
                  </h2>
                  <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-ink/70">
                    {dict.about.text}
                  </p>
                </>
              )}
              {tab === "services" && (
                <>
                  <span className="eyebrow text-accent">{dict.services.eyebrow}</span>
                  <h2 className="mt-3 font-display text-xl leading-tight tracking-tight text-ink md:text-2xl">
                    {dict.services.title}
                  </h2>
                  <div className="mt-5 flex flex-col gap-4">
                    {dict.services.items.slice(0, 3).map((item, i) => (
                      <div key={item.title}>
                        {i > 0 && <div className="hairline mb-4" />}
                        <h3 className="font-display text-base text-ink">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink/65">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === "process" && (
                <>
                  <span className="eyebrow text-accent">{dict.process.eyebrow}</span>
                  <div className="mt-5 flex flex-col gap-4">
                    {dict.process.steps.slice(0, 4).map((step, i) => (
                      <div key={step.t} className="flex gap-3">
                        <span className="mt-0.5 font-display text-[11px] text-accent">
                          {dict.process.stepLabel} 0{i + 1}
                        </span>
                        <div>
                          <h3 className="font-display text-sm text-ink">{step.t}</h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink/65">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === "contact" && (
                <>
                  <h2 className="font-display text-2xl leading-[1.08] tracking-tight text-ink md:text-3xl">
                    {dict.contact.titleLine1}
                    <br />
                    {dict.contact.titleLine2}
                  </h2>
                  <p className="mt-3 max-w-md text-sm text-ink/70">{dict.contact.subtitle}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ContactModal />
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Portfolio request")}`}
                      className="btn-kanoy-ghost"
                    >
                      {dict.entrada.requestPortfolio}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
