# Coy Discover

A swipe-based **Discover** tab built as a standalone app alongside a placeholder **Home** tab, for the Coy SDE Intern take-home.

- **Part A** (two feature suggestions for Coy) is in **[FEATURES.md](FEATURES.md)**.
- **Part B** (the Discover tab) is this app.

![Discover, match, matches and empty state](docs/screenshots/overview.png)

<sub>Left to right: Discover · full profile · filters · "It's a match!" · chat · Matches · Chats · Notifications</sub>

---

## Quick start

```bash
pnpm install
pnpm dev            # creates + seeds ./data/coy.db automatically, then starts Next.js
# open http://localhost:3000 on a phone-sized window, or with DevTools device mode
```

Requires Node 20.12+ (tested on Node 24) and pnpm. No `.env` is needed locally; see `.env.example` for options.

| Command | What it does |
|---|---|
| `pnpm dev` | Migrate + idempotent seed, then the dev server |
| `pnpm db:setup` | Apply migrations and seed (safe to re-run; it never deletes your swipes) |
| `pnpm db:reset` | Clear *your* swipes and matches to replay the demo (the empty state also has a **Reset demo** button) |
| `pnpm test` | 84 unit, API-integration and privacy tests (Vitest) |
| `pnpm test:e2e` | 48 Playwright tests on mobile (Pixel 7) and desktop (builds and starts the app on port 3200 with its own DB) |
| `pnpm typecheck` / `pnpm build` | Type check / production build |

**Demo tip:** 12 of the 32 seeded profiles have already liked you. You can't tell which (that's the point), but the third card is one of them.

---

## What's included

**Discover deck**
- A compact card (max 350px) with the next profiles **stacked behind it**, peeking from the top-right corner like a real deck.
- Each card shows:
  - **distance** ("9 km"), as a coarse band
  - a **verified** badge
  - a **"2 things in common"** sticker, with shared interests highlighted first in pink
  - college or area, and a 2-line bio
- **Several photos per profile:** tap the right or left of the photo to flip through them (progress bars at the top), Tinder-style. Tap the name and info area to open the full profile.
- **Full profile sheet** (tap the card, ⓘ, ••• or the ↑ key): a large photo, a Hinge-style prompt, "You both like…", all interests, and Like/Pass right there.
- **Filters**, modelled on what Tinder, Bumble and Hinge offer:
  - **Looking for:** Tinder's six relationship goals, from 💍 long-term partner to 🎉 short-term fun, 👋 new friends and 🤔 still figuring it out. There's a "Same as me" shortcut, and cards highlight people who want the same thing as you.
  - **Distance** (2 km → Anywhere, banded) and an **age range** with a two-thumb slider.
  - **Quick picks:** verified profiles only, and only people who share something with you.
  - **Interests** (any of), **lifestyle** (drinking, smoking, workout) and **languages spoken**.
  - A live **"Show N people"** count, because, as Bumble warns, every filter shrinks the pool. Filters are remembered per device.
- **Drag** on touch or mouse: the card follows your finger, tilts, and shows **LIKE** / **PASS** stickers. It commits past 110px or on a quick flick, and otherwise snaps back. There are also **buttons** (✕ / ♥) and **← / → keys**.
- **Optimistic animation, without lying.** The card flies out while the request runs. If the server fails, it springs back with a **Retry** and nothing is lost. A single-flight guard means double taps, double drags or key repeats send exactly one request.
- Empty states for "You're all caught up" and "No one fits your filters" (with Widen filters), plus loading skeletons and error states with retry.

**Matching and chat**
- An "It's a match!" overlay appears **only** when `POST /swipe` returns `matched: true`. It shows what you both like and goes straight to **Send a message**.
- **Matches inbox:**
  - A "New matches · say hi" row.
  - Conversations sorted by latest activity, each with a last-message preview and a **Your turn** marker.
- **Chat:**
  - Only the two matched people can read or post (anyone else gets a 404).
  - **Conversation starters** are built from shared interests and their prompt.
  - A typing indicator shows while a reply is on its way, and failed sends get "tap to retry".
  - A safety reminder ("Never share OTPs…") sits above the messages.
- **Safety:** **Unmatch** deletes the chat for both people, and **Report** (with a reason) also unmatches. Both are confirmed in in-app sheets, never browser pop-ups.
- *Demo note:* seeded profiles reply on their own a couple of seconds after you message, so the chat feels alive. Replies are stored with a future `deliver_at`, which works on serverless without background jobs.

**Layout: adapted from a design mockup, on Coy's light background**

The Discover layout follows a supplied mockup: logo with icon buttons, pill section tabs, an editorial serif hero line, a full-bleed photo card with a tilted card behind, and a large glowing Like button. Some of the mockup's elements conflict with the brief or with Coy's core promise, so they were swapped for safe equivalents:

| Mockup | Built as | Why |
|---|---|---|
| Tabs: Discover · Matches · **Likes 24** · Chats | Matches · **Liked** · Chats (Discover itself is the bottom tab) | "Likes 24" means *who liked you*, the one thing Coy never reveals. **Liked** lists the people **you** liked who haven't matched yet (`GET /api/likes/sent`). That is your own data and only you can see it. |
| ↺ Undo · ★ Super-like | ⓘ Profile · ⚙︎ Filters | Undo would break the brief ("a profile that has been swiped on must never appear again"). A Super-like reveals one-sided interest. |
| "12K+ active now" | Avatars of the next people in your deck + "32 new faces" | Real data instead of an invented number, and no activity tracking. |
| Interest photo strip | The profile's prompt | There are no per-interest photos, and we don't fabricate them. |
| 5-tab bottom bar | Home + Discover | The brief asks for Home + Discover. Matches, Liked and Chats live inside Discover. |
| Dark background | Coy's white background | As requested. The card keeps a dark scrim so text over photos stays above 4.5:1 contrast. |

**Notifications vs Chats:** the bell opens its own panel that only says what needs you ("You matched with Sana", "Maya texted you") and clears once you reply. Chats is where conversations live, with **Messages on top and New matches below**.

**Read receipts:** a sent message shows 🕓 while sending, ✓ when delivered, and a blue ✓✓ with **"Seen 8:32 pm"** once they've read it.

**Robust colours:** every pink surface sets a solid background colour first and the gradient on top, using plain gradients rather than newer CSS (`in oklab`, `color-mix`). If a browser ever ignores a gradient, white text still sits on pink instead of vanishing. A test checks this for chat bubbles and pop-ups.

**Colour rule:** pink fills are always one deep pink (`#d81e63`) with **white** text (4.9:1). There is no dark text on pink anywhere, and shared interests are marked with a pink heart rather than a pink fill.

**Feature research: what I added, and what I deliberately didn't**

I looked at what Tinder, Bumble and Hinge ship today (prompts, verification, shared-interest openers, distance, filters, safety tools) and kept only what fits Coy's promise: *nobody learns you like them unless it's mutual.*

| Feature (seen in) | Decision | Why |
|---|---|---|
| Shared interests and interest-based openers (Bumble Opening Moves / interest badges) | ✅ Added | It's the strongest reason to start a chat, and it's computed from public data only. |
| Prompts on profiles (Hinge, Tinder's profile revamp) | ✅ Added | Gives people something real to reply to. It feeds the conversation starters. |
| Photo-verified badge (Hinge Face Check, Tinder) | ✅ Added (seeded flag) | Trust signal. Real verification would be a selfie check. |
| Distance | ✅ Added, **banded** | Exact distances allow triangulation, so the server only returns rounded bands and filters on the band. |
| Distance and age filters | ✅ Added | A standard expectation. The empty state nudges people to widen filters, as Hinge does. |
| Chat, unmatch, report | ✅ Added | Matches need somewhere to go, and safety tools are a baseline requirement. |
| Super Like | ❌ Rejected | It tells someone you like them **before** it's mutual, which is exactly what Coy promises never to do. |
| "Likes You" grid (Tinder Gold, Bumble Beeline) | ❌ Rejected | It reveals one-sided interest. This is the core privacy line. |
| Undo / rewind | ❌ Rejected | Rewinding a PASS on someone who liked you could be used to probe who liked you. |
| "Active now" or last-seen status | ❌ Rejected | It leaks activity patterns. Not worth it for a crush app. |
| Read receipts | ✅ Added | ✓ delivered, blue ✓✓ seen, and "Seen" under your last message. They apply between mutual matches only, so they never reveal one-sided interest. |

**Design: reverse-engineered from Coy's live app**

The UI was rebuilt from Coy's own design tokens, not from guesses. **[docs/design-notes.md](docs/design-notes.md)** is a "design DNA" extracted from app.getcoy.com: its CSS variables, type scale and computed styles, plus four evidence-backed taste principles. The app applies those principles directly:

| Coy principle (from the extraction) | How Discover applies it |
|---|---|
| **Sticker physics:** a `2px #15121D` edge and a hard `3px 3px 0` pop, no blur | Cards, CTAs and even the LIKE/PASS stamps are stickers. Presses sink into the shadow in 80ms, Coy's own timing. Utility buttons (Matches, style switch) stay flat soft circles like Coy's settings gear, because pop is reserved for primary actions. |
| **One voice:** Bricolage Grotesque for every role, hierarchy by weight (800/700/600/400) | A single font family. Headlines use 800 weight with −0.035em tracking, and body text uses 400. |
| **Surface colour names the moment** | Yellow `#FFE45C` is used only for the match ("news about you", like Coy's "Someone has a crush on you" card). Lilac `#E7E0FF` marks status and empty states. Mint `#CBF4E0` marks matches as the reward. Profile cards stay white, because the photo is the colour. |
| **Phone-shaped even on a monitor** | A 480px centred column with a 20px gutter at every viewport. |

Coy's CTA puts an **ink label on pink** (`#15121D` on `#FF3D81`, about 6:1 contrast). Discover keeps that rather than the common white-on-pink (about 3.4:1, which fails WCAG AA).

**Two styles (switch in the header)**
- **Coy** (default) uses the tokens above.
- **Minimal** is a calm warm-neutral alternative.
- Both are pure CSS tokens (`app/globals.css`). The choice is a UI preference stored in `localStorage`. Swipe and match data **never** are.

---

## API

The endpoints live under `/api/*`. They are also served at the exact paths from the brief (`/feed`, `/swipe`, `/matches`) via rewrites. Responses are JSON and `Cache-Control: no-store`.

### `GET /feed`
Returns profiles the user hasn't swiped on, computed in SQL on the server.
```json
{ "profiles": [ { "id": "p32", "name": "Saanvi", "age": 21, "photoUrl": "/profiles/p32.jpg",
  "bio": "…", "city": "Mysuru", "college": null, "interests": ["Birding", "Environment", "Sketching"] } ] }
```

### `POST /swipe`
Request body: `{ "profileId": "p31", "action": "LIKE" | "PASS" }`

| Status | Body |
|---|---|
| `201` no match | `{ "success": true, "matched": false, "match": null }` |
| `201` match | `{ "success": true, "matched": true, "match": { "id", "createdAt", "profile": { id, name, age, photoUrl, city, college } } }` |
| `400` | Invalid JSON, invalid action or profileId, or unknown fields (e.g. a client-sent `matched`) |
| `404` | Unknown profile (or yourself) |
| `409` | Already swiped on this profile; nothing is written |
| `500` | Generic message, no internals |

Errors are always shaped `{ "error": { "code", "message" } }`.

### `GET /me`
The logged-in user's own name, area and interests (used by the filters sheet).

### `GET /feed?minAge=&maxAge=&maxKm=&intents=&drinking=&smoking=&workout=&interests=&languages=&verified=1&shared=1` (all optional)
Each profile also carries `verified`, `prompt`, a coarse `distanceKm` band (0 = under 1 km), `sharedInterests`, `intent` (+ `sameIntent`), `lifestyle` and `languages`. Every filter uses **public** profile fields only. List params are comma-separated and validated against known ids. Coordinates are never returned.

### `GET /api/likes/sent`
People *you* liked who haven't matched yet (the **Liked** tab). There is intentionally no endpoint for who liked you.

### Chat
| Endpoint | Purpose |
|---|---|
| `GET /api/matches/:id/messages` | `{ match, messages[], typing, starters[] }`. Members only, 404 otherwise |
| `POST /api/matches/:id/messages` | `{ body }` (1–500 chars) returns `201 { message }` |
| `DELETE /api/matches/:id` | Unmatch: deletes the match and its chat. The swipe stays, so they never reappear |
| `POST /api/matches/:id/report` | `{ reason }` records a report and unmatches |

### `GET /matches`
```json
{ "matches": [ { "id": "match_…", "createdAt": "2026-11-17T18:20:01.123Z",
  "profile": { "id": "p31", "name": "Maya", "age": 22, "photoUrl": "…", "city": "Shillong", "college": null } } ] }
```

`POST /api/dev/reset` is a demo helper that clears the current user's swipes and matches. It is always on in dev, and in production only with `DEMO_RESET=true`.

---

## Architecture

```
app/
  api/{feed,swipe,matches}/route.ts   thin HTTP layer: validate → service → DTO → JSON
  discover/page.tsx, discover/matches/page.tsx, home/page.tsx
components/discover/                  swipe-card (gestures), discover-screen (state), match-overlay, profile-card
lib/
  services/{feed,swipe,matches}.ts    business logic; takes a db handle, so it is unit-testable
  dto.ts                              privacy allow-lists: the only way profiles leave the server
  validation.ts                       zod schema for POST /swipe (.strict())
  db/{schema,client,seed}.ts          Drizzle schema, libSQL client, idempotent seed/reset
  auth.ts                             CURRENT_USER_ID = "me" (single logged-in user, per the brief)
db/profiles.ts, db/setup.ts           seed data (32 profiles) and the migrate+seed script
drizzle/                              generated SQL migrations
tests/{unit,integration,e2e}/
```

**Stack:** Next.js 16 (App Router, Route Handlers), React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Zod, Drizzle ORM, SQLite via libSQL, Vitest and Playwright.

**Why libSQL and Drizzle rather than Prisma:** it's the same SQLite code everywhere. Locally it's a file (`file:./data/coy.db`). For a hosted demo, the same code points at Turso (hosted SQLite) with just `DATABASE_URL` and `DATABASE_AUTH_TOKEN`, which matters because a SQLite *file* doesn't persist on serverless hosts. There are no codegen or engine binaries.

---

## Data model

```sql
users   (id PK, name, age, photo_url, bio, city, college, interests JSON,
         prompt_question, prompt_answer, verified, lat, lng /* private */, created_at)
swipes  (id PK, swiper_id → users, target_id → users, action, created_at,
         UNIQUE(swiper_id, target_id),
         CHECK(action IN ('LIKE','PASS')), CHECK(swiper_id <> target_id))
matches (id PK, user_a_id → users, user_b_id → users, created_at,
         UNIQUE(user_a_id, user_b_id), CHECK(user_a_id < user_b_id))
messages(id PK, match_id → matches, sender_id → users, body CHECK(1..1000 chars),
         created_at, deliver_at)          -- visible only once deliver_at <= now
reports (id PK, reporter_id → users, reported_id → users, reason, created_at)
```

- The logged-in user (`me`) is a normal row in `users`. It is excluded from the feed.
- **"Profile X has already liked you" is not a flag on the profile.** It is a real row in `swipes`: `(swiper = X, target = me, LIKE)`, seeded for 12 profiles. Keeping who-liked-whom out of the `users` table means a careless `select *` on profiles can't leak it, and matching becomes the same symmetric check a real multi-user system would use.
- Matches store the pair in canonical order (`a < b`). Together with the `UNIQUE` index, that makes a duplicate match impossible at the database level, regardless of who liked first.

## How mutual matching works

`POST /swipe` runs **two statements in one atomic batch** (a single SQLite transaction):

1. `INSERT INTO swipes … ON CONFLICT DO NOTHING RETURNING id`. If nothing was inserted, the user already swiped this profile, so the endpoint returns **409**. That includes concurrent duplicate requests, which the `UNIQUE` index serialises.
2. ```sql
   INSERT INTO matches (id, user_a_id, user_b_id)
   SELECT …
   WHERE EXISTS (my LIKE of them) AND EXISTS (their LIKE of me)
   ON CONFLICT DO NOTHING RETURNING id
   ```
   The condition reads the **stored** swipes, not the request. So a PASS, a one-way LIKE, or a LIKE retried after an earlier PASS can never create a match.

`matched` is `true` only if step 2 inserted a row. `GET /matches` reads only the `matches` table, so one-way interest in either direction never appears there.

## Privacy decisions

"Never reveal who has liked the user unless it is mutual" is enforced on the **server**, and tested at the payload level:

| Risk | Mitigation |
|---|---|
| Incoming-like data leaking in a profile payload | Explicit DTO allow-lists (`lib/dto.ts`). DB rows are never spread into responses. Who-liked-whom isn't even on the profile table. |
| **Feed order as a side channel** (e.g. likers shown first) | The feed is a stable hash shuffle of profile ids, independent of incoming likes. A test asserts the order is identical with and without the incoming likes. |
| **PASS response as a side channel** | The same statements run for LIKE and PASS, and a test asserts PASS returns *byte-identical* JSON for someone who liked you and someone who didn't. |
| Error messages as a side channel | 409/404 messages are generic; a test asserts identical bytes. 500s hide internals. Logs record only error messages, never request bodies. |
| Client claiming a match | Zod `.strict()` rejects unknown fields like `matched`, and matching is decided entirely in SQL. |
| A "N people liked you" counter | Deliberately not built: in a small pool, a counter plus swiping can leak identities. |
| **Location triangulation** | `lat`/`lng` never leave the server. Distance is a rounded band (whole km under 10, nearest 5 under 50, and so on), and the distance filter also compares bands, so binary-searching `maxKm` can't recover an exact distance. A test scans the payload for coordinates. |
| Reading someone else's chat | Every chat query is scoped to "a match I'm a member of". Unknown, other people's and unmatched ids all return the same 404. |

---

## Tests

- **Unit** (`tests/unit`):
  - Validation edge cases (bad actions, injection-like ids, client-claimed matches).
  - Matching rules: mutual, one-way, pass-on-liker, pass-then-like.
  - Duplicate rejection writes nothing, and 5 concurrent duplicate swipes produce exactly 1 swipe and 1 match.
  - DB-level constraints.
  - Feed exclusion and stability.
- **API integration** (`tests/integration/api.test.ts`):
  - The real route handlers against a temp SQLite file: status codes, response shapes and `no-store`.
  - Persistence across a fresh DB connection.
- **Privacy, release-blocking** (`tests/integration/privacy.test.ts`):
  - Deep-scans every key in the feed and matches payloads against allow-lists.
  - Feed-order independence, byte-identical PASS/409 responses, and no match on one-sided interest.
- **E2E** (`tests/e2e`, Playwright, mobile and desktop):
  - Tab navigation, card rendering, the like/pass buttons, and drag right, drag left and short-drag snap-back with real pointer events.
  - The match overlay leading to the Matches list, and one-sided interest never shown.
  - A double-click sends a single request, and a failed swipe restores the card and the retry works.
  - The empty state, reload persistence, and the theme switch.

---

## Deploying (Vercel + Turso)

A SQLite *file* doesn't persist on serverless hosts, so the hosted demo uses Turso (hosted SQLite, same libSQL code):

1. Import the GitHub repo in Vercel. The framework is detected as Next.js.
2. In the Vercel project, open **Storage → Marketplace → Turso** and create a database. This injects `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, which the app reads automatically. `DATABASE_URL` and `DATABASE_AUTH_TOKEN` also work.
3. Optionally, set `DEMO_RESET=true` so reviewers get the **Reset demo** button.
4. Redeploy. The `vercel-build` script runs migrations and the idempotent seed against Turso before `next build`.

## Known limitations

- **Single user by design** (per the brief): `CURRENT_USER_ID` stands in for a session. A hosted demo is therefore one shared account; use **Reset demo** to replay it.
- Seeded profiles never swipe "live": incoming interest is fixed seed data.
- The feed returns the whole remaining pool. A real product would paginate and rank the feed (with the same "no incoming-like signal" rule).
- There is no undo or rewind. That is deliberate, because rewinding a PASS on someone who liked you needs careful privacy semantics.
- Photos are placeholders from pravatar.cc (Unsplash-licensed), bundled locally so the demo never shows broken images. An initials fallback covers load failures.
- This is not production-hardened: there is no auth, rate limiting or moderation.
