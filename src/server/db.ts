import { neon } from "@neondatabase/serverless";
import { MIGRATIONS } from "./schema";

export type Row = Record<string, unknown>;
export type Statement = { text: string; params?: unknown[] };

/**
 * The only database surface the app uses: parameterised single statements,
 * plus an atomic batch. Neon (production) and PGlite (local dev + tests) both
 * implement it, so the calendar/auth services never know which one they run on.
 */
export interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs all statements in one transaction; all succeed or none do. */
  batch(statements: Statement[]): Promise<void>;
}

export function neonDb(url: string): Db {
  const sql = neon(url);
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await sql.query(text, params)) as T[];
    },
    async batch(statements) {
      await sql.transaction(statements.map((s) => sql.query(s.text, s.params ?? [])));
    },
  };
}

/** Applies any migration not yet recorded in schema_migrations. */
export async function migrate(db: Db): Promise<string[]> {
  await db.query(
    "create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set(
    (await db.query<{ id: string }>("select id from schema_migrations")).map((r) => r.id),
  );
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    await db.batch([
      ...m.statements.map((text) => ({ text })),
      { text: "insert into schema_migrations (id) values ($1)", params: [m.id] },
    ]);
    applied.push(m.id);
  }
  return applied;
}

/** Postgres drivers disagree on whether timestamptz comes back as Date or string. */
export function toIso(value: unknown): string {
  return (value instanceof Date ? value : new Date(String(value))).toISOString();
}
