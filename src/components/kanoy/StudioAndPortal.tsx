import { useEffect, useLayoutEffect, useRef } from "react";
import { MINI_SITES } from "./mini-sites-data";
import { MiniSite } from "./mini-sites";
import {
  clamp,
  ease,
  mix,
  range,
  MOBILE_QUERY,
  useCornerLogoOnLight,
} from "./anim";
import { CAMERA_TRAVEL, PLACEMENTS, STUDIO_VH, vhToProgress, type Placement } from "./studio-scene";
import kanoyK from "@/assets/branding/kanoy-k.webp";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// `useLayoutEffect` warns on the server (TanStack Start renders this on the
// server too) — this scene is entirely scroll-driven, so it has nothing
// meaningful to show until it's running on the client anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Timing of the intro / label / outro, in vh of scroll into the pin. These
// are absolute distances (not fractions of the section), so the hero's fade
// and the K's trip to the corner take the same amount of scrolling however
// long the walk-through itself is. The outro is measured back from the end.
const REVEAL = [vhToProgress(23), vhToProgress(84)] as const;
const INTRO_OUT = [vhToProgress(15), vhToProgress(91)] as const;
const LABEL_IN = [vhToProgress(99), vhToProgress(152)] as const;
const LABEL_OUT = [vhToProgress(STUDIO_VH - 106), vhToProgress(STUDIO_VH - 30)] as const;

/** One floating portfolio screen. Its own DOM node never unmounts while the
 *  scene is alive — the parent's per-frame loop toggles `display`,
 *  `transform`, `opacity` and `filter` on it directly via `screenRef`
 *  instead of through React state, so scrolling through the whole 3D walk-
 *  through never triggers a React re-render. */
function Screen({
  place,
  index,
  screenRef,
}: {
  place: Placement;
  index: number;
  screenRef: (el: HTMLDivElement | null) => void;
}) {
  const site = MINI_SITES[index % MINI_SITES.length]!;

  return (
    <div
      ref={screenRef}
      className="absolute left-1/2 top-1/2"
      // opacity:0 matches every placement's computed value at scroll
      // position 0 (the reveal hasn't started yet) — a static, SSR-safe
      // stand-in for the very first paint, before the scroll effect below
      // has run and taken over with the real per-frame value.
      style={{ transformStyle: "preserve-3d", willChange: "transform, opacity", opacity: 0 }}
    >
      {site.location && (
        <div
          style={{
            width: place.w,
            marginBottom: 6,
            textAlign: "left",
            color: "var(--studio-muted)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {site.location}
        </div>
      )}
      <div className="screen-shell" data-device={place.device}>
        <MiniSite site={site} width={place.w} />
        <span className="screen-glare" aria-hidden />
      </div>
      <div className="screen-caption" style={{ width: place.w }}>
        {site.url ? (
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline", pointerEvents: "auto" }}
          >
            {site.url.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span>{site.label}</span>
        )}
        <span className="text-accent">{site.kind}</span>
      </div>
    </div>
  );
}

/**
 * The pinned/scroll-jacked studio walk-through: the portfolio screens float
 * past a 3D camera as the visitor scrolls, then the pin releases straight
 * into the page's normal in-flow content (About, right after this).
 *
 * Every value driven by scroll (camera position, the screens' transform/
 * opacity/filter, the travelling K mark, ...) used to live in React state,
 * so this whole tree re-rendered on every single scroll frame — the
 * dominant cause of the scroll jank reported on kanoy.pt. It's now one
 * rAF-driven loop that reads scroll position and writes styles straight to
 * refs, bypassing React's render/reconciliation for the hot path entirely;
 * React only re-renders this tree for genuinely rare state (language
 * switch, mobile breakpoint, the corner-logo light/dark toggle).
 */
export function StudioAndPortal() {
  const { dict } = useLanguage();
  const onLight = useCornerLogoOnLight();

  const sectionRef = useRef<HTMLDivElement>(null);
  const lightBeamRef = useRef<HTMLDivElement>(null);
  const openingTitleRef = useRef<HTMLDivElement>(null);
  const kMarkWrapRef = useRef<HTMLDivElement>(null);
  const kIconRef = useRef<HTMLImageElement>(null);
  const kTextRef = useRef<HTMLSpanElement>(null);
  const walkLabelRef = useRef<HTMLDivElement>(null);
  const depthRulerSpanRef = useRef<HTMLSpanElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    let raf = 0;
    const mobileQuery = window.matchMedia(MOBILE_QUERY);

    const applyFrame = (p: number) => {
      const mobile = mobileQuery.matches;
      const studioP = clamp(p);
      const camera = studioP * CAMERA_TRAVEL;
      const reveal = range(studioP, REVEAL[0], REVEAL[1]);
      const introOut = range(studioP, INTRO_OUT[0], INTRO_OUT[1]);
      const toCorner = ease(introOut);
      const walkLabel =
        range(studioP, LABEL_IN[0], LABEL_IN[1]) *
        (1 - range(studioP, LABEL_OUT[0], LABEL_OUT[1]));

      if (lightBeamRef.current)
        lightBeamRef.current.style.opacity = String(mix(0.35, 0.8, studioP));

      if (openingTitleRef.current) {
        const el = openingTitleRef.current;
        el.style.opacity = String(1 - introOut);
        el.style.transform = `translate3d(0,${introOut * -6}vh,0) scale(${1 + introOut * 0.12})`;
        el.style.filter = `blur(${introOut * 12}px)`;
      }

      // The hero mark travels from big-and-centred to the small top-left
      // corner logo as the page moves from the first screen into the
      // second. See the anchor/stack-to-row explanation this used to carry
      // as a comment on the old per-render version — the math is unchanged,
      // only how it reaches the DOM.
      const markLeft = mix(50, mobile ? 11 : 2, toCorner);
      const markTop = mix(mobile ? 44 : 46, 2.4, toCorner);
      const markIconVh = mix(mobile ? 22 : 40, mobile ? 4.6 : 3.4, toCorner);
      const markTextVw = mix(mobile ? 10.5 : 7, mobile ? 2.3 : 1.5, toCorner);
      const markGapVw = mix(0.1, 0.5, toCorner);
      const iconTx = mix(-50, -100, toCorner);
      const iconTy = mix(-100, -50, toCorner);
      const iconGapX = mix(0, -markGapVw / 2, toCorner);
      const iconGapY = mix(-markGapVw / 2, 0, toCorner);
      const textTx = mix(-50, 0, toCorner);
      const textTy = mix(0, -50, toCorner);
      const textGapX = mix(0, markGapVw / 2, toCorner);
      const textGapY = mix(markGapVw / 2, 0, toCorner);

      if (kMarkWrapRef.current) {
        kMarkWrapRef.current.style.left = `${markLeft}vw`;
        kMarkWrapRef.current.style.top = `${markTop}vh`;
      }
      if (kIconRef.current) {
        kIconRef.current.style.height = `${markIconVh}vh`;
        kIconRef.current.style.transform = `translate(${iconTx}%, ${iconTy}%) translate(${iconGapX}vw, ${iconGapY}vw)`;
      }
      if (kTextRef.current) {
        kTextRef.current.style.fontSize = `${markTextVw}vw`;
        kTextRef.current.style.transform = `translate(${textTx}%, ${textTy}%) translate(${textGapX}vw, ${textGapY}vw)`;
      }

      if (walkLabelRef.current) {
        walkLabelRef.current.style.opacity = String(walkLabel);
        walkLabelRef.current.style.transform = `translateY(${(1 - walkLabel) * 20}px)`;
      }

      if (depthRulerSpanRef.current) depthRulerSpanRef.current.style.height = `${studioP * 100}%`;

      for (let i = 0; i < PLACEMENTS.length; i++) {
        const el = screenRefs.current[i];
        if (!el) continue;
        const place = PLACEMENTS[i]!;
        const site = MINI_SITES[i % MINI_SITES.length]!;
        const depth = place.z - camera;
        const visible = depth > -320 && depth < 3400;
        if (!visible) {
          if (el.style.display !== "none") el.style.display = "none";
          continue;
        }
        if (el.style.display === "none") el.style.display = "";

        const near = clamp((depth + 300) / 460); // fade as it passes the camera
        const far = 1 - clamp((depth - 2300) / 1100); // fade in from the back
        const opacity = clamp(near * far) * reveal;
        // Real project screenshots stay crisp for their whole time on
        // screen — the depth blur is only for the fake mock screens.
        // `blur` is a genuinely expensive filter to recomposite, so it's
        // quantized to the nearest half-pixel (imperceptible on its own)
        // instead of a fresh value every frame — most frames land on the
        // same rounded value as the one before, so the browser can skip
        // re-blurring a layer that hasn't visibly changed.
        const blurRaw = site.image
          ? 0
          : mix(4, 0, clamp((depth - 60) / 340)) + clamp((depth - 2100) / 1300) * 3.5;
        const blur = Math.round(blurRaw * 2) / 2;
        const drift = place.float ? Math.sin(camera / 900 + i) * 10 * place.float : 0;

        el.style.transform = `translate3d(calc(-50% + ${place.x}vw), calc(-50% + ${place.y + drift * 0.1}vh), ${-depth}px) rotateY(${place.rotY}deg) rotateX(${place.rotX ?? 0}deg)`;
        el.style.opacity = String(opacity);
        // An empty string (rather than `blur(0px)`) also skips promoting
        // an in-focus screen onto its own GPU compositing layer at all.
        el.style.filter = blur > 0 ? `blur(${blur}px)` : "";
      }
    };

    const computeP = () => {
      const el = sectionRef.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
    };

    let lastP = -1;
    const tick = () => {
      raf = 0;
      const p = computeP();
      if (Math.abs(p - lastP) <= 0.0008) return;
      lastP = p;
      applyFrame(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Crossing the breakpoint (e.g. rotating a tablet) changes the mark's
    // sizes without any scroll, so force the next tick to re-apply the frame.
    const onBreakpoint = () => {
      lastP = -1;
      onScroll();
    };

    applyFrame(computeP()); // paint the correct frame before the first scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mobileQuery.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mobileQuery.removeEventListener("change", onBreakpoint);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${STUDIO_VH}vh` }}
      aria-label="Entering the KANOY studio"
    >
      <div className="sticky top-0 z-40 h-dvh overflow-hidden">
        {/* the office photo itself lives in <StudioBackdrop>, fixed behind
            this whole section — everything here only tints/decorates it */}
        <div className="absolute inset-0 bg-room-veil" />

        <div ref={lightBeamRef} className="light-beam" style={{ opacity: 0.35 }} />

        {/* 3D volume */}
        <div className="camera">
          <div className="world">
            {PLACEMENTS.map((place, i) => (
              <Screen
                key={i}
                place={place}
                index={i}
                screenRef={(el) => {
                  screenRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>

        {/* opening title — the style prop below is the scroll-position-0
            frame (fully shown, no blur/scale), matching what the effect
            would write on first paint at the top of the page */}
        <div
          ref={openingTitleRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: 1, transform: "translate3d(0,0,0) scale(1)", filter: "blur(0px)" }}
        >
          {/* spacer matching the travelling mark's footprint so the tagline/hint below keep their spot */}
          <div aria-hidden className="h-[49vh] md:h-[68vh]" />
          <h1 className="mt-6 max-w-xl whitespace-pre-line text-balance font-body text-[0.78rem] uppercase tracking-[0.32em] text-studio-muted md:text-base">
            {dict.hero.tagline}
          </h1>
          <span className="mt-14 text-[10px] uppercase tracking-[0.4em] text-accent scroll-hint md:mt-5">
            {dict.hero.scrollHint}
          </span>
        </div>

        {/* the K + "Kanoy" mark itself — fixed to the viewport so it can
            travel from the big centred hero position into the persistent
            top-left corner logo as the page scrolls into the second screen,
            then stays there for the rest of the site */}
        <div
          ref={kMarkWrapRef}
          className="hero-k-wrap pointer-events-none fixed z-40"
        >
          <img
            ref={kIconRef}
            src={kanoyK}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            className="k-halo k-glow hero-k-shine hero-k-icon absolute"
            style={{
              left: 0,
              top: 0,
              width: "auto",
              maxWidth: "none",
              transform: "translate(-50%, -100%) translate(0vw, -0.05vw)",
            }}
          />
          <span
            ref={kTextRef}
            className={`hero-text-shine hero-k-text absolute whitespace-nowrap leading-none tracking-[-0.01em] transition-colors duration-300 ${
              onLight ? "text-ink" : "text-studio-foreground"
            }`}
            style={{
              left: 0,
              top: 0,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 400,
              transform: "translate(-50%, 0%) translate(0vw, 0.05vw)",
            }}
          >
            Kanoy
          </span>
        </div>

        {/* mid-journey label */}
        <div
          ref={walkLabelRef}
          className="pointer-events-none absolute bottom-10 left-6 md:left-14"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <div className="text-sm uppercase tracking-[0.42em] text-accent md:text-base">
            {dict.studio.label}
          </div>
          <div className="mt-3 max-w-sm font-body text-base leading-relaxed text-studio-muted md:text-lg">
            {dict.studio.text}
          </div>
        </div>

        {/* depth ruler */}
        <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
          <div className="depth-ruler">
            <span ref={depthRulerSpanRef} style={{ height: "0%" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
