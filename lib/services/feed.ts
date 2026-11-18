import { and, eq, gte, lte, ne, notExists, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { swipes, users, type UserRow } from "../db/schema";
import { toPublicProfile, type PublicProfile } from "../dto";
import type { FeedFilters } from "../validation";

/** FNV-1a. Deterministic, cheap, and based only on public data. */
function stableHash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export async function getViewer(db: DB, userId: string): Promise<UserRow> {
  const me = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!me) throw new Error("current user missing");
  return me;
}

/**
 * Profiles the user hasn't swiped on yet, computed on the server.
 *
 * Ordering is a stable shuffle of profile ids. It deliberately does not depend on
 * whether someone liked the user: sorting "likers first" would be a side channel
 * that reveals incoming likes. Age is filtered in SQL. Distance is filtered on the
 * coarse band (see lib/geo.ts), never the exact value.
 */
export async function getFeed(db: DB, userId: string, filters: FeedFilters = {}): Promise<PublicProfile[]> {
  const viewer = await getViewer(db, userId);

  const alreadySwiped = db
    .select({ one: sql`1` })
    .from(swipes)
    .where(and(eq(swipes.swiperId, userId), eq(swipes.targetId, users.id)));

  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        ne(users.id, userId),
        notExists(alreadySwiped),
        filters.minAge != null ? gte(users.age, filters.minAge) : undefined,
        filters.maxAge != null ? lte(users.age, filters.maxAge) : undefined,
      ),
    );

  const anyOf = (wanted: string[] | undefined, value: string | null) => !wanted?.length || (!!value && wanted.includes(value));
  const overlaps = (wanted: string[] | undefined, have: string[]) => {
    if (!wanted?.length) return true;
    const w = new Set(wanted.map((x) => x.toLowerCase()));
    return have.some((h) => w.has(h.toLowerCase()));
  };

  return rows
    .sort((a, b) => stableHash(`${userId}:${a.id}`) - stableHash(`${userId}:${b.id}`))
    .map((u) => toPublicProfile(u, viewer))
    .filter((p) => filters.maxKm == null || (p.distanceKm != null && p.distanceKm <= filters.maxKm))
    .filter((p) => anyOf(filters.intents, p.intent))
    .filter((p) => anyOf(filters.drinking, p.lifestyle.drinking))
    .filter((p) => anyOf(filters.smoking, p.lifestyle.smoking))
    .filter((p) => anyOf(filters.workout, p.lifestyle.workout))
    .filter((p) => overlaps(filters.interests, p.interests))
    .filter((p) => overlaps(filters.languages, p.languages))
    .filter((p) => !filters.verified || p.verified)
    .filter((p) => !filters.shared || p.sharedInterests.length > 0);
}

/** Interests and languages that actually exist in the pool, most common first (for filter chips). */
export async function getFilterOptions(db: DB, userId: string) {
  const rows = await db.select({ interests: users.interests, languages: users.languages }).from(users).where(ne(users.id, userId));
  const rank = (lists: string[][]) => {
    const counts = new Map<string, number>();
    for (const l of lists) for (const x of l) counts.set(x, (counts.get(x) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
  };
  return {
    interests: rank(rows.map((r) => (Array.isArray(r.interests) ? r.interests : []))).slice(0, 24),
    languages: rank(rows.map((r) => (Array.isArray(r.languages) ? r.languages : []))),
  };
}
