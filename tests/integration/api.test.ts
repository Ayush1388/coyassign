import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getFeedRoute } from "@/app/api/feed/route";
import { GET as getMatchesRoute } from "@/app/api/matches/route";
import { POST as swipeRoute } from "@/app/api/swipe/route";
import { CURRENT_USER_ID as ME } from "@/lib/auth";
import { getFeed } from "@/lib/services/feed";
import { getMatches } from "@/lib/services/matches";
import { ALL_PROFILE_IDS, LIKERS, makeTestDb, NON_LIKERS, type TestDb } from "../helpers";

let t: TestDb;

beforeEach(async () => {
  t = await makeTestDb();
  process.env.DATABASE_URL = t.url;
  // Drop the cached connection so the route handlers use this test's DB.
  delete (globalThis as { __coyDb?: unknown }).__coyDb;
});
afterEach(() => {
  const g = globalThis as { __coyDb?: { $client: { close(): void } } };
  g.__coyDb?.$client.close();
  delete g.__coyDb;
  t.cleanup();
});

const swipe = (body: unknown) =>
  swipeRoute(
    new Request("http://test/api/swipe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const feed = async () => (await (await getFeedRoute()).json()) as { profiles: { id: string }[] };
const matches = async () =>
  (await (await getMatchesRoute()).json()) as { matches: { id: string; profile: { id: string } }[] };

describe("GET /api/feed", () => {
  it("returns all unswiped profiles with the public fields", async () => {
    const res = await getFeedRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as { profiles: Record<string, unknown>[] };
    expect(body.profiles).toHaveLength(ALL_PROFILE_IDS.length);
    for (const p of body.profiles) {
      expect(p).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          age: expect.any(Number),
          bio: expect.any(String),
          city: expect.any(String),
          interests: expect.any(Array),
        }),
      );
      expect(typeof p.photoUrl).toBe("string");
    }
  });

  it("excludes profiles already liked", async () => {
    await swipe({ profileId: NON_LIKERS[0], action: "LIKE" });
    expect((await feed()).profiles.map((p) => p.id)).not.toContain(NON_LIKERS[0]);
  });

  it("excludes profiles already passed", async () => {
    await swipe({ profileId: NON_LIKERS[1], action: "PASS" });
    expect((await feed()).profiles.map((p) => p.id)).not.toContain(NON_LIKERS[1]);
  });
});

describe("POST /api/swipe", () => {
  it("records a like (201, no match)", async () => {
    const res = await swipe({ profileId: NON_LIKERS[0], action: "LIKE" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true, matched: false, match: null });
  });

  it("records a pass (201, no match)", async () => {
    const res = await swipe({ profileId: LIKERS[0], action: "PASS" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true, matched: false, match: null });
  });

  it("creates a match on mutual interest and returns the match", async () => {
    const res = await swipe({ profileId: LIKERS[0], action: "LIKE" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, matched: true, match: { profile: { id: LIKERS[0] } } });
    expect(body.match.id).toMatch(/^match_/);
    expect((await matches()).matches.map((m) => m.profile.id)).toEqual([LIKERS[0]]);
  });

  it("does not create a match from a one-way like", async () => {
    await swipe({ profileId: NON_LIKERS[0], action: "LIKE" });
    expect((await matches()).matches).toEqual([]);
  });

  it("returns 409 for a duplicate swipe and writes nothing", async () => {
    await swipe({ profileId: LIKERS[0], action: "LIKE" });
    const res = await swipe({ profileId: LIKERS[0], action: "LIKE" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("ALREADY_SWIPED");
    expect((await matches()).matches).toHaveLength(1);
  });

  it("returns 404 for an unknown profile", async () => {
    const res = await swipe({ profileId: "ghost", action: "LIKE" });
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["bad action", { profileId: "p01", action: "MAYBE" }],
    ["missing profileId", { action: "LIKE" }],
    ["client-claimed match", { profileId: "p01", action: "LIKE", matched: true }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await swipe(body);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(JSON.stringify(json)).not.toMatch(/sqlite|drizzle|stack/i);
  });
});

describe("GET /api/matches", () => {
  it("returns only mutual matches", async () => {
    await swipe({ profileId: LIKERS[0], action: "LIKE" }); // mutual
    await swipe({ profileId: LIKERS[1], action: "PASS" }); // they liked me, I passed
    await swipe({ profileId: NON_LIKERS[0], action: "LIKE" }); // I liked them, they didn't
    const body = await matches();
    expect(body.matches.map((m) => m.profile.id)).toEqual([LIKERS[0]]);
  });
});

describe("persistence", () => {
  it("swipes and matches survive a fresh database connection", async () => {
    await swipe({ profileId: LIKERS[0], action: "LIKE" });
    await swipe({ profileId: NON_LIKERS[0], action: "PASS" });

    const fresh = t.reopen();
    try {
      const feedIds = (await getFeed(fresh, ME)).map((p) => p.id);
      expect(feedIds).not.toContain(LIKERS[0]);
      expect(feedIds).not.toContain(NON_LIKERS[0]);
      expect((await getMatches(fresh, ME)).map((m) => m.profile.id)).toEqual([LIKERS[0]]);
    } finally {
      fresh.$client.close();
    }
  });
});
