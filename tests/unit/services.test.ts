import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID as ME } from "@/lib/auth";
import { countRows } from "@/lib/db/seed";
import { getFeed } from "@/lib/services/feed";
import { getMatches } from "@/lib/services/matches";
import { recordSwipe, SwipeError } from "@/lib/services/swipe";
import { ALL_PROFILE_IDS, LIKERS, makeTestDb, NON_LIKERS, type TestDb } from "../helpers";

let t: TestDb;
beforeEach(async () => {
  t = await makeTestDb();
});
afterEach(() => t.cleanup());

const liker = () => LIKERS[0];
const nonLiker = () => NON_LIKERS[0];

describe("matching rules", () => {
  it("LIKE on someone who already liked me creates exactly one match", async () => {
    const r = await recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" });
    expect(r.matched).toBe(true);
    expect(r.match?.profile.id).toBe(liker());
    expect((await countRows(t.db)).matches).toBe(1);
  });

  it("LIKE on someone who has not liked me is recorded but is not a match", async () => {
    const r = await recordSwipe(t.db, ME, { profileId: nonLiker(), action: "LIKE" });
    expect(r).toEqual({ success: true, matched: false, match: null });
    expect(await getMatches(t.db, ME)).toEqual([]);
  });

  it("PASS on someone who liked me never creates a match", async () => {
    const r = await recordSwipe(t.db, ME, { profileId: liker(), action: "PASS" });
    expect(r).toEqual({ success: true, matched: false, match: null });
    expect((await countRows(t.db)).matches).toBe(0);
  });

  it("PASS responses are identical whether or not they liked me (no side channel)", async () => {
    const a = await recordSwipe(t.db, ME, { profileId: liker(), action: "PASS" });
    const b = await recordSwipe(t.db, ME, { profileId: nonLiker(), action: "PASS" });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a passed profile can never become a match, even if a LIKE is retried", async () => {
    await recordSwipe(t.db, ME, { profileId: liker(), action: "PASS" });
    await expect(recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" })).rejects.toMatchObject({
      code: "ALREADY_SWIPED",
    });
    expect((await countRows(t.db)).matches).toBe(0);
  });

  it("matches every seeded liker and nobody else when I like everyone", async () => {
    for (const id of ALL_PROFILE_IDS) await recordSwipe(t.db, ME, { profileId: id, action: "LIKE" });
    const matched = (await getMatches(t.db, ME)).map((m) => m.profile.id).sort();
    expect(matched).toEqual([...LIKERS].sort());
  });
});

describe("duplicates and integrity", () => {
  it("rejects a second swipe on the same profile without writing anything", async () => {
    await recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" });
    const before = await countRows(t.db);
    await expect(recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" })).rejects.toBeInstanceOf(SwipeError);
    expect(await countRows(t.db)).toEqual(before);
  });

  it("concurrent duplicate requests produce one swipe and one match", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({ code: "ALREADY_SWIPED" });
    }
    const counts = await countRows(t.db);
    expect(counts.matches).toBe(1);
    expect(counts.swipes).toBe(LIKERS.length + 1);
  });

  it("returns NOT_FOUND for unknown profiles", async () => {
    await expect(recordSwipe(t.db, ME, { profileId: "nobody", action: "LIKE" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns NOT_FOUND when the user tries to swipe on themselves", async () => {
    await expect(recordSwipe(t.db, ME, { profileId: ME, action: "LIKE" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("the database itself rejects duplicate matches and self-swipes", async () => {
    await recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" });
    const [a, b] = [ME, liker()].sort();
    await expect(
      t.db.$client.execute({ sql: "INSERT INTO matches (id,user_a_id,user_b_id) VALUES ('x',?,?)", args: [a, b] }),
    ).rejects.toThrow();
    await expect(
      t.db.$client.execute({
        sql: "INSERT INTO swipes (id,swiper_id,target_id,action) VALUES ('y',?,?,'LIKE')",
        args: [ME, ME],
      }),
    ).rejects.toThrow();
  });
});

describe("feed", () => {
  it("contains every profile except me before any swipes", async () => {
    const ids = (await getFeed(t.db, ME)).map((p) => p.id).sort();
    expect(ids).toEqual([...ALL_PROFILE_IDS].sort());
    expect(ids).not.toContain(ME);
  });

  it("excludes liked and passed profiles", async () => {
    await recordSwipe(t.db, ME, { profileId: liker(), action: "LIKE" });
    await recordSwipe(t.db, ME, { profileId: nonLiker(), action: "PASS" });
    const ids = (await getFeed(t.db, ME)).map((p) => p.id);
    expect(ids).not.toContain(liker());
    expect(ids).not.toContain(nonLiker());
    expect(ids).toHaveLength(ALL_PROFILE_IDS.length - 2);
  });

  it("is empty once everyone has been swiped", async () => {
    for (const id of ALL_PROFILE_IDS) await recordSwipe(t.db, ME, { profileId: id, action: "PASS" });
    expect(await getFeed(t.db, ME)).toEqual([]);
  });

  it("has a stable order", async () => {
    const a = (await getFeed(t.db, ME)).map((p) => p.id);
    const b = (await getFeed(t.db, ME)).map((p) => p.id);
    expect(a).toEqual(b);
  });
});
