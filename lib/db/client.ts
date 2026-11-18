import { copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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

/**
 * On Vercel the deployed files are read-only; only the temp folder is writable.
 * `vercel-build` seeds a SQLite file into the deployment (`data/coy.db`), and the first
 * request on each server copies it to the temp folder and opens that copy. State therefore
 * lives for as long as that server instance stays warm. Use a hosted database
 * (DATABASE_URL) when it must outlive the server.
 */
export function prepareRuntimeUrl(
  url: string,
  env: Record<string, string | undefined> = process.env,
  cwd: string = process.cwd(),
): string {
  if (!env.VERCEL || !url.startsWith("file:")) return url;
  const source = path.resolve(cwd, url.slice("file:".length));
  const target = path.join(tmpdir(), "coy.db");
  if (!existsSync(target)) copyFileSync(source, target);
  return `file:${target.replaceAll("\\", "/")}`;
}

// Reuse one connection across hot reloads in dev and across requests on a warm lambda.
const globalForDb = globalThis as unknown as { __coyDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__coyDb) {
    const { url, authToken } = databaseConfig();
    globalForDb.__coyDb = createDb(prepareRuntimeUrl(url), authToken);
  }
  return globalForDb.__coyDb;
}
