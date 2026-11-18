/**
 * RELEASE-BLOCKING privacy tests: "Never reveal who has liked the user unless it
 * is mutual." These inspect raw API payloads, not just UI behaviour.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getFeedRoute } from "@/app/api/feed/route";
import { GET as getMatchesRoute } from "@/app/api/matches/route";
import { POST as swipeRoute } from "@/app/api/swipe/route";
import { CURRENT_USER_ID as ME } from "@/lib/auth";
import { getFeed } from "@/lib/services/feed";
import { LIKERS, makeTestDb, NON_LIKERS, type TestDb } from "../helpers";

const FEED_KEYS = ["age", "bio", "city", "college", "distanceKm", "id", "intent", "interests", "languages", "lifestyle", "name", "photoUrl", "prompt", "sameIntent", "sharedInterests", "verified"];
const MATCH_PROFILE_KEYS = ["age", "city", "college", "id", "name", "photoUrl", "verified"];
const LOCATION_KEY = /^(lat|lng|lon|latitude|longitude|coords?|location|geo)$/i;
const FORBIDDEN = /lik(ed|es)(you|me|currentuser)|incoming|admirer|crush|swipe|action|score/i;

let t: TestDb;
beforeEach(async () => {
  t = await makeTestDb();
  process.env.DATABASE_URL = t.url;
  delete (globalThis as { __coyDb?: unknown }).__coyDb;
});
afterEach(() => {
  const g = globalThis as { __coyDb?: { $client: { close(): void } } };
  g.__coyDb?.$client.close();
  delete g.__coyDb;
  t.cleanup();
});

const swipe = async (profileId: string, action: "LIKE" | "PASS") =>
  (
    await swipeRoute(
      new Request("http://test/api/swipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId, action }),
      }),
    )
  ).text();

/** Every key at every depth of a JSON value. */
function allKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      allKeys(v, out);
    }
  return out;
}

describe("privacy: incoming likes are never disclosed", () => {
  it("feed profiles expose only allow-listed fields, with nothing about who liked whom", async () => {
    const raw = await (await getFeedRoute(new Request("http://test/api/feed"))).text();
    const body = JSON.parse(raw) as { profiles: Record<string, unknown>[] };
    for (const p of body.profiles) expect(Object.keys(p).sort()).toEqual(FEED_KEYS);
    expect([...allKeys(body)].filter((k) => FORBIDDEN.test(k))).toEqual([]);
    expect([...allKeys(body)].filter((k) => LOCATION_KEY.test(k))).toEqual([]);
  });

  it("feed exposes only coarse distance bands, never exact coordinates or distances", async () => {
    const raw = await (await getFeedRoute(new Request("http://test/api/feed"))).text();
    expect(raw).not.toMatch(/28\.\d{3}|77\.\d{3}/); // no Delhi-ish coordinates anywhere in the payload
    const body = JSON.parse(raw) as { profiles: { distanceKm: number | null }[] };
    for (const { distanceKm: d } of body.profiles) {
      expect(d).not.toBeNull();
      expect(Number.isInteger(d)).toBe(true);
      if (d! >= 10 && d! < 50) expect(d! % 5).toBe(0);
      if (d! >= 50 && d! < 200) expect(d! % 10).toBe(0);
      if (d! >= 200) expect(d! % 50).toBe(0);
    }
  });

  it("feed payload for a liker is shaped exactly like a non-liker", async () => {
    const body = JSON.parse(await (await getFeedRoute(new Request("http://test/api/feed"))).text()) as { profiles: Record<string, unknown>[] };
    const liker = body.profiles.find((p) => p.id === LIKERS[0])!;
    const nonLiker = body.profiles.find((p) => p.id === NON_LIKERS[0])!;
    expect(Object.keys(liker)).toEqual(Object.keys(nonLiker));
  });

  it("feed order does not depend on who liked the user", async () => {
    const before = (await getFeed(t.db, ME)).map((p) => p.id);
    await t.db.$client.execute({ sql: "DELETE FROM swipes WHERE target_id = ?", args: [ME] });
    const after = (await getFeed(t.db, ME)).map((p) => p.id);
    expect(after).toEqual(before);
  });

  it("someone who liked me does not appear in matches before I like them back", async () => {
    const body = JSON.parse(await (await getMatchesRoute()).text());
    expect(body).toEqual({ matches: [] });
  });

  it("passing someone who liked me returns the same bytes as passing anyone else", async () => {
    expect(await swipe(LIKERS[0], "PASS")).toBe(await swipe(NON_LIKERS[0], "PASS"));
  });

  it("a one-way like returns no match information", async () => {
    expect(JSON.parse(await swipe(NON_LIKERS[0], "LIKE"))).toEqual({
      success: true,
      matched: false,
      match: null,
    });
  });

  it("only mutual interest produces a match, and only allow-listed fields are revealed", async () => {
    const mutual = JSON.parse(await swipe(LIKERS[0], "LIKE"));
    expect(mutual.matched).toBe(true);
    expect(Object.keys(mutual.match.profile).sort()).toEqual(MATCH_PROFILE_KEYS);

    await swipe(LIKERS[1], "PASS");
    await swipe(NON_LIKERS[0], "LIKE");
    const list = JSON.parse(await (await getMatchesRoute()).text());
    expect(list.matches.map((m: { profile: { id: string } }) => m.profile.id)).toEqual([LIKERS[0]]);
    for (const m of list.matches) expect(Object.keys(m.profile).sort()).toEqual(MATCH_PROFILE_KEYS);
    expect([...allKeys(list)].filter((k) => FORBIDDEN.test(k))).toEqual([]);
  });

  it("a duplicate swipe error is generic and reveals nothing about the other person", async () => {
    await swipe(LIKERS[0], "PASS");
    await swipe(NON_LIKERS[0], "PASS");
    expect(await swipe(LIKERS[0], "LIKE")).toBe(await swipe(NON_LIKERS[0], "LIKE"));
  });
});
