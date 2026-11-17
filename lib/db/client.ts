import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema> & { $client: Client };

export const DEFAULT_DATABASE_URL = "file:./data/coy.db";

export function createDb(url: string = DEFAULT_DATABASE_URL, authToken?: string): DB {
  const client = createClient({ url, authToken: authToken || undefined });
  return drizzle(client, { schema }) as DB;
}

// Reuse one connection across hot reloads in dev and across requests on a warm lambda.
const globalForDb = globalThis as unknown as { __coyDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__coyDb) {
    globalForDb.__coyDb = createDb(
      process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
      process.env.DATABASE_AUTH_TOKEN,
    );
  }
  return globalForDb.__coyDb;
}
