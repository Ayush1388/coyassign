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
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
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

  await overlay(page).getByRole("link", { name: "See matches" }).click();
  await expect(page).toHaveURL(/\/discover\/matches$/);
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
