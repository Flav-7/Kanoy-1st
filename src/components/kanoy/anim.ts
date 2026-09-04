import { useEffect, useRef, useState } from "react";

/** Scroll progress (0..1) of an element travelling through the viewport. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const next = total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
      setP((prev) => (Math.abs(prev - next) > 0.0008 ? next : prev));
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

  return { ref, p };
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Normalised 0..1 progress of `p` inside the [a,b] window. */
export const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

const LIGHT_BG_SECTION_IDS = ["about", "services", "pricing"];

/** Tracks whether the section currently behind the fixed corner logo has a
 * light background, so the logo text can switch to a readable dark tone. */
export function useCornerLogoOnLight() {
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const refY = 60;
      const inLightSection = LIGHT_BG_SECTION_IDS.some((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= refY && r.bottom > refY;
      });
      // the portal act fades its dark scene to the same sand tone as the
      // About section right before it — flip early so the logo doesn't sit
      // white over that already-light whiteout screen.
      const whiteout = document.getElementById("portal-whiteout");
      const whiteoutRect = whiteout?.getBoundingClientRect();
      const whiteoutInView = whiteoutRect ? whiteoutRect.top < window.innerHeight && whiteoutRect.bottom > 0 : false;
      const whiteoutActive =
        whiteout && whiteoutInView ? parseFloat(getComputedStyle(whiteout).opacity) > 0.5 : false;
      const active = inLightSection || whiteoutActive;
      setOnLight((prev) => (prev !== active ? active : prev));
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

  return onLight;
}

/** Reveals once the element scrolls into view. */
export function useReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setShown(true)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, shown };
}
