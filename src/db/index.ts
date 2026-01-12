import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Lazy initialization to prevent crash on missing env vars
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is not set. " +
      "Please configure your environment variables on Vercel."
    );
  }
  if (!_db) {
    const sql = neon(connectionString);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// For backwards compatibility - will throw if not configured
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

export * from "./schema";
