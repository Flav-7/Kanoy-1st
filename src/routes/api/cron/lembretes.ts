import { createFileRoute } from "@tanstack/react-router";

/**
 * Morning reminders, called by Vercel Cron once a day (schedule in
 * vite.config.ts). Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused. `?dry=1` shows what would be sent without
 * sending, `?day=YYYY-MM-DD` picks another day (both need the secret too).
 */
export const Route = createFileRoute("/api/cron/lembretes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret) return new Response("CRON_SECRET not set", { status: 503 });
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { getDb } = await import("@/server/db.server");
        const { webPushSender } = await import("@/server/web-push.server");
        const { sendDailyReminders, TEAM_TIME_ZONE } = await import("@/server/reminders");
        const { todayIn } = await import("@/lib/calendar/dates");

        const url = new URL(request.url);
        const day = url.searchParams.get("day") ?? todayIn(TEAM_TIME_ZONE);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return new Response("Bad day", { status: 400 });
        const dryRun = url.searchParams.get("dry") === "1";

        const send = webPushSender();
        if (!send && !dryRun) return new Response("Push not configured", { status: 503 });
        const result = await sendDailyReminders(await getDb(), send ?? (async () => "sent"), day, {
          dryRun,
        });
        return Response.json(result);
      },
    },
  },
});
