export const DEFAULT_DATABASE_URL = "file:./data/coy.db";

/**
 * DATABASE_URL / DATABASE_AUTH_TOKEN, or the TURSO_* names that Vercel's Turso
 * Marketplace integration injects automatically. Falls back to a local SQLite file.
 */
export function databaseConfig() {
  return {
    url: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || DEFAULT_DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined,
  };
}
