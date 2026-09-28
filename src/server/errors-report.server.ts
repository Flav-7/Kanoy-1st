import { describeError } from "@/lib/error-capture";
import { getDb } from "./db.server";
import { recordError } from "./errors";

/**
 * Where it happened, readably: the page, or for a server function call the
 * page it was called from and the function's name (its URL id is base64 JSON
 * naming the export).
 */
function whereOf(request: Request): string {
  const path = new URL(request.url).pathname;
  const id = /^\/_serverFn\/([^/?]+)/.exec(path)?.[1];
  if (!id) return path;
  let fn = "server function";
  try {
    const { export: name } = JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as {
      export?: string;
    };
    if (name) fn = name.replace(/_createServerFn_handler$/, "");
  } catch {
    // Unknown id format: keep the generic name.
  }
  const referer = request.headers.get("referer");
  let page = "?";
  try {
    if (referer) page = new URL(referer).pathname;
  } catch {
    // Malformed referer.
  }
  return `${page} → ${fn}`;
}

/**
 * Logs a server-side error to the "Erros" page. Best effort: if the database
 * is what's failing, the error still reaches the Vercel logs via console.
 */
export async function reportServerError(error: unknown, request?: Request): Promise<void> {
  try {
    const detail = describeError(error);
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : (detail.split("\n")[0] ?? "");
    await recordError(await getDb(), {
      source: "server",
      message: message || "Unknown server error",
      detail,
      url: request ? whereOf(request) : null,
      userAgent: request?.headers.get("user-agent") ?? null,
    });
  } catch {
    // Nothing more to do; console.error already has it.
  }
}
