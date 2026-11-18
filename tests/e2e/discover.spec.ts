import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/dev/reset")).ok()).toBe(true);
});

const TOTAL = 32;
const topCard = (page: Page) => page.getByTestId("swipe-card");
const topId = (page: Page) => topCard(page).getAttribute("data-profile-id");
const overlay = (page: Page) => page.getByTestId("match-overlay");

async function openDiscover(page: Page) {
  await page.goto("/discover");
  await expect(topCard(page)).toBeVisible();
}

/** Drags the top card horizontally with real pointer events. */
async function drag(page: Page, dx: number) {
  const box = (await topCard(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(x + (dx * i) / 12, y + i, { steps: 2 });
  await page.mouse.up();
}

/** Waits until the top card changes, dismissing a match overlay if one appeared. */
async function waitForNextCard(page: Page, previousId: string | null) {
  await expect
    .poll(async () => {
      if (await overlay(page).isVisible()) await page.getByRole("button", { name: "Keep swiping" }).click();
      return (await topCard(page).count()) === 0 || (await topId(page)) !== previousId;
    })
    .toBe(true);
}

async function apiFeed(page: Page) {
  return (await (await page.request.get("/api/feed")).json()).profiles as { id: string }[];
}

test("tab bar navigates between Home and Discover", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/discover$/);
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(topCard(page)).toHaveCount(0);
  await page.getByRole("link", { name: "Discover" }).click();
  await expect(page.getByRole("heading", { name: /Meet interesting people/i })).toBeVisible();
  // Section tabs inside Discover
  await page.getByTestId("matches-link").click();
  await expect(page).toHaveURL(/\/discover\/matches$/);
  await page.getByTestId("tab-chats").click();
  await expect(page).toHaveURL(/\/discover\/chats$/);
});

test("shows one profile card with its details", async ({ page }) => {
  await openDiscover(page);
  await expect(topCard(page)).toHaveCount(1);
  const card = topCard(page).getByRole("article");
  await expect(card.getByRole("heading", { level: 2 })).toContainText(/\w+, \d+/);
  await expect(card.getByRole("list", { name: "Interests" })).toBeVisible();
  await expect(card.getByRole("img")).toBeVisible();
});

test("like and pass buttons advance the deck with feedback", async ({ page }) => {
  await openDiscover(page);
  const first = await topId(page);
  await page.getByTestId("pass-button").click();
  await expect(page.getByTestId("toast")).toContainText("Passed on");
  await waitForNextCard(page, first);

  const second = await topId(page);
  await page.getByTestId("like-button").click();
  await expect(page.getByTestId("toast").or(overlay(page))).toBeVisible();
  await waitForNextCard(page, second);

  const ids = (await apiFeed(page)).map((p) => p.id);
  expect(ids).not.toContain(first);
  expect(ids).not.toContain(second);
});

test("dragging right likes and dragging left passes", async ({ page }) => {
  await openDiscover(page);
  const first = await topId(page);
  let lastSwipe: unknown = null;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/swipe")) lastSwipe = r.postDataJSON();
  });

  await drag(page, 260);
  await waitForNextCard(page, first);
  expect(lastSwipe).toEqual({ profileId: first, action: "LIKE" });

  const second = await topId(page);
  await drag(page, -260);
  await waitForNextCard(page, second);
  expect(lastSwipe).toEqual({ profileId: second, action: "PASS" });
});

test("a short drag snaps back without swiping", async ({ page }) => {
  await openDiscover(page);
  const first = await topId(page);
  await drag(page, 40);
  await page.waitForTimeout(500);
  expect(await topId(page)).toBe(first);
  expect(await apiFeed(page)).toHaveLength(TOTAL);
});

test("mutual like shows It's a match and appears in Matches", async ({ page }) => {
  await openDiscover(page);
  let matchedName: string | null = null;
  for (let i = 0; i < 12 && !matchedName; i++) {
    const name = (await topCard(page).getByRole("heading", { level: 2 }).textContent())!.split(",")[0];
    const id = await topId(page);
    await page.getByTestId("like-button").click();
    await expect.poll(async () => (await overlay(page).isVisible()) || (await topId(page)) !== id).toBe(true);
    if (await overlay(page).isVisible()) matchedName = name;
  }
  expect(matchedName).not.toBeNull();
  await expect(overlay(page).getByRole("heading", { name: "It's a match!" })).toBeVisible();
  await expect(overlay(page)).toContainText(matchedName!);
  await expect(page.getByTestId("match-count")).toHaveText("1");

  // Straight into the chat from the celebration.
  await page.getByTestId("send-message").click();
  await expect(page).toHaveURL(/\/discover\/matches\/match_/);
  await expect(page.getByTestId("chat-name")).toHaveText(matchedName!);
  await expect(page.getByTestId("starters")).toBeVisible();

  await page.getByTestId("composer").fill("Hey! Loved your profile");
  await page.getByTestId("send").click();
  await expect(page.getByTestId("msg-mine")).toContainText("Hey! Loved your profile");
  await expect(page.getByTestId("msg-theirs").first()).toBeVisible({ timeout: 10_000 });

  await page.getByRole("link", { name: "Back to chats" }).click();
  await expect(page).toHaveURL(/\/discover\/chats$/);
  await expect(page.getByTestId("chat-item")).toHaveCount(1);
  await expect(page.getByTestId("chat-item")).toContainText(matchedName!);
  await expect(page.getByTestId("chat-item")).toContainText("Your turn");

  await page.getByTestId("matches-link").click();
  await expect(page.getByTestId("match-item")).toHaveCount(1);
  await expect(page.getByTestId("match-item")).toContainText(matchedName!);
});

test("one-sided interest never shows in Matches", async ({ page }) => {
  // Seeded profiles have liked us, and we pass them, so there must be no match.
  for (const p of (await apiFeed(page)).slice(0, 12))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "PASS" } });
  await page.goto("/discover/matches");
  await expect(page.getByTestId("matches-empty")).toBeVisible();
  await expect(page.getByTestId("match-item")).toHaveCount(0);
});

test("double-clicking like sends a single swipe", async ({ page }) => {
  await openDiscover(page);
  let swipeRequests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/swipe")) swipeRequests++;
  });
  await page.getByTestId("like-button").dblclick();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(1000);
  expect(swipeRequests).toBe(1);
});

test("a failed swipe restores the card and can be retried", async ({ page }) => {
  await openDiscover(page);
  const first = await topId(page);
  await page.route("**/api/swipe", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.getByTestId("pass-button").click();
  await expect(page.getByTestId("toast")).toContainText("Couldn't save");
  await page.waitForTimeout(600);
  expect(await topId(page)).toBe(first);
  expect(await apiFeed(page)).toHaveLength(TOTAL);

  await page.unroute("**/api/swipe");
  await page.getByRole("button", { name: "Retry" }).click();
  await waitForNextCard(page, first);
  expect((await apiFeed(page)).map((p) => p.id)).not.toContain(first);
});

test("shows the empty state when every profile is swiped", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, -1))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "PASS" } });
  await openDiscover(page);
  await expect(page.getByTestId("remaining")).toHaveText("1 new face");
  await page.getByTestId("pass-button").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await expect(page.getByText("You're all caught up")).toBeVisible();
  await expect(page.getByTestId("like-button")).toBeDisabled();

  await page.reload();
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("swipes and matches persist across reloads", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, 20))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const matchesBefore = (await (await page.request.get("/api/matches")).json()).matches.length;
  expect(matchesBefore).toBeGreaterThan(0);

  await openDiscover(page);
  const first = await topId(page);
  await page.getByTestId("pass-button").click();
  await waitForNextCard(page, first);

  await page.reload();
  await expect(topCard(page)).toBeVisible();
  expect(await topId(page)).not.toBe(first);
  await expect(page.getByTestId("remaining")).toHaveText(`${TOTAL - 21} new faces`);
  await expect(page.getByTestId("match-count")).toHaveText(String(matchesBefore));

  await page.goto("/discover/matches");
  await expect(page.getByTestId("match-item")).toHaveCount(matchesBefore);
});

test("the style switch toggles themes and is remembered", async ({ page }) => {
  await openDiscover(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "coy");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "minimal");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "minimal");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "coy");
});

test("cards show distance and what you have in common, with the deck stacked behind", async ({ page }) => {
  await openDiscover(page);
  await expect(topCard(page).getByTestId("card-distance")).toContainText(/km/);
  await expect(page.getByTestId("stack-card")).toHaveCount(2);
  // At least one of the first few cards shares an interest with the user.
  const feed = (await (await page.request.get("/api/feed")).json()).profiles as { sharedInterests: string[] }[];
  expect(feed.slice(0, 5).some((p) => p.sharedInterests.length > 0)).toBe(true);
});

test("the full profile sheet opens and can like from there", async ({ page }) => {
  await openDiscover(page);
  const first = await topId(page);
  await page.getByTestId("open-profile").click();
  const sheet = page.getByTestId("profile-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("region", { name: "Prompt" })).toBeVisible();
  await sheet.getByRole("button", { name: "Like" }).click();
  await expect(sheet).toBeHidden();
  await waitForNextCard(page, first);
  expect((await apiFeed(page)).map((p) => p.id)).not.toContain(first);
});

test("filters narrow the feed and are remembered", async ({ page }) => {
  await openDiscover(page);
  await page.getByTestId("filters-button").click();
  const slider = page.getByTestId("distance-slider");
  await slider.focus();
  await slider.press("Home"); // 5 km
  await slider.press("ArrowRight"); // 10 km
  await expect(page.getByTestId("distance-value")).toHaveText("10 km");
  await page.getByTestId("apply-filters").click();
  await expect(page.getByTestId("filters-sheet")).toBeHidden();

  const remaining = await page.getByTestId("remaining").textContent();
  const n = Number(remaining!.split(" ")[0]);
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(TOTAL);
  const near = (await (await page.request.get("/api/feed?maxKm=10")).json()).profiles;
  expect(n).toBe(near.length);

  await page.reload();
  await expect(page.getByTestId("remaining")).toHaveText(remaining!);
  await expect(page.getByRole("button", { name: "Filters (on)" })).toBeVisible();
});

test("unmatching from a chat removes the match", async ({ page }) => {
  // Create a match through the API: like every profile, which matches the seeded likers.
  for (const p of await apiFeed(page)) await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const before = (await (await page.request.get("/api/matches")).json()).matches as { id: string }[];
  expect(before.length).toBeGreaterThan(0);

  await page.goto(`/discover/matches/${before[0].id}`);
  await page.getByTestId("chat-menu").click();
  await page.getByRole("button", { name: /^Unmatch/ }).click();
  await page.getByTestId("confirm-unmatch").click();
  await expect(page).toHaveURL(/\/discover\/matches$/);
  await expect(page.getByTestId("match-item")).toHaveCount(before.length - 1);
});

test("the Liked tab lists only my own pending likes", async ({ page }) => {
  const feed = await apiFeed(page);
  // Like everyone: seeded likers become matches, the rest stay pending.
  for (const p of feed.slice(0, 8)) await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const matched = ((await (await page.request.get("/api/matches")).json()).matches as { profile: { id: string } }[]).map(
    (m) => m.profile.id,
  );
  await page.goto("/discover/liked");
  const items = page.getByTestId("liked-item");
  await expect(items).toHaveCount(8 - matched.length);
  for (const id of matched) await expect(page.locator(`[data-testid=liked-item][data-profile-id="${id}"]`)).toHaveCount(0);
  await expect(page.getByTestId("count-liked")).toHaveText(String(8 - matched.length));
});
