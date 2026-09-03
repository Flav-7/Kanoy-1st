import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; mint: boolean; size: number };

/** Glowing cyan/mint sparks that trail the cursor. Desktop only, decorative. */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let particles: Particle[] = [];
    let last = { x: -999, y: -999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dist = Math.hypot(dx, dy);
      const count = Math.min(4, Math.max(1, Math.floor(dist / 12)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.15,
          life: 1,
          mint: Math.random() > 0.5,
          size: 1.6 + Math.random() * 2.4,
        });
      }
      last = { x: e.clientX, y: e.clientY };
      if (particles.length > 200) particles = particles.slice(particles.length - 200);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const cyan: [number, number, number] = [46, 214, 224];
    const mint: [number, number, number] = [72, 232, 168];

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.02;
      });
      particles = particles.filter((pt) => pt.life > 0);
      particles.forEach((pt) => {
        const c = pt.mint ? mint : cyan;
        const r = pt.size * (0.6 + pt.life) * 4;
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.5 * pt.life})`);
        grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[80] hidden md:block"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
