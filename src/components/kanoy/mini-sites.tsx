import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { H, W, type MiniSiteDef } from "./mini-sites-data";

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
              {site.image ? (
                <img
                  src={site.image}
                  alt={site.label}
                  className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <ZoomedMock site={site} />
              )}
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
