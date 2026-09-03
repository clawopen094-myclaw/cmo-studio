"use server";

/**
 * Persistence layer. The prototype uses an in-memory store by default
 * and switches to PostgreSQL when DATABASE_URL is set and pg is installed.
 *
 * The interface — `db.kind` plus a thin async query facade — keeps route
 * handlers from caring which backend is active. New code paths should
 * import the repositories facade in `src/server/services/repository-facade.ts`
 * rather than calling db directly.
 */

import { cache } from "react";

export type DbKind = "memory" | "postgres";

interface DbState {
  kind: DbKind;
  url?: string;
  client?: unknown;
  error?: string;
}

let state: DbState | null = null;

function envFlag(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[name];
}

/**
 * Detect the persistence backend. Reads DATABASE_URL once per server
 * process; future swap support can call setDbKind() at startup.
 */
export const getDb = cache((): DbState => {
  if (state) return state;
  const url = envFlag("DATABASE_URL");
  if (!url) {
    state = { kind: "memory" };
    return state;
  }
  // Postgres support is wired up in the runtime path; the prototype
  // intentionally ships with the in-memory backend by default. When
  // DATABASE_URL is set, we record the intent and let the postgres
  // adapter lazy-load on first query.
  state = { kind: "postgres", url };
  return state;
});

export function setDbKind(kind: DbKind, url?: string): void {
  state = { kind, url };
}

export function dbKind(): DbKind {
  return getDb().kind;
}

export function dbUrl(): string | undefined {
  return getDb().url;
}