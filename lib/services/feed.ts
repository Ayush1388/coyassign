import { and, eq, ne, notExists, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { swipes, users } from "../db/schema";
import { toPublicProfile, type PublicProfile } from "../dto";

/** FNV-1a. Deterministic, cheap, and based only on public data. */
function stableHash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Profiles the user has not swiped on yet, computed on the server.
 *
 * Ordering is a stable shuffle of profile ids. It deliberately does not depend on
 * whether someone liked the user: sorting "likers first" would be a side channel
 * that reveals incoming likes.
 */
export async function getFeed(db: DB, userId: string): Promise<PublicProfile[]> {
  const alreadySwiped = db
    .select({ one: sql`1` })
    .from(swipes)
    .where(and(eq(swipes.swiperId, userId), eq(swipes.targetId, users.id)));

  const rows = await db
    .select()
    .from(users)
    .where(and(ne(users.id, userId), notExists(alreadySwiped)));

  return rows
    .sort((a, b) => stableHash(`${userId}:${a.id}`) - stableHash(`${userId}:${b.id}`))
    .map(toPublicProfile);
}
