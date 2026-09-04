import { useEffect, useState } from "react";
import studio from "@/assets/branding/studio-depth.png";
import studioMobile from "@/assets/branding/studio-depth-mobile.png";
import { clamp, mix, useIsMobile } from "./anim";

// Combined scroll distance of the two sections this backdrop sits behind:
// StudioScene (760vh) + Portal (300vh). Kept in sync with those sections'
// own h-[...vh] heights.
const TOTAL_VH = 760 + 300;

/**
 * The single, shared office backdrop behind both the studio walk-through
 * and the Portal scene. Rendered exactly once and fixed to the viewport,
 * so scrolling from one section into the next never shows a second copy
 * of the image restarting or a seam where one crop ends and another
 * begins — it's the same photo the whole time, slowly zooming/panning as
 * one continuous camera move across both sections combined.
 */
export function StudioBackdrop() {
  const [t, setT] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const total = (window.innerHeight * TOTAL_VH) / 100;
      const next = total <= 0 ? 0 : clamp(window.scrollY / total, 0, 1);
      setT((prev) => (Math.abs(prev - next) > 0.0008 ? next : prev));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* the photo itself — no CSS filter here: filtering a huge fixed
          background can make Chrome rasterize it in tiles and show a
          faint seam where two tiles meet. Darkening is done below with a
          plain overlay instead. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${isMobile ? studioMobile : studio})`,
          backgroundSize: isMobile ? `${mix(140, 200, t)}% auto` : `${mix(112, 178, t)}% auto`,
          backgroundPosition: `50% ${mix(20, 13, t)}%`,
          backgroundRepeat: "no-repeat",
          transform: `translate3d(0,${mix(0, -3, t)}vh,0)`,
        }}
      />

      {/* subtle ambient life: the blue LED strips breathe, a couple of
          glass reflections drift a few px — the photo above never moves */}
      <div
        className="hero-glow"
        style={{
          background:
            "radial-gradient(9% 60% at 21% 46%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 75%)",
          animationDuration: "9s",
          animationDelay: "-2s",
        }}
      />
      <div
        className="hero-glow"
        style={{
          background:
            "radial-gradient(9% 58% at 77% 50%, color-mix(in oklab, var(--accent-2) 50%, transparent), transparent 75%)",
          animationDuration: "11s",
          animationDelay: "-6s",
        }}
      />
      <div
        className="hero-reflection"
        style={{
          background:
            "linear-gradient(112deg, transparent 32%, color-mix(in oklab, white 7%, transparent) 46%, transparent 60%)",
          animationDuration: "19s",
        }}
      />
      <div
        className="hero-reflection"
        style={{
          background:
            "linear-gradient(250deg, transparent 35%, color-mix(in oklab, var(--accent) 6%, transparent) 48%, transparent 62%)",
          animationDuration: "23s",
          animationDelay: "-9s",
        }}
      />

      <div
        className="absolute inset-0"
        style={{ background: "#0a0f12", opacity: mix(0.45, 0.28, t) }}
      />
    </div>
  );
}
