import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { H, W, type MiniSiteDef } from "./mini-sites-data";

/** A caption line shown above a preview (left-aligned), naming where the
 *  project is based — a separate line outside the image, never overlaid on
 *  top of it. Matches the type style of the `.screen-caption` line shown
 *  below every preview (same size, tracking, case and color). */
function LocationLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        textAlign: "left",
        marginBottom: 6,
        color: "var(--studio-muted)",
        fontSize: 9,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** A modal image with its own pinch-zoom and pan, driven entirely by touch
 *  events instead of the browser's native pinch-zoom. Native zoom scales
 *  the *visual* viewport while `position: fixed` elements (this modal)
 *  stay sized to the *layout* viewport — so zooming in with two fingers
 *  can pan the visual viewport past the modal's edges and reveal the real
 *  page underneath, which reads as "the site scrolling down". Handling the
 *  gesture ourselves (with `touch-action: none` opting the image out of
 *  native gestures) avoids that entirely. */
function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const gesture = useRef({
    scale: 1,
    x: 0,
    y: 0,
    startDist: 0,
    startScale: 1,
    panStartX: 0,
    panStartY: 0,
    lastTapAt: 0,
  });

  // Keep the image covering its frame — without this, panning a zoomed
  // image drags it past its own edge, leaving bare backdrop showing inside
  // the frame where the picture used to be.
  const clampPan = () => {
    const el = imgRef.current;
    if (!el) return;
    const g = gesture.current;
    const maxX = Math.max(0, (el.offsetWidth * (g.scale - 1)) / 2);
    const maxY = Math.max(0, (el.offsetHeight * (g.scale - 1)) / 2);
    g.x = Math.min(maxX, Math.max(-maxX, g.x));
    g.y = Math.min(maxY, Math.max(-maxY, g.y));
  };

  const apply = () => {
    const el = imgRef.current;
    if (!el) return;
    clampPan();
    const { scale, x, y } = gesture.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const touchDistance = (touches: React.TouchList) => {
    const a = touches[0]!;
    const b = touches[1]!;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    const g = gesture.current;
    if (e.touches.length === 2) {
      g.startDist = touchDistance(e.touches);
      g.startScale = g.scale;
    } else if (e.touches.length === 1) {
      g.panStartX = e.touches[0]!.clientX - g.x;
      g.panStartY = e.touches[0]!.clientY - g.y;
      const now = Date.now();
      if (now - g.lastTapAt < 300) {
        g.scale = g.scale > 1 ? 1 : 2.5;
        g.x = 0;
        g.y = 0;
        apply();
      }
      g.lastTapAt = now;
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    const g = gesture.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      g.scale = Math.min(4, Math.max(1, g.startScale * (dist / g.startDist)));
      apply();
    } else if (e.touches.length === 1 && g.scale > 1) {
      e.preventDefault();
      g.x = e.touches[0]!.clientX - g.panStartX;
      g.y = e.touches[0]!.clientY - g.panStartY;
      apply();
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLImageElement>) => {
    if (e.touches.length === 0 && gesture.current.scale < 1) {
      gesture.current.scale = 1;
      gesture.current.x = 0;
      gesture.current.y = 0;
      apply();
    }
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={{ touchAction: "none", transformOrigin: "center center" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

/** The mock (non-screenshot) preview, redrawn at full size inside the zoom
 *  overlay — same 420x264 design box as the small thumbnail, scaled up via
 *  a measured ResizeObserver instead of a fixed width prop. */
function ZoomedMock({ site }: { site: MiniSiteDef }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="screen-shell"
      style={{ width: "min(92vw, calc(88vh * 420 / 264))", aspectRatio: `${W} / ${H}` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: "var(--font-body)",
        }}
      >
        {site.render?.(site.palette)}
      </div>
    </div>
  );
}

export function MiniSite({ site, width }: { site: MiniSiteDef; width: number }) {
  const scale = width / W;
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock the page behind the zoomed overlay so it can't be scrolled while
  // it's open. `overflow: hidden` alone doesn't stop mobile browsers from
  // panning the page during a touch drag, but the usual fix for that
  // (`position: fixed` on the body) also blocks pinch-to-zoom on the modal
  // image — which matters more here, since zooming the image is the point.
  // So instead: block scrolling only for touches that start on the
  // backdrop, and explicitly let touches on the image itself (single-finger
  // pan or two-finger pinch) through untouched.
  useEffect(() => {
    if (!open) return;
    const { style } = document.documentElement;
    const prevOverflow = style.overflow;
    style.overflow = "hidden";
    const onTouchMove = (e: TouchEvent) => {
      if (contentRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      style.overflow = prevOverflow;
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [open]);

  return (
    <>
      <div
        style={{
          width,
          height: H * scale,
          overflow: "hidden",
          position: "relative",
          cursor: "zoom-in",
          pointerEvents: "auto",
        }}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Ver ${site.label} em tamanho maior`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
      >
        <div
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            fontFamily: "var(--font-body)",
          }}
        >
          {site.image ? (
            <img
              src={site.image}
              alt={site.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            site.render?.(site.palette)
          )}
        </div>
      </div>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal
              aria-label={site.label}
            >
              <div ref={contentRef}>
                {site.image ? (
                  <div className="max-h-[88vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
                    {site.location && <LocationLabel>{site.location}</LocationLabel>}
                    <div className="max-h-[88vh] max-w-[92vw] overflow-hidden rounded-lg shadow-2xl">
                      <ZoomableImage
                        src={site.image}
                        alt={site.label}
                        className="max-h-[88vh] max-w-[92vw]"
                      />
                    </div>
                  </div>
                ) : (
                  <ZoomedMock site={site} />
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
              >
                ✕
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
