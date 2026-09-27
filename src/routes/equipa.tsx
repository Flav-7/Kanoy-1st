import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/components/team/TeamPage";

export const Route = createFileRoute("/equipa")({
  head: () => ({
    meta: [{ title: "KANOY — Equipa" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: TeamPage,
});
