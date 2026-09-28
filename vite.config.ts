// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Vercel Cron: morning reminders (src/routes/api/cron/lembretes.ts) at
  // 07:05 UTC = 08:05 in Lisbon in summer, 07:05 in winter. The Hobby plan
  // allows one run a day and may fire any time within that hour.
  nitro: {
    vercel: {
      // Run the server next to the database (Neon, eu-central-1 = Frankfurt)
      // and the team (Portugal). Left to Vercel's default (Washington), every
      // query crossed the Atlantic and opening the app took seconds.
      functions: { regions: ["fra1"] },
      config: { crons: [{ path: "/api/cron/lembretes", schedule: "5 7 * * *" }] },
    },
  } as Record<string, unknown>,
  // Lets the dev server be reached through a Cloudflare quick tunnel (trycloudflare.com)
  // for sharing a preview link — Vite otherwise rejects requests with an unrecognized Host header.
  vite: {
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  },
});
