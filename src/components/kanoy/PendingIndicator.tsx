/** Shown by the router while a route's code/data is still loading (see
 *  router.tsx's defaultPendingComponent) — only appears for transitions
 *  slow enough to need it, per defaultPendingMs. */
export function PendingIndicator() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        aria-label="A carregar"
        role="status"
        className="h-8 w-8 animate-spin rounded-full border-2 border-accent/25 border-t-accent"
      />
    </div>
  );
}
