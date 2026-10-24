import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbOrTx = Database | Transaction;

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }

  // Neon's serverless driver speaks WebSockets, which keeps cold starts fast on
  // serverless hosts. Any other Postgres (e.g. the local PostGIS container) uses node-postgres.
  if (new URL(url).hostname.endsWith(".neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString: url });
    return drizzleNeon({ client: pool, schema }) as unknown as Database;
  }

  const pool = new PgPool({ connectionString: url, max: 10 });
  return drizzlePg({ client: pool, schema });
}

const globalForDb = globalThis as unknown as { __kunchanadaDb?: Database };

function getDb(): Database {
  globalForDb.__kunchanadaDb ??= createDb();
  return globalForDb.__kunchanadaDb;
}

/** Lazily connects on first use so importing this module never requires DATABASE_URL. */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
