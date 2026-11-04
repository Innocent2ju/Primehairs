import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

type TransactionCallback = Parameters<NeonDatabase<typeof schema>["transaction"]>[0];
export type Transaction = Parameters<TransactionCallback>[0];

/**
 * Runs `work` inside one Postgres transaction. The HTTP driver in lib/db.ts can't
 * hold a transaction open, so this opens a WebSocket pool for the duration of the call.
 */
export async function withTransaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const transactionalDb = drizzle(pool, { schema });
    return await transactionalDb.transaction(work);
  } finally {
    await pool.end();
  }
}
