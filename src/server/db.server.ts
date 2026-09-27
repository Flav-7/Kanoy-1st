import { migrate, neonDb, type Db } from "./db";

/**
 * The app's database. Production (Vercel) talks to Neon through DATABASE_URL,
 * which the Neon integration sets. The local dev server, when DATABASE_URL is
 * absent, runs an embedded Postgres (PGlite) persisted in .data/pglite, migrated
 * and seeded with test accounts on first start. Anywhere else, no URL means
 * the feature is simply unavailable.
 */

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("DATABASE_UNAVAILABLE");
  }
}

// Kept on globalThis so Vite's hot reloads reuse one connection (PGlite in
// particular can only be opened once per data folder).
const store = globalThis as typeof globalThis & { __kanoyDb?: Promise<Db> | undefined };

export function getDb(): Promise<Db> {
  store.__kanoyDb ??= open().catch((err: unknown) => {
    store.__kanoyDb = undefined;
    throw err;
  });
  return store.__kanoyDb;
}

async function open(): Promise<Db> {
  const url = process.env["DATABASE_URL"];
  if (url) return neonDb(url);

  if (import.meta.env.DEV) {
    const { createPgliteDb } = await import("./pglite-db");
    const { seedDevData } = await import("./dev-seed");
    const db = await createPgliteDb(".data/pglite");
    await migrate(db);
    await seedDevData(db);
    return db;
  }

  throw new DatabaseUnavailableError();
}
