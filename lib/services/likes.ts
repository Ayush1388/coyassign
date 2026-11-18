import { and, desc, eq, notExists, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { matches, swipes, users } from "../db/schema";
import { toPublicProfile, type PublicProfile } from "../dto";
import { getViewer } from "./feed";

/**
 * Likes the user has SENT that haven't turned into a match yet.
 * This is the user's own outgoing data, so it reveals nothing about anyone else.
 * Who liked *you* is never listed anywhere (no "Likes you" grid).
 */
export async function getSentLikes(db: DB, userId: string): Promise<PublicProfile[]> {
  const viewer = await getViewer(db, userId);
  const isMatched = db
    .select({ one: sql`1` })
    .from(matches)
    .where(
      or(
        and(eq(matches.userAId, userId), eq(matches.userBId, swipes.targetId)),
        and(eq(matches.userBId, userId), eq(matches.userAId, swipes.targetId)),
      ),
    );

  const rows = await db
    .select({ user: users })
    .from(swipes)
    .innerJoin(users, eq(users.id, swipes.targetId))
    .where(and(eq(swipes.swiperId, userId), eq(swipes.action, "LIKE"), notExists(isMatched)))
    .orderBy(desc(swipes.createdAt));

  return rows.map(({ user }) => toPublicProfile(user, viewer));
}
