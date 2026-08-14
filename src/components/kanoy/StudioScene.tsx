import { MINI_SITES, MiniSite } from "./mini-sites";
import { clamp, mix, range, useScrollProgress } from "./anim";
import studio from "@/assets/studio-depth.jpg";
import kanoyK from "@/assets/kanoy-k.png";
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
  const blur = mix(4, 0, clamp((depth - 60) / 340)) + clamp((depth - 2100) / 1300) * 3.5;
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

export function StudioScene() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();
  const camera = p * CAMERA_TRAVEL;
  const reveal = range(p, 0.03, 0.11);

  const introOut = range(p, 0.02, 0.12);
  const walkLabel = range(p, 0.13, 0.2) * (1 - range(p, 0.86, 0.96));
  const outro = range(p, 0.9, 1);

  return (
    <section ref={ref} className="relative h-[760vh]" aria-label="Entering the KANOY studio">
      <div className="sticky top-0 h-screen overflow-hidden bg-studio">
        {/* room backdrop — dollies with the camera */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${studio})`,
            backgroundSize: `${mix(112, 178, p)}% auto`,
            backgroundPosition: `50% ${mix(52, 45, p)}%`,
            filter: `saturate(${mix(0.85, 1.05, p)}) brightness(${mix(0.5, 0.72, p)}) blur(${mix(0, 3, range(p, 0.75, 1))}px)`,
            transform: `translate3d(0,${mix(0, -3, p)}vh,0)`,
          }}
        />
        <div className="absolute inset-0 bg-room-veil" />
        <div className="light-beam" style={{ opacity: mix(0.35, 0.8, p) }} />

        {/* 3D volume */}
        <div className="camera">
          <div className="world">
            {PLACEMENTS.map((place, i) => (
              <Screen key={i} place={place} index={i} camera={camera} reveal={reveal} />
            ))}

            {/* brand objects removed at user request */}
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
          <h1 className="flex items-center gap-[2.4vw] md:gap-4">
            <img
              src={kanoyK}
              alt="Kanoy"
              width={1024}
              height={1024}
              className="k-halo k-glow inline-block h-[12vw] w-auto md:h-[8.5vw]"
            />
            <span className="font-logo text-[12vw] leading-none tracking-[-0.01em] text-studio-foreground md:text-[8.5vw]">
              Kanoy
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-balance font-body text-sm uppercase tracking-[0.32em] text-studio-muted md:text-base">
            {dict.hero.tagline}
          </p>
          <span className="mt-16 text-[10px] uppercase tracking-[0.4em] text-accent scroll-hint">
            {dict.hero.scrollHint}
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

        {/* transition to the light half of the experience */}
        <div
          className="pointer-events-none absolute inset-0 bg-background"
          style={{ opacity: outro }}
        />
      </div>
    </section>
  );
}
