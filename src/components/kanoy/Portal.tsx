import { clamp, ease, mix, range, useScrollProgress } from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.png";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const RINGS = 7;

/**
 * A scroll-driven wormhole between the studio walk-through and the service
 * reveal: rings spin up, the KANOY K rushes the camera, and a chromatic
 * glitch flash hands off into the next scene.
 */
export function Portal() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();

  const open = range(p, 0.06, 0.5);
  const rush = range(p, 0.45, 0.86);
  const flash = range(p, 0.62, 0.8) * (1 - range(p, 0.8, 0.94));
  const whiteout = range(p, 0.86, 1);

  const textIn = range(p, 0.12, 0.32);
  const textOut = range(p, 0.6, 0.76);
  const textOpacity = clamp(textIn * (1 - textOut));

  const kOpacity = range(p, 0.08, 0.28) * (1 - range(p, 0.7, 0.88));
  const kScale = mix(0.25, 1, ease(range(p, 0.1, 0.5))) + rush * 2.6;

  return (
    <section ref={ref} className="relative h-[300vh]" aria-label="Portal">
      <div className="sticky top-0 h-screen overflow-hidden bg-studio">
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

        <img
          src={kanoyK}
          alt=""
          aria-hidden
          className="portal-k"
          style={{
            transform: `translate(-50%, -50%) scale(${kScale}) rotate(${p * 160}deg)`,
            opacity: clamp(kOpacity),
          }}
        />

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

        <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: flash * 0.9 }} />
        <div className="pointer-events-none absolute inset-0 bg-background" style={{ opacity: whiteout }} />
      </div>
    </section>
  );
}
