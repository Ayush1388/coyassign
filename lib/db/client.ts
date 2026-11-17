import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { DEFAULT_DATABASE_URL, databaseConfig } from "./env";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema> & { $client: Client };

export { DEFAULT_DATABASE_URL };

export function createDb(url: string = DEFAULT_DATABASE_URL, authToken?: string): DB {
  const client = createClient({ url, authToken: authToken || undefined });
  return drizzle(client, { schema }) as DB;
}

// Reuse one connection across hot reloads in dev and across requests on a warm lambda.
const globalForDb = globalThis as unknown as { __coyDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__coyDb) {
    const { url, authToken } = databaseConfig();
    globalForDb.__coyDb = createDb(url, authToken);
  }
  return globalForDb.__coyDb;
}
