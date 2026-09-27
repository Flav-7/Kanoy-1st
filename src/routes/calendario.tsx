import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/calendar/CalendarPage";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [{ title: "KANOY — Calendário" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: CalendarPage,
});
