import { reportErrorFn } from "./errors.functions";

/**
 * Sends errors that happen in the visitor's browser to the "Erros" page:
 * uncaught errors, rejected promises nobody handled, and whatever the root
 * error screen catches. A handful per page view at most, each distinct
 * error once, so a page stuck in a loop doesn't flood anything.
 */

const MAX_PER_PAGE = 8;
const sent = new Set<string>();

function describe(error: unknown): { message: string; detail: string | null } {
  if (error instanceof Response) {
    return {
      message: `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`,
      detail: null,
    };
  }
  if (error instanceof Error) {
    return { message: `${error.name}: ${error.message}`, detail: error.stack ?? null };
  }
  return { message: typeof error === "string" ? error : safeString(error), detail: null };
}

function safeString(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function reportClientError(error: unknown): void {
  if (typeof window === "undefined") return;
  const { message, detail } = describe(error);
  if (!message || sent.has(message) || sent.size >= MAX_PER_PAGE) return;
  sent.add(message);
  void reportErrorFn({
    data: {
      message: message.slice(0, 2000),
      detail: detail?.slice(0, 20_000) ?? null,
      url: window.location.pathname + window.location.search,
    },
  }).catch(() => {});
}

let installed = false;

/** Listens for uncaught errors on this page (once). */
export function installErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    reportClientError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason);
  });
}
