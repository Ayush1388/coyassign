import { eq, or, sql } from "drizzle-orm";
import { PROFILES, SELF, photoFor } from "@/db/profiles";
import type { DB } from "./client";
import { matches, swipes, users } from "./schema";

/**
 * Idempotent. Upserts profiles and the seeded "they already liked you" rows.
 * It never touches the logged-in user's own swipes or matches, so restarting the
 * app (which runs this) keeps all demo progress.
 */
export async function seedDb(db: DB) {
  const rows = [
    { ...SELF, photoUrl: null },
    ...PROFILES.map(({ likesYou: _private, ...p }) => ({
      ...p,
      college: p.college ?? null,
      photoUrl: photoFor(p.id),
    })),
  ];

  for (const row of rows) {
    await db
      .insert(users)
      .values(row)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: row.name,
          age: row.age,
          photoUrl: row.photoUrl,
          bio: row.bio,
          city: row.city,
          college: row.college,
          interests: row.interests,
        },
      });
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

/** Clears only the logged-in user's decisions and matches, then reseeds. */
export async function resetDemo(db: DB, userId: string = SELF.id) {
  await db.batch([
    db.delete(swipes).where(eq(swipes.swiperId, userId)),
    db.delete(matches).where(or(eq(matches.userAId, userId), eq(matches.userBId, userId))),
  ]);
  return seedDb(db);
}

export async function countRows(db: DB) {
  const [u] = await db.select({ n: sql<number>`count(*)` }).from(users);
  const [s] = await db.select({ n: sql<number>`count(*)` }).from(swipes);
  const [m] = await db.select({ n: sql<number>`count(*)` }).from(matches);
  return { users: u.n, swipes: s.n, matches: m.n };
}

