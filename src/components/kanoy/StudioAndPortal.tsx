import { MINI_SITES } from "./mini-sites-data";
import { MiniSite } from "./mini-sites";
import { clamp, ease, mix, range, useCornerLogoOnLight, useScrollProgress } from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.png";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  { x: -32, y: 2, z: 1700, w: 460, rotY: 26, device: "monitor" },
  { x: 33, y: -6, z: 2450, w: 420, rotY: -24, device: "panel", float: 1 },
  { x: -38, y: -12, z: 3200, w: 380, rotY: 22, device: "panel", float: -1 },
  { x: 30, y: 8, z: 3950, w: 480, rotY: -20, device: "monitor" },
  { x: -26, y: 10, z: 4700, w: 320, rotY: 18, device: "tablet", float: 1 },
  { x: 36, y: -14, z: 5450, w: 440, rotY: -18, device: "panel", float: -1 },
  { x: -34, y: -4, z: 6200, w: 470, rotY: 20, device: "monitor" },
  { x: 28, y: 12, z: 6950, w: 340, rotY: -22, device: "tablet" },
  { x: -30, y: 14, z: 7700, w: 400, rotY: 16, device: "panel", float: 1 },
  { x: 32, y: -10, z: 8450, w: 450, rotY: -16, device: "monitor" },
];

const CAMERA_TRAVEL = 9200;
const RINGS = 7;

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

function Screen({
  place,
  index,
  camera,
  reveal,
}: {
  place: Placement;
  index: number;
  camera: number;
  reveal: number;
}) {
  const site = MINI_SITES[index % MINI_SITES.length]!;
  const depth = place.z - camera;
  const visible = depth > -320 && depth < 3400;
  if (!visible) return null;

  const near = clamp((depth + 300) / 460); // fade as it passes the camera
  const far = 1 - clamp((depth - 2300) / 1100); // fade in from the back
  const opacity = clamp(near * far) * reveal;
  // Real project screenshots stay crisp and clickable for their whole time
  // on screen — the depth blur is only for the fake mock screens, where it
  // doesn't matter that detail is lost while it's far from the camera.
  const blur = site.image
    ? 0
    : mix(4, 0, clamp((depth - 60) / 340)) + clamp((depth - 2100) / 1300) * 3.5;
  const drift = place.float ? Math.sin(camera / 900 + index) * 10 * place.float : 0;

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transform: `translate3d(calc(-50% + ${place.x}vw), calc(-50% + ${place.y + drift * 0.1}vh), ${-depth}px) rotateY(${place.rotY}deg) rotateX(${place.rotX ?? 0}deg)`,
        transformStyle: "preserve-3d",
        opacity,
        filter: `blur(${blur.toFixed(2)}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div className="screen-shell" data-device={place.device}>
        <MiniSite site={site} width={place.w} />
        <span className="screen-glare" aria-hidden />
      </div>
      <div className="screen-caption" style={{ width: place.w }}>
        <span>{site.label}</span>
        <span className="text-accent">{site.kind}</span>
      </div>
    </div>
  );
}

/** The studio walk-through: floating portfolio screens + the travelling K mark. */
function StudioAct({ p }: { p: number }) {
  const { dict } = useLanguage();
  const onLight = useCornerLogoOnLight();
  const camera = p * CAMERA_TRAVEL;
  const reveal = range(p, 0.03, 0.11);

  const introOut = range(p, 0.02, 0.12);
  const toCorner = ease(introOut);
  const walkLabel = range(p, 0.13, 0.2) * (1 - range(p, 0.86, 0.96));

  // The hero mark travels from big-and-centred to the small top-left corner
  // logo as the page moves from the first screen into the second — one
  // continuous fixed element, not a separate logo swapped in after a fade.
  // The anchor point sits at the seam between icon and text: large, the K
  // sits above it and "Kanoy" below (a stack); small, the K sits to its
  // left and "Kanoy" to its right (a row) — icon and text are positioned
  // independently off that shared anchor so the seam can rotate smoothly
  // from a vertical stack to a horizontal row without any layout snap.
  const markLeft = mix(50, 2, toCorner); // vw
  const markTop = mix(42, 2.4, toCorner); // vh
  const markIconVh = mix(40, 2.6, toCorner);
  const markTextVw = mix(7, 1.15, toCorner);
  const markGapVw = mix(0.1, 0.5, toCorner);

  // Icon: stacked -> centred above the anchor (-50%,-100%); row -> flush left of it (-100%,-50%)
  const iconTx = mix(-50, -100, toCorner);
  const iconTy = mix(-100, -50, toCorner);
  const iconGapX = mix(0, -markGapVw / 2, toCorner);
  const iconGapY = mix(-markGapVw / 2, 0, toCorner);

  // Text: stacked -> centred below the anchor (-50%,0%); row -> flush right of it (0%,-50%)
  const textTx = mix(-50, 0, toCorner);
  const textTy = mix(0, -50, toCorner);
  const textGapX = mix(0, markGapVw / 2, toCorner);
  const textGapY = mix(markGapVw / 2, 0, toCorner);

  return (
    <>
      <div className="light-beam" style={{ opacity: mix(0.35, 0.8, p) }} />

      {/* 3D volume */}
      <div className="camera">
        <div className="world">
          {PLACEMENTS.map((place, i) => (
            <Screen key={i} place={place} index={i} camera={camera} reveal={reveal} />
          ))}
        </div>
      </div>

      {/* opening title */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{
          opacity: 1 - introOut,
          transform: `translate3d(0,${introOut * -6}vh,0) scale(${1 + introOut * 0.12})`,
          filter: `blur(${introOut * 12}px)`,
        }}
      >
        {/* spacer matching the travelling mark's footprint so the tagline/hint below keep their spot */}
        <div aria-hidden className="h-[68vh]" />
        <p className="mt-6 max-w-xl whitespace-pre-line text-balance font-body text-sm uppercase tracking-[0.32em] text-studio-muted md:text-base">
          {dict.hero.tagline}
        </p>
        <span className="mt-5 text-[10px] uppercase tracking-[0.4em] text-accent scroll-hint">
          {dict.hero.scrollHint}
        </span>
      </div>

      {/* the K + "Kanoy" mark itself — fixed to the viewport so it can
          travel from the big centred hero position into the persistent
          top-left corner logo as the page scrolls into the second screen,
          then stays there for the rest of the site */}
      <div
        className="pointer-events-none fixed z-40"
        style={{ left: `${markLeft}vw`, top: `${markTop}vh` }}
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
            transform: `translate(${iconTx}%, ${iconTy}%) translate(${iconGapX}vw, ${iconGapY}vw)`,
          }}
        />
        <span
          className={`font-logo hero-text-shine absolute whitespace-nowrap leading-none tracking-[-0.01em] transition-colors duration-300 ${
            onLight ? "text-ink" : "text-studio-foreground"
          }`}
          style={{
            left: 0,
            top: 0,
            fontSize: `${markTextVw}vw`,
            transform: `translate(${textTx}%, ${textTy}%) translate(${textGapX}vw, ${textGapY}vw)`,
          }}
        >
          Kanoy
        </span>
      </div>

      {/* mid-journey label */}
      <div
        className="pointer-events-none absolute bottom-10 left-6 md:left-14"
        style={{ opacity: walkLabel, transform: `translateY(${(1 - walkLabel) * 20}px)` }}
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
          <span style={{ height: `${p * 100}%` }} />
        </div>
      </div>
    </>
  );
}

/** The digital-core scene: ring formation + heading, right after the studio act. */
function PortalAct({ p }: { p: number }) {
  const { dict } = useLanguage();

  const open = range(p, 0, 0.4);
  const rush = range(p, 0.45, 0.86);
  const whiteout = range(p, 0.86, 1);

  const textIn = range(p, 0, 0.16);
  const textOut = range(p, 0.6, 0.76);
  const textOpacity = clamp(textIn * (1 - textOut));

  return (
    // Portal has no clickable content of its own, and it's now a sibling
    // of the studio act in the same stacking context (they share one
    // sticky container) — without this, its rings sit invisibly over the
    // portfolio screens even at opacity 0 and swallow clicks meant for them.
    <div className="pointer-events-none absolute inset-0">
      <div className="portal-void" style={{ opacity: mix(0.35, 1, open) }} />

      <div className="camera">
        <div className="world" style={{ transform: `scale(${1 + rush * 2.4})` }}>
          {Array.from({ length: RINGS }).map((_, i) => {
            const stagger = i / RINGS;
            const localP = clamp((open - stagger * 0.5) / (1 - stagger * 0.5));
            const size = mix(30, 130 + i * 26, ease(localP)) + rush * (260 + i * 80);
            const hue = i % 2 === 0 ? "var(--accent)" : "var(--accent-2)";
            return (
              <div
                key={i}
                className="portal-ring"
                style={{
                  width: `${size}vmin`,
                  height: `${size}vmin`,
                  borderColor: hue,
                  color: hue,
                  borderWidth: mix(1, 2.4, i / RINGS),
                  opacity: clamp(localP) * (1 - rush * 0.45),
                  animationDuration: `${13 + i * 3}s`,
                  animationDirection: i % 2 ? "reverse" : "normal",
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: textOpacity }}
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

      <div
        id="portal-whiteout"
        className="pointer-events-none absolute inset-0 bg-sand"
        style={{ opacity: whiteout }}
      />
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
 */
export function StudioAndPortal() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const studioP = clamp(p / STUDIO_FRAC);
  const portalP = clamp((p - STUDIO_FRAC) / PORTAL_FRAC);

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: `${TOTAL_VH}vh` }}
      aria-label="Entering the KANOY studio and its digital core"
    >
      <div className="sticky top-0 z-40 h-screen overflow-hidden">
        {/* the office photo itself lives in <StudioBackdrop>, fixed behind
            this whole section — everything here only tints/decorates it */}
        <div className="absolute inset-0 bg-room-veil" />
        <StudioAct p={studioP} />
        <PortalAct p={portalP} />
      </div>
    </section>
  );
}
