import { and, desc, eq, lte, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { matches, messages, users } from "../db/schema";
import { sharedWith, toMatchProfile, type MatchDTO } from "../dto";
import { getViewer } from "./feed";

/**
 * Only rows in `matches` count. A one-way like, in either direction, never shows here.
 * Sorted by latest activity (last delivered message, else match time).
 */
export async function getMatches(db: DB, userId: string, now = new Date()): Promise<MatchDTO[]> {
  const viewer = await getViewer(db, userId);
  const nowIso = now.toISOString();

  const rows = await db
    .select({ match: matches, other: users })
    .from(matches)
    .innerJoin(
      users,
      sql`${users.id} = CASE WHEN ${matches.userAId} = ${userId} THEN ${matches.userBId} ELSE ${matches.userAId} END`,
    )
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)))
    .orderBy(desc(matches.createdAt));

  const result: MatchDTO[] = [];
  for (const { match, other } of rows) {
    const last = await db
      .select()
      .from(messages)
      .where(and(eq(messages.matchId, match.id), lte(messages.deliverAt, nowIso)))
      .orderBy(desc(messages.deliverAt))
      .limit(1)
      .get();
    result.push({
      id: match.id,
      createdAt: match.createdAt,
      profile: toMatchProfile(other),
      sharedInterests: sharedWith(viewer, other),
      lastMessage: last ? { body: last.body, fromMe: last.senderId === userId, createdAt: last.deliverAt } : null,
      yourTurn: !last || last.senderId !== userId,
    });
  }

  const activity = (m: MatchDTO) => m.lastMessage?.createdAt ?? m.createdAt;
  return result.sort((a, b) => activity(b).localeCompare(activity(a)));
}
