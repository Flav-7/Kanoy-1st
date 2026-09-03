import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ZoomIn } from "lucide-react";
import { H, W, type MiniSiteDef } from "./mini-sites-data";

export function MiniSite({ site, width }: { site: MiniSiteDef; width: number }) {
  const scale = width / W;
  const [open, setOpen] = useState(false);
  const clickable = Boolean(site.image);
  const badge = Math.min(Math.max(width * 0.16, 28), 56);

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
          cursor: clickable ? "zoom-in" : undefined,
        }}
        onClick={clickable ? () => setOpen(true) : undefined}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `Ver ${site.label} em tamanho maior` : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") setOpen(true);
              }
            : undefined
        }
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

        {clickable ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: badge * 0.35,
              bottom: badge * 0.35,
              width: badge,
              height: badge,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,12,14,0.55)",
              border: "1px solid rgba(255,255,255,0.35)",
              backdropFilter: "blur(2px)",
              boxShadow: "0 4px 16px -4px rgba(0,0,0,0.6)",
            }}
          >
            <ZoomIn color="#fff" size={badge * 0.55} strokeWidth={2} />
          </div>
        ) : null}
      </div>

      {open && site.image
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal
              aria-label={site.label}
            >
              <img
                src={site.image}
                alt={site.label}
                className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
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
