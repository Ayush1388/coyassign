import { describe, expect, it } from "vitest";
import { feedQuerySchema, swipeInputSchema } from "@/lib/validation";

describe("swipeInputSchema", () => {
  it.each(["LIKE", "PASS"])("accepts action %s", (action) => {
    expect(swipeInputSchema.safeParse({ profileId: "p01", action }).success).toBe(true);
  });

  it.each([
    ["lowercase action", { profileId: "p01", action: "like" }],
    ["unknown action", { profileId: "p01", action: "SUPERLIKE" }],
    ["missing action", { profileId: "p01" }],
    ["missing profileId", { action: "LIKE" }],
    ["empty profileId", { profileId: "  ", action: "LIKE" }],
    ["non-string profileId", { profileId: 42, action: "LIKE" }],
    ["SQL-ish profileId", { profileId: "p01' OR 1=1 --", action: "LIKE" }],
    ["overlong profileId", { profileId: "x".repeat(65), action: "LIKE" }],
    ["client-claimed match", { profileId: "p01", action: "LIKE", matched: true }],
    ["null body", null],
    ["array body", ["p01", "LIKE"]],
  ])("rejects %s", (_label, body) => {
    expect(swipeInputSchema.safeParse(body).success).toBe(false);
  });

  it("trims whitespace around profileId", () => {
    const r = swipeInputSchema.parse({ profileId: " p01 ", action: "PASS" });
    expect(r.profileId).toBe("p01");
  });
});

describe("feedQuerySchema", () => {
  it("parses list and flag filters", () => {
    const q = feedQuerySchema.parse({ intents: "long_term,friends", verified: "1", interests: "Coffee,Street food" });
    expect(q).toMatchObject({ intents: ["long_term", "friends"], verified: true, interests: ["Coffee", "Street food"] });
  });
  it.each([
    [{ intents: "hookups_only" }],
    [{ smoking: "maybe" }],
    [{ interests: "<script>" }],
    [{ minAge: "30", maxAge: "20" }],
    [{ unknown: "x" }],
  ])("rejects %j", (q) => {
    expect(feedQuerySchema.safeParse(q).success).toBe(false);
  });
});
