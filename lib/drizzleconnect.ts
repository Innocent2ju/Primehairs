import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

// The database type, derived from the client rather than hand-written.
type Database = NeonHttpDatabase;

// Dev hot reload re-evaluates modules on every change, which would open a new
// connection each time and exhaust Neon. Stash the instance on globalThis so
// it survives reloads; production creates it once per server process anyway.
const globalForDb = globalThis as typeof globalThis & {
  db?: Database;
};

function createDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // neon() returns a fetch-based client — no TCP sockets, so it runs on the
  // Edge runtime and serverless functions alike.
  const client = neon(connectionString);

  return drizzle({ client });
}

export const db: Database = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
