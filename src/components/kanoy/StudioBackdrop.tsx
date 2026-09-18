import { useEffect, useRef } from "react";
import studio from "@/assets/branding/studio-depth.webp";
import studioMobile from "@/assets/branding/studio-depth-mobile.webp";
import { clamp, mix, MOBILE_QUERY } from "./anim";
import { STUDIO_VH } from "./studio-scene";

// The zoom curve below was tuned over the walk-through plus the (since
// removed) Portal act — 1060vh in all — of which the walk-through was the
// first 760. So it now runs only up to that point on the curve, which keeps
// the photo's zoom, pan and darkening at every moment of the walk-through
// exactly as they looked before the Portal was taken out.
const CURVE_AT_END_OF_WALK = 760 / 1060;

/**
 * The single, shared office backdrop behind both the studio walk-through
 * and the Portal scene. Rendered exactly once and fixed to the viewport,
 * so scrolling from one section into the next never shows a second copy
 * of the image restarting or a seam where one crop ends and another
 * begins — it's the same photo the whole time, slowly zooming/panning as
 * one continuous camera move across both sections combined.
 *
 * The zoom/pan/darken driven by scroll is written straight to the DOM via
 * refs instead of React state: this element sits behind ~11 screen-heights
 * of scroll, so it used to re-render (and, worse, resize a full-viewport
 * background-image — a paint, not just a composite) on every single scroll
 * frame. Writing `transform`/`opacity` directly and skipping React/layout
 * entirely keeps this on the compositor thread, which is what makes it
 * cheap enough to sit under the whole page without costing scroll frames.
 */
export function StudioBackdrop() {
  const imgRef = useRef<HTMLImageElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastT = -1;
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const compute = () => {
      raf = 0;
      const total = (window.innerHeight * STUDIO_VH) / 100;
      const t = total <= 0 ? 0 : clamp(window.scrollY / total, 0, 1) * CURVE_AT_END_OF_WALK;
      if (Math.abs(t - lastT) <= 0.0008) return;
      lastT = t;

      const scale = mobileQuery.matches ? mix(1.4, 2.0, t) : mix(1.12, 1.78, t);
      const panY = mix(0, -3, t); // vh — same slow drift the old translate3d did

      const img = imgRef.current;
      if (img) img.style.transform = `translate3d(0, ${panY}vh, 0) scale(${scale})`;

      const veil = veilRef.current;
      if (veil) veil.style.opacity = String(mix(0.45, 0.28, t));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    // Crossing the mobile/desktop breakpoint changes the zoom range without
    // any scroll, so force the next frame to recompute.
    const onBreakpoint = () => {
      lastT = -1;
      onScroll();
    };
    compute();
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
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* the photo itself — object-fit/object-position stay static (no
          per-frame paint work); only `transform` (scale + pan) moves, which
          the compositor handles without repainting the image. */}
      {/* <picture> lets the browser choose the phone/desktop photo itself,
          from the first paint — a JS flag would load the desktop one first
          and swap it a moment later. */}
      <picture>
        <source media={MOBILE_QUERY} srcSet={studioMobile} />
        <img
          ref={imgRef}
          src={studio}
          alt=""
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ objectPosition: "50% 18%", transformOrigin: "50% 18%" }}
        />
      </picture>

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
        ref={veilRef}
        className="absolute inset-0"
        style={{ background: "#0a0f12", opacity: 0.45 }}
      />
    </div>
  );
}
