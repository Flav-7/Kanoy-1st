import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PendingIndicator } from "./components/kanoy/PendingIndicator";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingIndicator,
    // Most navigations resolve well under this — only genuinely slow ones
    // (e.g. a cold code-split chunk) show the spinner, so fast transitions
    // never flash it.
    defaultPendingMs: 300,
    defaultPendingMinMs: 300,
  });

  return router;
};
