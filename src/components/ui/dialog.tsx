"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/** Replaces the browser's own scrollbar on the content below with a thin
 *  accent-coloured bar that fills in as you scroll — same "grows with
 *  scroll" language as the studio scene's depth-ruler. Lives outside the
 *  scrolling element itself, so — like the close button — it stays put
 *  while the content scrolls underneath it instead of scrolling away. */
function ScrollProgressBar({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const trackRef = React.useRef<HTMLSpanElement>(null);
  const fillRef = React.useRef<HTMLSpanElement>(null);

  const update = React.useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!el || !track || !fill) return;
    const max = el.scrollHeight - el.clientHeight;
    const progress = max <= 0 ? 0 : Math.min(1, Math.max(0, el.scrollTop / max));
    fill.style.height = `${progress * 100}%`;
    // Nothing to scroll (e.g. the short "choice" step) — hide the whole
    // track, not just the fill, so there's no stray line with nothing to
    // indicate.
    track.style.opacity = max <= 0 ? "0" : "1";
  }, [scrollRef]);

  React.useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [scrollRef, update]);

  return (
    <span
      ref={trackRef}
      aria-hidden
      className="pointer-events-none absolute bottom-32 right-2 top-32 w-px bg-white/10 transition-opacity"
      style={{ opacity: 0 }}
    >
      <span
        ref={fillRef}
        className="absolute inset-x-0 top-0 bg-accent"
        style={{ height: 0, boxShadow: "0 0 8px var(--accent)" }}
      />
    </span>
  );
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // max-h keeps the box within the viewport when its content (e.g.
          // the contact form) is taller than the screen — without this, the
          // centered box grows past the top edge and clips whatever sits
          // near its top, like the close button below. The actual scrolling
          // happens in the inner div, not here, so this box's own edge
          // content (close button, progress bar) never scrolls away.
          "fixed left-[50%] top-[50%] z-50 grid max-h-[85vh] w-full max-w-lg grid-rows-[minmax(0,1fr)] translate-x-[-50%] translate-y-[-50%] overflow-hidden border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          className,
        )}
        {...props}
      >
        <div ref={scrollRef} className="no-scrollbar overflow-y-auto">
          <div className="grid gap-4">{children}</div>
        </div>
        <ScrollProgressBar scrollRef={scrollRef} />
        <DialogPrimitive.Close className="absolute right-4 top-5 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
