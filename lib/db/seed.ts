import { eq, inArray, or, sql } from "drizzle-orm";
import { extraPhotosFor, PROFILES, SELF, photoFor } from "@/db/profiles";
import type { DB } from "./client";
import { matches, messages, reports, swipes, users } from "./schema";

/**
 * Idempotent. Upserts profiles and the seeded "they already liked you" rows.
 * It never touches the logged-in user's own swipes, matches or messages, so
 * restarting the app (which runs this) keeps all demo progress.
 */
export async function seedDb(db: DB) {
  const rows = [
    {
      ...SELF,
      photoUrl: null,
      photos: [],
      promptQuestion: null,
      promptAnswer: null,
    },
    ...PROFILES.map(({ likesYou: _private, prompt, ...p }) => ({
      ...p,
      college: p.college ?? null,
      photoUrl: photoFor(p.id),
      photos: [photoFor(p.id), ...extraPhotosFor(p.id)],
      promptQuestion: prompt[0],
      promptAnswer: prompt[1],
    })),
  ];

  for (const row of rows) {
    const { id: _id, ...updatable } = row;
    await db.insert(users).values(row).onConflictDoUpdate({ target: users.id, set: updatable });
  }

  const incoming = PROFILES.filter((p) => p.likesYou).map((p) => ({
    id: `seed_${p.id}_${SELF.id}`,
    swiperId: p.id,
    targetId: SELF.id,
    action: "LIKE" as const,
  }));
  if (incoming.length) {
    await db.insert(swipes).values(incoming).onConflictDoNothing();
  }
  return { profiles: PROFILES.length, incomingLikes: incoming.length };
}

/** Clears only the logged-in user's decisions, matches, chats and reports, then reseeds. */
export async function resetDemo(db: DB, userId: string = SELF.id) {
  const myMatches = db
    .select({ id: matches.id })
    .from(matches)
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)));
  await db.batch([
    db.delete(messages).where(inArray(messages.matchId, myMatches)),
    db.delete(matches).where(or(eq(matches.userAId, userId), eq(matches.userBId, userId))),
    db.delete(swipes).where(eq(swipes.swiperId, userId)),
    db.delete(reports).where(eq(reports.reporterId, userId)),
  ]);
  return seedDb(db);
}

export async function countRows(db: DB) {
  const [u] = await db.select({ n: sql<number>`count(*)` }).from(users);
  const [s] = await db.select({ n: sql<number>`count(*)` }).from(swipes);
  const [m] = await db.select({ n: sql<number>`count(*)` }).from(matches);
  const [msg] = await db.select({ n: sql<number>`count(*)` }).from(messages);
  return { users: u.n, swipes: s.n, matches: m.n, messages: msg.n };
}
