import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/app/AccountPage";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [{ title: "KANOY — Minha conta" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AccountPage,
});
