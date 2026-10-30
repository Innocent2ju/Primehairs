import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
