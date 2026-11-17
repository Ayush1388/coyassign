/**
 * pnpm db:setup  -> apply migrations + idempotent seed (runs automatically before `pnpm dev`)
 * pnpm db:reset  -> also wipe the logged-in user's swipes and matches (fresh demo)
 *
 * Uses DATABASE_URL / DATABASE_AUTH_TOKEN (or TURSO_*) from the env or .env, else a local SQLite file.
 * On Vercel, `vercel-build` runs this before `next build`, so the hosted DB is migrated + seeded on deploy.
 */
import { existsSync, mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb } from "../lib/db/client";
import { databaseConfig } from "../lib/db/env";
import { countRows, resetDemo, seedDb } from "../lib/db/seed";

if (existsSync(".env")) process.loadEnvFile(".env");

const { url, authToken } = databaseConfig();
if (url.startsWith("file:./data")) mkdirSync("data", { recursive: true });

const db = createDb(url, authToken);
await migrate(db, { migrationsFolder: "drizzle" });
const result = process.argv.includes("--reset") ? await resetDemo(db) : await seedDb(db);
const counts = await countRows(db);
console.log(`[db] ${url.replace(/\/\/.*@/, "//***@")} ready:`, { ...result, ...counts });
db.$client.close();
