import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { migrate } from "drizzle-orm/libsql/migrator";
import { PROFILES } from "@/db/profiles";
import { createDb, type DB } from "@/lib/db/client";
import { seedDb } from "@/lib/db/seed";

/** A fresh, migrated and seeded SQLite file per test, so tests never share state. */
export async function makeTestDb() {
  const dir = mkdtempSync(join(tmpdir(), "coy-test-"));
  const url = pathToFileURL(join(dir, "test.db")).href;
  const db = createDb(url);
  await migrate(db, { migrationsFolder: "drizzle" });
  await seedDb(db);
  return {
    db,
    url,
    reopen: () => createDb(url),
    cleanup: () => {
      db.$client.close();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* Windows may hold the file briefly; temp dir cleanup is best-effort */
      }
    },
  };
}

export type TestDb = Awaited<ReturnType<typeof makeTestDb>>;
export type { DB };

/** Test fixtures read from private seed data. Never exposed by the app. */
export const LIKERS = PROFILES.filter((p) => p.likesYou).map((p) => p.id);
export const NON_LIKERS = PROFILES.filter((p) => !p.likesYou).map((p) => p.id);
export const ALL_PROFILE_IDS = PROFILES.map((p) => p.id);
