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
  await waitForNextCard(page, first);
  // Passing is quiet: no toast.
  await expect(page.getByTestId("toast")).toHaveCount(0);

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
  // Pop-up text is white (on a dark card), never black.
  await expect(overlay(page).getByRole("heading", { name: "It's a match!" })).toHaveCSS("color", "rgb(255, 255, 255)");
  // Opening it must not draw a focus ring around a button.
  await expect(overlay(page).getByTestId("send-message")).toHaveCSS("outline-style", "none");
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

test("filters narrow the feed, show a live count, and are remembered", async ({ page }) => {
  await openDiscover(page);
  await page.getByTestId("filters-button").click();
  const sheet = page.getByTestId("filters-sheet");
  await expect(sheet).toBeVisible();

  // Looking for: long-term partner
  await page.getByTestId("intent-long_term").click();
  await expect(page.getByTestId("intent-long_term")).toHaveAttribute("aria-pressed", "true");
  // Distance: 2 km -> 5 -> 10 km
  const slider = page.getByTestId("distance-slider");
  await slider.focus();
  await slider.press("Home");
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(page.getByTestId("distance-value")).toHaveText("10 km");
  // Non-smokers only (switch-style chip)
  await page.getByTestId("smoking-no").click();

  const expected = (await (await page.request.get("/api/feed?intents=long_term&maxKm=10&smoking=no")).json()).profiles.length;
  await expect(page.getByTestId("apply-filters")).toHaveText(
    expected === 0 ? "No one fits yet" : `Show ${expected} ${expected === 1 ? "person" : "people"}`,
  );
  await page.getByTestId("apply-filters").click();
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId("filter-count")).toHaveText("3");

  if (expected > 0) {
    await expect(page.getByTestId("remaining")).toHaveText(`${expected} new ${expected === 1 ? "face" : "faces"}`);
    await expect(topCard(page).getByTestId("card-intent")).toContainText("Long-term");
  } else {
    await expect(page.getByTestId("empty-state")).toContainText("No one fits your filters");
  }

  await page.reload();
  await expect(page.getByRole("button", { name: "Filters (3 on)" })).toBeVisible();
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

test("tapping the card flips through photos and tapping the info opens the profile", async ({ page }) => {
  await openDiscover(page);
  const card = topCard(page);
  const bars = () => card.getByTestId("photo-bars").locator("span");
  await expect(bars()).toHaveCount(3);
  const box = (await card.boundingBox())!;
  const active = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-testid=swipe-card] [data-testid=photo-bars] span")].findIndex(
        (s) => !s.className.includes("bg-white/40"),
      ),
    );
  expect(await active()).toBe(0);
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await expect.poll(active).toBe(1);
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await expect.poll(active).toBe(0);

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.88);
  const sheet = page.getByTestId("profile-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByTestId("sheet-photo")).toHaveCount(3);
});

test("chat shows a single tick when delivered and a blue double tick when seen", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, 10))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const [m] = (await (await page.request.get("/api/matches")).json()).matches as { id: string }[];
  await page.goto(`/discover/matches/${m.id}`);
  await page.getByTestId("composer").fill("hello there");
  await page.getByTestId("send").click();
  const mine = page.getByTestId("msg-mine").first();
  await expect(mine).toHaveAttribute("data-status", "delivered");
  await expect(mine.getByTestId("tick-delivered")).toBeVisible();
  await expect(page.getByTestId("delivered-label")).toHaveText("Delivered");
  await expect(mine).toHaveAttribute("data-status", "seen", { timeout: 10_000 });
  await expect(mine.getByTestId("tick-seen")).toBeVisible();
  // "Seen" is spelled out with the time they saw it.
  await expect(page.getByTestId("seen-label")).toHaveText(/^Seen \d{1,2}:\d{2}\s?(am|pm)$/i);
  await expect(page.getByTestId("msg-theirs").first()).toBeVisible({ timeout: 10_000 });
});

test("Liked cards show what you share and open the full profile", async ({ page }) => {
  const feed = (await apiFeed(page)) as unknown as { id: string; sharedInterests: string[] }[];
  const target = feed.find((p) => p.sharedInterests.length > 0)!;
  await page.request.post("/api/swipe", { data: { profileId: target.id, action: "LIKE" } });
  const matched = ((await (await page.request.get("/api/matches")).json()).matches as unknown[]).length > 0;
  test.skip(matched, "picked a seeded liker; covered elsewhere");
  await page.goto("/discover/liked");
  const card = page.locator(`[data-testid=liked-item][data-profile-id="${target.id}"]`);
  await expect(card.getByTestId("card-shared-line")).toContainText("You both like");
  await card.getByRole("button", { name: /Open .*'s profile/ }).first().click();
  await expect(page.getByTestId("profile-sheet")).toBeVisible();
  await expect(page.getByTestId("profile-sheet")).toContainText("only find out if they like you back");
});

test("Matches cards show what you share and go straight to the chat", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, 10))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  await page.goto("/discover/matches");
  const first = page.getByTestId("match-item").first();
  await expect(first).toBeVisible();
  await expect(first.getByRole("list", { name: "Interests" })).toBeVisible();
  await first.getByRole("button", { name: /Open .*'s profile/ }).first().click();
  await expect(page.getByTestId("profile-sheet")).toContainText("It's mutual");
  await page.keyboard.press("Escape");
  await first.getByTestId("match-chat").click();
  await expect(page).toHaveURL(/\/discover\/matches\/match_/);
  await expect(page.getByTestId("composer")).toBeVisible();
});

test("notifications are their own panel: new matches and texts, separate from Chats", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, 10))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const matches = (await (await page.request.get("/api/matches")).json()).matches as { id: string; profile: { name: string } }[];
  expect(matches.length).toBeGreaterThan(1);

  // Text the first match; their reply arrives a few seconds later.
  await page.request.post(`/api/matches/${matches[0].id}/messages`, { data: { body: "hey!" } });
  await expect
    .poll(async () => ((await (await page.request.get(`/api/matches/${matches[0].id}/messages`)).json()).messages as unknown[]).length, {
      timeout: 10_000,
    })
    .toBe(2);

  await page.goto("/discover");
  const bell = page.getByTestId("bell");
  await expect(page.getByTestId("bell-count")).toHaveText(String(matches.length)); // 1 text + the rest are new matches
  await bell.click();
  const panel = page.getByTestId("notifications-sheet");
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-kind="message"]')).toHaveCount(1);
  await expect(panel.locator('[data-kind="message"]')).toContainText("texted you");
  await expect(panel.locator('[data-kind="match"]')).toHaveCount(matches.length - 1);
  await expect(panel.locator('[data-kind="match"]').first()).toContainText("You matched with");
  // It is not the Chats page.
  await expect(page).toHaveURL(/\/discover$/);

  await panel.locator('[data-kind="message"]').click();
  await expect(page).toHaveURL(/\/discover\/matches\/match_/);
});

test("Chats lists Messages first, then New matches below", async ({ page }) => {
  for (const p of (await apiFeed(page)).slice(0, 10))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const [first] = (await (await page.request.get("/api/matches")).json()).matches as { id: string }[];
  await page.request.post(`/api/matches/${first.id}/messages`, { data: { body: "hey!" } });
  await page.goto("/discover/chats");
  await expect(page.getByTestId("chat-item")).toHaveCount(1);
  await expect(page.getByTestId("new-match").first()).toBeVisible();
  const messagesY = (await page.getByTestId("conversations").boundingBox())!.y;
  const newMatchesY = (await page.getByTestId("new-matches").boundingBox())!.y;
  expect(messagesY).toBeLessThan(newMatchesY);
});

test("white text always has a solid pink background behind it (bubbles and the like pop-up)", async ({ page }) => {
  // The "You liked ..." pop-up
  await openDiscover(page);
  await page.getByTestId("like-button").click();
  const toast = page.getByTestId("toast").or(overlay(page));
  await expect(toast).toBeVisible();
  if (await page.getByTestId("toast").isVisible()) {
    await expect(page.getByTestId("toast")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(page.getByTestId("toast")).toHaveCSS("background-color", "rgb(216, 30, 99)");
  }

  // My chat bubble: solid pink colour under the gradient, so it can never turn into white-on-grey.
  for (const p of (await apiFeed(page)).slice(0, 10))
    await page.request.post("/api/swipe", { data: { profileId: p.id, action: "LIKE" } });
  const [m] = (await (await page.request.get("/api/matches")).json()).matches as { id: string }[];
  await page.goto(`/discover/matches/${m.id}`);
  await page.getByTestId("composer").fill("can you see this?");
  await page.getByTestId("send").click();
  const bubble = page.locator("[data-testid=msg-mine] > span > span").first();
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(bubble).toHaveCSS("background-color", "rgb(216, 30, 99)");
});
