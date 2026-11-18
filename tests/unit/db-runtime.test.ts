import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prepareRuntimeUrl } from "@/lib/db/client";

const TARGET = join(tmpdir(), "coy.db");
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "coy-runtime-"));
  mkdirSync(join(dir, "data"));
  writeFileSync(join(dir, "data", "coy.db"), "seeded");
  rmSync(TARGET, { force: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(TARGET, { force: true });
});

describe("prepareRuntimeUrl (SQLite on a read-only host)", () => {
  it("leaves the URL alone outside Vercel", () => {
    expect(prepareRuntimeUrl("file:./data/coy.db", {}, dir)).toBe("file:./data/coy.db");
    expect(existsSync(TARGET)).toBe(false);
  });

  it("leaves remote databases alone on Vercel", () => {
    expect(prepareRuntimeUrl("libsql://x.turso.io", { VERCEL: "1" }, dir)).toBe("libsql://x.turso.io");
  });

  it("copies the seeded file to the temp folder once, then keeps using that copy", () => {
    const url = prepareRuntimeUrl("file:./data/coy.db", { VERCEL: "1" }, dir);
    expect(url.startsWith("file:")).toBe(true);
    expect(url).toContain("coy.db");
    expect(readFileSync(TARGET, "utf8")).toBe("seeded");

    // Writes made while the server is warm must survive later calls (no re-copy).
    writeFileSync(TARGET, "changed by swipes");
    prepareRuntimeUrl("file:./data/coy.db", { VERCEL: "1" }, dir);
    expect(readFileSync(TARGET, "utf8")).toBe("changed by swipes");
  });
});
