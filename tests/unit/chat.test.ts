import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID as ME } from "@/lib/auth";
import { countRows } from "@/lib/db/seed";
import { getConversation, reportMatch, sendMessage, unmatch } from "@/lib/services/chat";
import { getFeed } from "@/lib/services/feed";
import { getMatches } from "@/lib/services/matches";
import { recordSwipe } from "@/lib/services/swipe";
import { LIKERS, makeTestDb, NON_LIKERS, type TestDb } from "../helpers";

let t: TestDb;
beforeEach(async () => {
  t = await makeTestDb();
});
afterEach(() => t.cleanup());

async function matchWith(profileId: string) {
  const r = await recordSwipe(t.db, ME, { profileId, action: "LIKE" });
  if (!r.matched) throw new Error("expected a match");
  return r.match.id;
}

describe("chat", () => {
  it("new matches start empty with conversation starters", async () => {
    const id = await matchWith(LIKERS[0]);
    const c = await getConversation(t.db, ME, id);
    expect(c.messages).toEqual([]);
    expect(c.typing).toBe(false);
    expect(c.starters.length).toBeGreaterThan(0);
    const [m] = await getMatches(t.db, ME);
    expect(m.yourTurn).toBe(true);
    expect(m.lastMessage).toBeNull();
  });

  it("sends a message and shows the other side as typing until their reply arrives", async () => {
    const id = await matchWith(LIKERS[0]);
    const t0 = new Date("2026-11-18T10:00:00.000Z");
    const sent = await sendMessage(t.db, ME, id, "hey there", t0);
    expect(sent).toMatchObject({ body: "hey there", fromMe: true });

    const soon = await getConversation(t.db, ME, id, new Date(t0.getTime() + 500));
    expect(soon.messages.map((m) => m.fromMe)).toEqual([true]);
    expect(soon.typing).toBe(true);

    const later = await getConversation(t.db, ME, id, new Date(t0.getTime() + 10_000));
    expect(later.messages.map((m) => m.fromMe)).toEqual([true, false]);
    expect(later.typing).toBe(false);

    const [m] = await getMatches(t.db, ME, new Date(t0.getTime() + 10_000));
    expect(m.lastMessage?.fromMe).toBe(false);
    expect(m.yourTurn).toBe(true);
  });

  it("only members of a match can read or send; everyone else gets NOT_FOUND", async () => {
    await expect(getConversation(t.db, ME, "match_nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(sendMessage(t.db, ME, "match_nope", "hi")).rejects.toMatchObject({ code: "NOT_FOUND" });
    // A real match between two other people is invisible to me.
    await t.db.$client.execute({
      sql: "INSERT INTO matches (id,user_a_id,user_b_id) VALUES ('match_other',?,?)",
      args: [LIKERS[0], LIKERS[1]].sort(),
    });
    await expect(getConversation(t.db, ME, "match_other")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("unmatch removes the match and the chat, and the profile never returns to the feed", async () => {
    const id = await matchWith(LIKERS[0]);
    await sendMessage(t.db, ME, id, "hi");
    await unmatch(t.db, ME, id);
    expect(await getMatches(t.db, ME)).toEqual([]);
    expect((await countRows(t.db)).messages).toBe(0);
    expect((await getFeed(t.db, ME)).map((p) => p.id)).not.toContain(LIKERS[0]);
    await expect(getConversation(t.db, ME, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("reporting records a report and unmatches", async () => {
    const id = await matchWith(LIKERS[0]);
    await reportMatch(t.db, ME, id, "fake_profile");
    expect(await getMatches(t.db, ME)).toEqual([]);
    const r = await t.db.$client.execute("SELECT reported_id, reason FROM reports");
    expect(r.rows[0]).toMatchObject({ reported_id: LIKERS[0], reason: "fake_profile" });
  });
});

describe("feed filters, distance and shared interests", () => {
  it("filters by age range", async () => {
    const feed = await getFeed(t.db, ME, { minAge: 22, maxAge: 23 });
    expect(feed.length).toBeGreaterThan(0);
    for (const p of feed) expect(p.age).toBeGreaterThanOrEqual(22);
    for (const p of feed) expect(p.age).toBeLessThanOrEqual(23);
  });

  it("filters by (banded) distance and keeps nearby people only", async () => {
    const all = await getFeed(t.db, ME);
    const near = await getFeed(t.db, ME, { maxKm: 25 });
    expect(near.length).toBeGreaterThan(0);
    expect(near.length).toBeLessThan(all.length);
    for (const p of near) expect(p.distanceKm!).toBeLessThanOrEqual(25);
  });

  it("computes shared interests against the viewer's interests", async () => {
    const feed = await getFeed(t.db, ME);
    const withShared = feed.filter((p) => p.sharedInterests.length > 0);
    expect(withShared.length).toBeGreaterThan(10);
    for (const p of withShared) for (const s of p.sharedInterests) expect(p.interests).toContain(s);
  });

  it("filtering never changes the relative order (no hidden ranking)", async () => {
    const all = (await getFeed(t.db, ME)).map((p) => p.id);
    const near = (await getFeed(t.db, ME, { maxKm: 25 })).map((p) => p.id);
    expect(all.filter((id) => near.includes(id))).toEqual(near);
  });

  it("matches carry shared interests, and one-way likes still never appear", async () => {
    await recordSwipe(t.db, ME, { profileId: NON_LIKERS[0], action: "LIKE" });
    await recordSwipe(t.db, ME, { profileId: LIKERS[0], action: "LIKE" });
    const list = await getMatches(t.db, ME);
    expect(list.map((m) => m.profile.id)).toEqual([LIKERS[0]]);
    expect(Array.isArray(list[0].sharedInterests)).toBe(true);
  });
});

describe("sent likes (the 'Liked' tab)", () => {
  it("lists only my own pending likes: no passes, no matches, never people who liked me", async () => {
    const { getSentLikes } = await import("@/lib/services/likes");
    await recordSwipe(t.db, ME, { profileId: NON_LIKERS[0], action: "LIKE" }); // pending
    await recordSwipe(t.db, ME, { profileId: NON_LIKERS[1], action: "PASS" }); // pass
    await recordSwipe(t.db, ME, { profileId: LIKERS[0], action: "LIKE" }); // becomes a match
    const sent = (await getSentLikes(t.db, ME)).map((p) => p.id);
    expect(sent).toEqual([NON_LIKERS[0]]);
    // Seeded profiles that liked me (but I haven't swiped) must not appear.
    for (const id of LIKERS.slice(1)) expect(sent).not.toContain(id);
  });
});
