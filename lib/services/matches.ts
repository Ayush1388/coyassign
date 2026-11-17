import { desc, eq, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { matches, users } from "../db/schema";
import { toMatchProfile, type MatchDTO } from "../dto";

/**
 * Only rows in `matches` count. A one-way like, in either direction, never shows here.
 */
export async function getMatches(db: DB, userId: string): Promise<MatchDTO[]> {
  const rows = await db
    .select({ match: matches, other: users })
    .from(matches)
    .innerJoin(
      users,
      sql`${users.id} = CASE WHEN ${matches.userAId} = ${userId} THEN ${matches.userBId} ELSE ${matches.userAId} END`,
    )
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)))
    .orderBy(desc(matches.createdAt));

  return rows.map(({ match, other }) => ({
    id: match.id,
    createdAt: match.createdAt,
    profile: toMatchProfile(other),
  }));
}
