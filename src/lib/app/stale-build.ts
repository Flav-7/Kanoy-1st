/**
 * After a deploy, a page opened from a saved copy (the service worker's
 * offline/slow-network fallback, or a tab left open) still points at the
 * previous build's files, which no longer exist — the first lazily loaded
 * part of the site then fails and the app stalls half-loaded. When that
 * happens, reload once to pick up the current build. At most once a minute,
 * so a real outage can't turn into a reload loop.
 */

const KEY = "kanoy-stale-reload";
const MIN_INTERVAL_MS = 60_000;

const STALE_MESSAGE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

function reloadOnce(): void {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // No sessionStorage: still reload; the next failure would need a manual one.
  }
  window.location.reload();
}

export function isStaleBuildError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return STALE_MESSAGE.test(message);
}

let installed = false;

export function installStaleBuildRecovery(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // Vite's own signal for a failed lazy import.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleBuildError(event.reason)) reloadOnce();
  });
  window.addEventListener("error", (event) => {
    if (isStaleBuildError(event.error ?? event.message)) reloadOnce();
  });
}

/** For the root error screen: a stale-build error there means "reload", not "something broke". */
export function recoverIfStaleBuild(error: unknown): boolean {
  if (!isStaleBuildError(error)) return false;
  reloadOnce();
  return true;
}
