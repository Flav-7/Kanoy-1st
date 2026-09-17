import { useEffect, useLayoutEffect, useRef } from "react";
import { MINI_SITES } from "./mini-sites-data";
import { MiniSite } from "./mini-sites";
import {
  clamp,
  ease,
  mix,
  range,
  useCornerLogoOnLight,
  useIsLowEndDevice,
  useIsMobile,
  usePrefersReducedMotion,
} from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.webp";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// `useLayoutEffect` warns on the server (TanStack Start renders this on the
// server too) — this scene is entirely scroll-driven, so it has nothing
// meaningful to show until it's running on the client anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Placement of a screen inside the studio volume. */
type Placement = {
  x: number; // vw offset from centre
  y: number; // vh offset from centre
  z: number; // depth in px (larger = deeper in the room)
  w: number; // screen width in px
  rotY: number;
  rotX?: number;
  float?: number;
  device?: "monitor" | "panel" | "tablet";
};

const PLACEMENTS: Placement[] = [
  { x: -16, y: 1, z: 1700, w: 460, rotY: 26, device: "monitor" },
  { x: 17, y: -4, z: 2450, w: 420, rotY: -24, device: "panel", float: 1 },
  { x: -19, y: -7, z: 3200, w: 380, rotY: 22, device: "panel", float: -1 },
  { x: 15, y: 5, z: 3950, w: 480, rotY: -20, device: "monitor" },
  { x: -13, y: 6, z: 4700, w: 320, rotY: 18, device: "tablet", float: 1 },
  { x: 18, y: -8, z: 5450, w: 440, rotY: -18, device: "panel", float: -1 },
  { x: -17, y: -2, z: 6200, w: 470, rotY: 20, device: "monitor" },
  { x: 14, y: 7, z: 6950, w: 340, rotY: -22, device: "tablet" },
  { x: -15, y: 8, z: 7700, w: 400, rotY: 16, device: "panel", float: 1 },
  { x: 16, y: -6, z: 8450, w: 450, rotY: -16, device: "monitor" },
];

const CAMERA_TRAVEL = 9200;
const RINGS = 7;
// Arbitrary fixed size (in vmin) for each ring's wrapper box — only its
// ratio to the per-frame `size` value matters, since the actual on-screen
// size comes from `transform: scale(size / RING_REF_SIZE)`.
const RING_REF_SIZE = 100;

// The two acts share ONE sticky/scroll-jacked container (see below) instead
// of each owning its own — that's what stops the "restart" seam when
// scrolling from the studio walk-through into the Portal: there is no
// sticky-release-then-repin handoff between them any more, just one
// continuous pinned scene whose internal progress is split into two
// consecutive slices.
const STUDIO_VH = 760;
const PORTAL_VH = 300;
const TOTAL_VH = STUDIO_VH + PORTAL_VH;
const STUDIO_FRAC = STUDIO_VH / TOTAL_VH;
const PORTAL_FRAC = PORTAL_VH / TOTAL_VH;

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
 * The studio walk-through and the Portal "digital core" scene, fused into
 * one continuously scroll-jacked section. They used to be two separate
 * sections, each with its own sticky pin — scrolling from one into the
 * other released one pin and immediately re-pinned the next, which is what
 * caused the visible restart/seam in the shared background. Now there's
 * only one pin for the whole combined distance, split into two consecutive
 * progress slices (studioP, then portalP) so each act's timing works
 * exactly as it did on its own.
 *
 * Every value driven by scroll (camera position, the 10 screens' transform/
 * opacity/filter, the travelling K mark, the portal rings, ...) used to live
 * in React state, so this whole tree re-rendered on every single scroll
 * frame across ~11 screen-heights of scroll — the dominant cause of the
 * scroll jank reported on kanoy.pt. It's now one rAF-driven loop that reads
 * scroll position and writes styles straight to refs, bypassing React's
 * render/reconciliation for the hot path entirely; React only re-renders
 * this tree for genuinely rare state (language switch, mobile breakpoint,
 * the corner-logo light/dark toggle).
 */
export function StudioAndPortal() {
  const { dict } = useLanguage();
  const onLight = useCornerLogoOnLight();
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  // Either the visitor asked the OS for less motion, or their hardware
  // looks weak enough that the full 3D scroll-jacked scene would likely
  // stutter regardless — both get the same plain static grid below.
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLowEndDevice = useIsLowEndDevice();
  const useSimpleScene = prefersReducedMotion || isLowEndDevice;

  const sectionRef = useRef<HTMLDivElement>(null);
  const lightBeamRef = useRef<HTMLDivElement>(null);
  const openingTitleRef = useRef<HTMLDivElement>(null);
  const kMarkWrapRef = useRef<HTMLDivElement>(null);
  const kIconRef = useRef<HTMLImageElement>(null);
  const kTextRef = useRef<HTMLSpanElement>(null);
  const walkLabelRef = useRef<HTMLDivElement>(null);
  const depthRulerSpanRef = useRef<HTMLSpanElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  const portalVoidRef = useRef<HTMLDivElement>(null);
  const portalWorldRef = useRef<HTMLDivElement>(null);
  const portalTextRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringBorderRefs = useRef<(HTMLDivElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    if (useSimpleScene) return;
    let raf = 0;

    const applyFrame = (p: number) => {
      const mobile = isMobileRef.current;
      const studioP = clamp(p / STUDIO_FRAC);
      const portalP = clamp((p - STUDIO_FRAC) / PORTAL_FRAC);

      // ---- Studio act ----
      const camera = studioP * CAMERA_TRAVEL;
      const reveal = range(studioP, 0.03, 0.11);
      const introOut = range(studioP, 0.02, 0.12);
      const toCorner = ease(introOut);
      const walkLabel = range(studioP, 0.13, 0.2) * (1 - range(studioP, 0.86, 0.96));

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

      // ---- Portal act ----
      const open = range(portalP, 0, 0.4);
      const rush = range(portalP, 0.45, 0.86);
      const textIn = range(portalP, 0, 0.16);
      const textOut = range(portalP, 0.6, 0.76);
      const textOpacity = clamp(textIn * (1 - textOut));

      if (portalVoidRef.current) portalVoidRef.current.style.opacity = String(mix(0.35, 1, open));
      if (!mobile && portalWorldRef.current)
        portalWorldRef.current.style.transform = `scale(${1 + rush * 2.4})`;
      if (portalTextRef.current) portalTextRef.current.style.opacity = String(textOpacity);

      for (let i = 0; i < RINGS; i++) {
        const el = ringRefs.current[i];
        if (!el) continue;
        const stagger = i / RINGS;
        const localP = clamp((open - stagger * 0.5) / (1 - stagger * 0.5));
        // On mobile the rings render inside a plain absolutely-positioned
        // box instead of the perspective/preserve-3d "camera" used on
        // desktop, and are capped so they never grow much past the screen
        // width — vmin is the viewport's narrower side, which on a
        // portrait phone is its width, so anything past ~100vmin was
        // overflowing left and right instead of feeling full-bleed.
        const size = mobile
          ? Math.min(94, mix(18, 40 + i * 6, ease(localP)) + rush * (10 + i * 4))
          : mix(30, 130 + i * 26, ease(localP)) + rush * (260 + i * 80);
        // `size` used to be written straight to width/height, which forces
        // a full layout recalculation every scroll frame. The wrapper's box
        // is a fixed RING_REF_SIZE now, and `transform: scale()` (a
        // compositor-only op, no layout) does the resizing instead.
        const scale = size / RING_REF_SIZE;
        el.style.transform = `scale(${scale})`;
        el.style.opacity = String(clamp(localP) * (1 - rush * 0.45));

        // Scaling the wrapper also visually scales the border/glow drawn
        // inside it, so both are divided back down by the same factor —
        // same constant on-screen thickness the fixed border-width/
        // box-shadow values gave before, just computed instead of static.
        const borderEl = ringBorderRefs.current[i];
        if (borderEl) {
          borderEl.style.borderWidth = `${(mix(1, 2.4, i / RINGS) / scale).toFixed(3)}px`;
          borderEl.style.boxShadow = `0 0 ${(60 / scale).toFixed(1)}px ${(-6 / scale).toFixed(1)}px currentColor`;
        }
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

    applyFrame(computeP()); // paint the correct frame before the first scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [useSimpleScene]);

  const rings = Array.from({ length: RINGS }).map((_, i) => {
    const hue = i % 2 === 0 ? "var(--accent)" : "var(--accent-2)";
    return (
      <div
        key={i}
        ref={(el) => {
          ringRefs.current[i] = el;
        }}
        className="portal-ring-wrap"
        style={{
          width: `${RING_REF_SIZE}vmin`,
          height: `${RING_REF_SIZE}vmin`,
          opacity: 0,
          transform: "scale(0.3)",
        }}
      >
        <div
          ref={(el) => {
            ringBorderRefs.current[i] = el;
          }}
          className={`portal-ring ${i % 2 ? "portal-ring-reverse" : ""}`}
          style={{
            borderColor: hue,
            color: hue,
            borderWidth: mix(1, 2.4, i / RINGS),
            boxShadow: "0 0 60px -6px currentColor",
            animationDuration: `${13 + i * 3}s`,
          }}
        />
      </div>
    );
  });

  // With reduce-motion on (or on weak-looking hardware), skip the pinned/
  // scroll-jacked 3D walk-through entirely and show the same projects as a
  // plain static grid instead. The corner K
  // mark still has to render here, docked in its final position from the
  // start — the rest of the page (About, Problem, Services, ...) assumes
  // this fixed logo already exists and reads its own background to decide
  // the logo's light/dark colour.
  if (useSimpleScene) {
    const markIconVh = isMobile ? 4.6 : 3.4;
    const markTextVw = isMobile ? 2.3 : 1.5;
    return (
      <section className="relative bg-studio py-24 md:py-32" aria-label="KANOY studio and portfolio">
        <div
          className="pointer-events-none fixed z-40"
          style={{ left: isMobile ? "11vw" : "2vw", top: "2.4vh" }}
        >
          <img
            src={kanoyK}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            className="k-halo k-glow hero-k-shine absolute"
            style={{
              left: 0,
              top: 0,
              height: `${markIconVh}vh`,
              width: "auto",
              maxWidth: "none",
              transform: "translate(-100%, -50%)",
            }}
          />
          <span
            className={`hero-text-shine absolute whitespace-nowrap leading-none tracking-[-0.01em] transition-colors duration-300 ${
              onLight ? "text-ink" : "text-studio-foreground"
            }`}
            style={{
              left: 0,
              top: 0,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 400,
              fontSize: `${markTextVw}vw`,
              transform: "translate(0%, -50%)",
            }}
          >
            Kanoy
          </span>
        </div>

        <div className="mx-auto max-w-xl px-6 text-center">
          <p className="whitespace-pre-line text-balance font-body text-[0.78rem] uppercase tracking-[0.32em] text-studio-muted md:text-base">
            {dict.hero.tagline}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 justify-items-center gap-x-8 gap-y-14 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {MINI_SITES.map((site) => (
            <div key={site.id}>
              {site.location && (
                <div
                  style={{
                    width: 320,
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
              <div className="screen-shell">
                <MiniSite site={site} width={320} />
                <span className="screen-glare" aria-hidden />
              </div>
              <div className="screen-caption" style={{ width: 320 }}>
                {site.url ? (
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    {site.url.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span>{site.label}</span>
                )}
                <span className="text-accent">{site.kind}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl px-6 text-center">
          <span className="eyebrow text-accent">{dict.portal.eyebrow}</span>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-studio-foreground md:text-4xl">
            {dict.portal.line}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${TOTAL_VH}vh` }}
      aria-label="Entering the KANOY studio and its digital core"
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
          <div aria-hidden className={isMobile ? "h-[49vh]" : "h-[68vh]"} />
          <p className="mt-6 max-w-xl whitespace-pre-line text-balance font-body text-[0.78rem] uppercase tracking-[0.32em] text-studio-muted md:text-base">
            {dict.hero.tagline}
          </p>
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
          className="pointer-events-none fixed z-40"
          style={{ left: "50vw", top: "46vh" }}
        >
          <img
            ref={kIconRef}
            src={kanoyK}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            className="k-halo k-glow hero-k-shine absolute"
            style={{
              left: 0,
              top: 0,
              height: "40vh",
              width: "auto",
              maxWidth: "none",
              transform: "translate(-50%, -100%) translate(0vw, -0.05vw)",
            }}
          />
          <span
            ref={kTextRef}
            className={`hero-text-shine absolute whitespace-nowrap leading-none tracking-[-0.01em] transition-colors duration-300 ${
              onLight ? "text-ink" : "text-studio-foreground"
            }`}
            style={{
              left: 0,
              top: 0,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 400,
              fontSize: "7vw",
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

        {/* Portal has no clickable content of its own, and it's a sibling
            of the studio act in the same stacking context (they share one
            sticky container) — without this, its rings sit invisibly over
            the portfolio screens even at opacity 0 and swallow clicks
            meant for them. */}
        <div className="pointer-events-none absolute inset-0">
          <div ref={portalVoidRef} className="portal-void" style={{ opacity: 0.35 }} />

          {isMobile ? (
            <div className="pointer-events-none absolute inset-0">{rings}</div>
          ) : (
            <div className="camera">
              <div ref={portalWorldRef} className="world">
                {rings}
              </div>
            </div>
          )}

          <div
            ref={portalTextRef}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ opacity: 0 }}
          >
            <span className="eyebrow glitch-text text-accent" data-text={dict.portal.eyebrow}>
              {dict.portal.eyebrow}
            </span>
            <h2
              className="glitch-text mt-5 text-balance font-display text-[9vw] font-semibold leading-[0.95] tracking-tight text-studio-foreground md:text-[5vw]"
              data-text={dict.portal.line}
            >
              {dict.portal.line}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
