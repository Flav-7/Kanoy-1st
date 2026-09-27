import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "./db";

/** In-process Postgres for local dev (persisted to a folder) and tests (in memory). */
export async function createPgliteDb(dataDir?: string): Promise<Db & { close(): Promise<void> }> {
  if (dataDir) mkdirSync(dataDir, { recursive: true }); // PGlite only creates the last folder
  const pg = dataDir ? new PGlite(dataDir) : new PGlite();
  await pg.waitReady;
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query<T>(text, params)).rows;
    },
    async batch(statements) {
      await pg.transaction(async (tx) => {
        for (const s of statements) await tx.query(s.text, s.params ?? []);
      });
    },
    close: () => pg.close(),
  };
}
