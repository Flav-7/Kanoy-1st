import { createFileRoute } from "@tanstack/react-router";
import { ErrorsPage } from "@/components/errors/ErrorsPage";

export const Route = createFileRoute("/erros")({
  head: () => ({
    meta: [{ title: "KANOY — Erros" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ErrorsPage,
});
