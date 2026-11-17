/**
 * pnpm db:setup  -> apply migrations + idempotent seed (runs automatically before `pnpm dev`)
 * pnpm db:reset  -> also wipe the logged-in user's swipes and matches (fresh demo)
 *
 * Uses DATABASE_URL / DATABASE_AUTH_TOKEN from .env if present, else a local SQLite file.
 */
import { existsSync, mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb, DEFAULT_DATABASE_URL } from "../lib/db/client";
import { countRows, resetDemo, seedDb } from "../lib/db/seed";

if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
if (url.startsWith("file:./data")) mkdirSync("data", { recursive: true });

const db = createDb(url, process.env.DATABASE_AUTH_TOKEN);
await migrate(db, { migrationsFolder: "drizzle" });
const result = process.argv.includes("--reset") ? await resetDemo(db) : await seedDb(db);
const counts = await countRows(db);
console.log(`[db] ${url.replace(/\/\/.*@/, "//***@")} ready:`, { ...result, ...counts });
db.$client.close();
