import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Everyone on the platform, including the logged-in user ("me").
 * Only public profile fields live here. Who-liked-whom is NOT a column on this
 * table; it lives in `swipes`, so a careless `select *` on users can't leak it.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio").notNull().default(""),
  city: text("city").notNull(),
  college: text("college"),
  interests: text("interests", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});

/**
 * One decision by one user about another. Seeded "X already liked me" data is
 * just a LIKE row with swiper = X, target = me, so matching is the same symmetric
 * check a real multi-user system would do.
 */
export const swipes = sqliteTable(
  "swipes",
  {
    id: text("id").primaryKey(),
    swiperId: text("swiper_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action", { enum: ["LIKE", "PASS"] }).notNull(),
    createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [
    // A user can decide on another user exactly once; this also blocks races.
    uniqueIndex("swipes_swiper_target_uq").on(t.swiperId, t.targetId),
    index("swipes_target_idx").on(t.targetId),
    check("swipes_action_ck", sql`${t.action} IN ('LIKE','PASS')`),
    check("swipes_not_self_ck", sql`${t.swiperId} <> ${t.targetId}`),
  ],
);

/**
 * A confirmed mutual match. The pair is stored in canonical order (a < b), so
 * the UNIQUE index makes duplicate matches impossible regardless of who liked first.
 */
export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    userAId: text("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [
    uniqueIndex("matches_pair_uq").on(t.userAId, t.userBId),
    check("matches_order_ck", sql`${t.userAId} < ${t.userBId}`),
  ],
);

export type UserRow = typeof users.$inferSelect;
