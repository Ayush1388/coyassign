import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { matches, swipes, users } from "../db/schema";
import { toMatchProfile, type MatchProfile } from "../dto";
import type { SwipeInput } from "../validation";

export type SwipeErrorCode = "NOT_FOUND" | "ALREADY_SWIPED";

export class SwipeError extends Error {
  constructor(public readonly code: SwipeErrorCode) {
    super(code);
  }
}

export type SwipeResult =
  | { success: true; matched: false; match: null }
  | { success: true; matched: true; match: { id: string; createdAt: string; profile: MatchProfile } };

/**
 * Records a LIKE or PASS and creates a match only if both sides have LIKEd.
 *
 * Both writes run as one atomic batch (a single SQLite transaction):
 *  1. INSERT the swipe. ON CONFLICT DO NOTHING plus the UNIQUE(swiper, target)
 *     index means a duplicate or concurrent request inserts nothing, and we return 409.
 *  2. INSERT the match only WHERE the stored rows show LIKE in both directions.
 *     The condition reads the database, not the request, so a PASS, or a
 *     duplicate LIKE after an earlier PASS, can never create a match. The canonical
 *     (a < b) pair plus a UNIQUE index makes duplicate matches impossible.
 *
 * The same statements run for LIKE and PASS, so the response to a PASS is
 * identical whether or not the other person liked you.
 */
export async function recordSwipe(db: DB, userId: string, input: SwipeInput): Promise<SwipeResult> {
  const { profileId, action } = input;
  if (profileId === userId) throw new SwipeError("NOT_FOUND");

  const target = await db.select().from(users).where(eq(users.id, profileId)).get();
  if (!target) throw new SwipeError("NOT_FOUND");

  const [userA, userB] = userId < profileId ? [userId, profileId] : [profileId, userId];
  const matchId = `match_${randomUUID()}`;

  const [insertedSwipe, createdMatch] = await db.batch([
    db
      .insert(swipes)
      .values({ id: `swipe_${randomUUID()}`, swiperId: userId, targetId: profileId, action })
      .onConflictDoNothing()
      .returning({ id: swipes.id }),
    db.all<{ id: string; created_at: string }>(sql`
      INSERT INTO ${matches} (id, user_a_id, user_b_id)
      SELECT ${matchId}, ${userA}, ${userB}
      WHERE EXISTS (
        SELECT 1 FROM ${swipes} WHERE swiper_id = ${userId} AND target_id = ${profileId} AND action = 'LIKE'
      ) AND EXISTS (
        SELECT 1 FROM ${swipes} WHERE swiper_id = ${profileId} AND target_id = ${userId} AND action = 'LIKE'
      )
      ON CONFLICT DO NOTHING
      RETURNING id, created_at
    `),
  ]);

  if (insertedSwipe.length === 0) throw new SwipeError("ALREADY_SWIPED");

  const match = createdMatch[0];
  if (!match) return { success: true, matched: false, match: null };

  return {
    success: true,
    matched: true,
    match: { id: match.id, createdAt: match.created_at, profile: toMatchProfile(target) },
  };
}
