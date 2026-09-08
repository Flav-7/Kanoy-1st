# Working on this repo

This project is edited from **multiple machines** and also syncs with
[Lovable](https://lovable.dev), which can push its own commits to `main`
independently of any local session.

Because of that:

- **Always `git fetch origin` and compare with `origin/main` before making
  any code changes**, even at the start of a session. If the remote has
  commits not in the local branch, merge them in (`git merge origin/main`,
  resolving conflicts carefully) before starting new work — never assume
  the local working tree already reflects the latest state.
- After committing local changes (only when the user asks for a commit),
  push right away so other machines/Lovable pick them up, rather than
  leaving unpushed commits sitting locally.
- If `git push` is rejected because the remote moved ahead, fetch and merge
  (not rebase/force-push) before retrying — see AGENTS.md for why rewriting
  history here is unsafe.
- When resolving merge conflicts, read both sides carefully: changes may
  come from a parallel Claude Code session or from Lovable's own edits, and
  both represent real, intended work that should be preserved where
  possible.
