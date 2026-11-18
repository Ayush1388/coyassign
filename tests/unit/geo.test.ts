import { describe, expect, it } from "vitest";
import { distanceBand, haversineKm, sharedInterests } from "@/lib/geo";

describe("geo", () => {
  it("computes great-circle distance (Delhi to Mumbai is ~1150 km)", () => {
    const km = haversineKm({ lat: 28.6315, lng: 77.2167 }, { lat: 19.076, lng: 72.8777 });
    expect(km).toBeGreaterThan(1100);
    expect(km).toBeLessThan(1200);
  });

  it.each([
    [0.4, 0],
    [3.4, 3],
    [12.4, 10],
    [13, 15],
    [87, 90],
    [1149, 1150],
  ])("bands %s km to %s", (km, band) => {
    expect(distanceBand(km)).toBe(band);
  });

  it("matches interests case-insensitively in the other person's wording", () => {
    expect(sharedInterests(["coffee", "Books"], ["Coffee", "Chess", "books"])).toEqual(["Coffee", "books"]);
  });
});
