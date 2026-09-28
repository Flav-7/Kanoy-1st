import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/** Expected control flow (redirects, not-found, HTTP errors), not bugs. */
function isControlFlow(error: unknown): boolean {
  return (
    error instanceof Response ||
    (error != null &&
      typeof error === "object" &&
      ("statusCode" in error || "isNotFound" in error || "isRedirect" in error))
  );
}

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    const { reportServerError } = await import("./server/errors-report.server");
    await reportServerError(error, request);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Server functions that throw: log them on the "Erros" page, then let the
// error reach the caller as before.
const serverFnErrorMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (!isControlFlow(error)) {
      const { reportServerError } = await import("./server/errors-report.server");
      const { getRequest } = await import("@tanstack/react-start/server");
      await reportServerError(error, getRequest());
    }
    throw error;
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
  functionMiddleware: [serverFnErrorMiddleware],
}));
