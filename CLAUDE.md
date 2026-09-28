# Working on this repo

## Deploys

Production (kanoy.pt, behind Cloudflare) is **Vercel**, project `kanoy-1st`:
every push to `main` deploys to production. Keep `main` working — run the
type check, tests and a build before pushing. Lovable is no longer used to
change the site; ignore Lovable-related comments in the code (e.g. in
`vite.config.ts`).

To check a build the way Vercel runs it:
`VERCEL=1 NITRO_PRESET=vercel npx vite build` (then delete `.vercel/output`).

## Several machines

The project is edited from **multiple machines**, so:

- **Always `git fetch origin` and compare with `origin/main` before making
  any code changes**, even at the start of a session. If the remote has
  commits not in the local branch, merge them in (`git merge origin/main`)
  before starting new work.
- After committing (only when the user asks for a commit), push right away
  so the other machines pick it up.
- If `git push` is rejected because the remote moved ahead, fetch and merge
  — never rebase or force-push published history.
- When resolving conflicts, read both sides: the other side is real work
  from another machine/session and should be preserved where possible.

## Data and secrets

- `npm run dev` uses an embedded Postgres (PGlite) in `.data/pglite`, seeded
  with test accounts (see `src/server/dev-seed.ts`). It never touches
  production.
- Production uses Neon (`DATABASE_URL` on Vercel). Pull production env vars
  with `npx vercel env pull .env.vercel.local` — **not** `.env.local`, which
  the dev server would load and so point local testing at real data.
- Schema changes go in `src/server/schema.ts` as a new migration; apply to
  Neon with `npm run admin -- migrate`. Accounts/password resets:
  `npm run admin` (see `scripts/admin.ts`); areas and people are managed on
  the site at `/equipa`.

## Checks

`npx tsc --noEmit -p .` · `npm test` (Vitest, runs against an in-memory
Postgres) · `npx eslint <files>`.
