# Coy Discover

[![CI](https://github.com/Ayush1388/coyassign/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayush1388/coyassign/actions/workflows/ci.yml)

A swipe-based **Discover** tab for Coy, built as a standalone app next to a blank **Home** tab. People like or pass on profiles, a match only happens when the interest is mutual, and nothing about one-sided interest is ever revealed. Built for the Coy SDE Intern take-home.

- **Part A** (two feature proposals for Coy): [FEATURES.md](FEATURES.md)
- **Part B** (the Discover tab): this repository

![Discover, profile, filters, match, chat, matches, chats and notifications](docs/screenshots/overview.png)

<sub>Left to right: Discover · full profile · filters · "It's a match!" · chat · Matches · Chats · Notifications</sub>

## Contents

[Assignment checklist](#assignment-checklist) · [Features](#features) · [Getting started](#getting-started) · [Architecture](#architecture) · [API reference](#api-reference) · [Data model and matching](#data-model-and-matching) · [Security and privacy](#security-and-privacy) · [Testing](#testing) · [Design](#design) · [Deployment](#deployment) · [Limitations](#limitations-and-next-steps)

---

## Assignment checklist

Every requirement from the brief, where it is implemented, and how it is verified.

| Requirement | Status | Implementation and evidence |
|---|---|---|
| **Part A:** suggest two core features and why | ✅ | [FEATURES.md](FEATURES.md) |
| Standalone app in a public GitHub repo | ✅ | This repository |
| Simple tab bar with a **blank Home** and a **Discover** tab | ✅ | `app/home/page.tsx`, `components/nav/tab-bar.tsx`. An e2e test asserts Home has nothing to click. |
| React/Next.js, mobile-first | ✅ | Next.js 16 (App Router). Designed for a 390px phone first, centred 480px column on desktop. |
| Node backend (Express or Next API routes) | ✅ | Next.js Route Handlers in `app/api/*` |
| JSON, SQLite or any DB; single user, no external auth | ✅ | SQLite via libSQL and Drizzle. `CURRENT_USER_ID` in `lib/auth.ts` stands in for a session. |
| **1. Profile data:** at least 30 profiles with name, age, photo, bio, city or college, interests | ✅ | 32 profiles in `db/profiles.ts`, photos in `public/profiles/`. The seed is idempotent. |
| Some seeded profiles already liked the user | ✅ | 12 of them, stored as real `LIKE` rows (`lib/db/seed.ts`) |
| **2. Swipe:** one card at a time | ✅ | `components/discover/swipe-card.tsx`. The cards behind are decorative and not interactive. |
| Swipe right to like, left to pass; drag on mobile, buttons on desktop | ✅ | Pointer drag, ✕/♥ buttons and ←/→ keys. E2E: drag right, drag left, short-drag snap-back. |
| Smooth animations and clear feedback on each swipe | ✅ | Spring drag with tilt, LIKE/PASS stamps, exit animation, "You liked …" pop-up. A failed save springs back with Retry. |
| A swiped profile never appears again | ✅ | Excluded server-side in SQL (`lib/services/feed.ts`). Unit, API and e2e tests, including after reload. |
| Clear empty state | ✅ | "You're all caught up", and "No one fits your filters" with a shortcut to widen them |
| **3. Matching:** match only when both liked | ✅ | One atomic SQL batch (`lib/services/swipe.ts`). See [How mutual matching works](#how-mutual-matching-works). |
| "It's a match!" screen at that moment | ✅ | `match-overlay.tsx`, shown only when the server returns `matched: true` |
| A Matches view listing all mutual matches | ✅ | `app/discover/matches`, reads only the `matches` table |
| Never reveal who liked the user unless mutual | ✅ | See [Security and privacy](#security-and-privacy). Release-blocking payload tests. |
| **4. APIs:** `GET /feed`, `POST /swipe`, `GET /matches` | ✅ | `app/api/{feed,swipe,matches}`. Also served at the exact paths from the brief via rewrites. |
| Swipes and matches persist across reloads | ✅ | SQLite on disk. Tests reopen a fresh connection and re-read the data. |
| "Privacy edge cases" (overview) | ✅ | [Security and privacy](#security-and-privacy) |
| "Clean, tested backend logic" (overview) | ✅ | Business logic lives in `lib/services/*`, separate from HTTP. 85 unit and integration tests plus 50 browser tests, run in CI. |

---

## Features

**Discover**
- A swipe deck with the next profiles stacked behind the top card.
- Each card shows distance (rounded), a verified badge, what you have in common, what they are looking for, interests, a prompt, and several photos you can tap through.
- A full profile sheet with a bigger gallery and Like/Pass.
- Filters: looking for (long-term, short-term, new friends…), distance, age, verified, shared interests, interests, lifestyle and languages, with a live "Show N people" count.

**Matches and chat**
- Matches, **Liked** (only people *you* liked who have not matched yet), and Chats (Messages first, then New matches).
- A notification panel for "You matched with …" and "… texted you".
- Chat between matched people only, with conversation starters from shared interests, a typing indicator, and read receipts (✓ delivered, blue ✓✓ with "Seen 8:32 pm").
- Unmatch and Report from inside a chat.

**Two styles**, switchable in the header: **Coy** (default) and **Minimal**. Both are plain CSS tokens in `app/globals.css`.

> The brief only requires the feed, swipes and matches. Filters, chat and the rest are extras, kept behind the same privacy rules.

**Demo behaviour:** seeded profiles reply a couple of seconds after you message them so the chat feels alive. Replies are stored with a future `deliver_at`, so no background jobs are needed.

---

## Getting started

Requires **Node 20.12+** and **pnpm**.

```bash
pnpm install
pnpm dev        # creates and seeds ./data/coy.db, then starts http://localhost:3000
```

Open it in a phone-sized window or DevTools device mode. 12 of the 32 seeded profiles have already liked you, and you cannot tell which ones; the third card is one of them.

| Command | What it does |
|---|---|
| `pnpm dev` | Applies migrations, runs the idempotent seed, starts the dev server |
| `pnpm db:setup` | Migrations and seed only. Safe to re-run; it never deletes your swipes. |
| `pnpm db:reset` | Clears your swipes, matches and chats to replay the demo (also a **Reset demo** button on the empty state) |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | 85 unit and integration tests (Vitest) |
| `pnpm test:e2e` | 50 browser tests (Playwright, mobile and desktop). Builds and serves the app on port 3200 with its own database. |
| `pnpm build` / `pnpm start` | Production build and server |

**Environment** (all optional locally, see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./data/coy.db` by default, or a `libsql://…` URL for a hosted database such as Turso |
| `DATABASE_AUTH_TOKEN` | Turso token (`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are also read) |
| `DEMO_RESET` | `true` enables `POST /api/dev/reset` in production. It is always on in development. |

---

## Architecture

```
app/
  api/                     HTTP layer: validate (zod) → service → DTO → JSON
  home, discover/...       pages (Home is blank by design)
components/
  discover/  matches/  chat/  nav/  ui/  theme/
lib/
  services/                business logic (feed, swipe, matches, chat, likes); takes a db handle, so it is unit-testable
  dto.ts                   allow-lists: the only way profile data leaves the server
  validation.ts            zod schemas (strict)
  http.ts                  JSON helpers, one error shape, JSON-only body reader
  geo.ts                   distance bands and shared interests
  db/                      Drizzle schema, libSQL client, idempotent seed and reset
db/                        seed data and the migrate-and-seed script
drizzle/                   generated SQL migrations
tests/                     unit, integration, e2e
```

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, Zod, Drizzle ORM, SQLite (libSQL), Vitest, Playwright.

**Why libSQL and Drizzle:** the same code runs against a local SQLite file and against Turso (hosted SQLite). That matters because a SQLite *file* does not persist on serverless hosts, and it avoids code generation and native engine binaries.

---

## API reference

Endpoints live under `/api/*`. The three from the brief are also served at `/feed`, `/swipe` and `/matches` via rewrites. Responses are JSON with `Cache-Control: no-store`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/feed` | Profiles not yet swiped on. Optional filters: `minAge`, `maxAge`, `maxKm`, `intents`, `drinking`, `smoking`, `workout`, `interests`, `languages`, `verified`, `shared` |
| `POST` | `/swipe` | Record `LIKE` or `PASS`. Returns whether it created a match. |
| `GET` | `/matches` | Mutual matches only |
| `GET` | `/api/me` | The current user's basics and the available filter options |
| `GET` | `/api/likes/sent` | People *you* liked who have not matched yet. There is deliberately no "who liked you" endpoint. |
| `GET` `POST` | `/api/matches/:id/messages` | Read or send messages (members of the match only) |
| `DELETE` | `/api/matches/:id` | Unmatch (deletes the chat) |
| `POST` | `/api/matches/:id/report` | Report a match (also unmatches) |
| `POST` | `/api/dev/reset` | Demo helper. Always on in development, in production only with `DEMO_RESET=true`. |

`POST /swipe` takes `{ "profileId": "p31", "action": "LIKE" | "PASS" }`:

| Status | Meaning | Body |
|---|---|---|
| `201` | Recorded, no match | `{ "success": true, "matched": false, "match": null }` |
| `201` | Recorded, it is a match | `{ "success": true, "matched": true, "match": { id, createdAt, profile, sharedInterests, … } }` |
| `400` | Malformed JSON, invalid `action` or `profileId`, or unknown fields (for example a client-sent `matched`) | error |
| `404` | Unknown profile (or yourself) | error |
| `409` | Already swiped on this profile; nothing is written | error |
| `415` | Content type is not `application/json` | error |
| `500` | Unexpected failure, generic message | error |

Every error has the same shape: `{ "error": { "code", "message" } }`.

A feed profile contains only: `id, name, age, photoUrl, photos, bio, city, college, interests, verified, prompt, distanceKm, sharedInterests, intent, sameIntent, lifestyle, languages`.

---

## Data model and matching

```sql
users    (id PK, name, age, photo_url, photos JSON, bio, city, college, interests JSON,
          prompt_question, prompt_answer, intent, drinking, smoking, workout, languages JSON,
          verified, lat, lng /* private, never serialised */, created_at)
swipes   (id PK, swiper_id → users, target_id → users, action, created_at,
          UNIQUE(swiper_id, target_id), CHECK(action IN ('LIKE','PASS')), CHECK(swiper_id <> target_id))
matches  (id PK, user_a_id → users, user_b_id → users, created_at,
          UNIQUE(user_a_id, user_b_id), CHECK(user_a_id < user_b_id))
messages (id PK, match_id → matches, sender_id → users, body CHECK(1..1000 chars),
          created_at, deliver_at, seen_at)
reports  (id PK, reporter_id → users, reported_id → users, reason, created_at)
```

- The logged-in user (`me`) is a normal row in `users` and is excluded from the feed.
- **"Profile X already liked you" is not a flag on the profile.** It is a real row in `swipes` (`swiper = X, target = me, LIKE`). Keeping who-liked-whom out of `users` means a careless `select *` on profiles cannot leak it, and matching is the same symmetric check a real multi-user system would use.
- Matches are stored with the pair in canonical order (`a < b`), so the `UNIQUE` index makes a duplicate match impossible no matter who liked first.

### How mutual matching works

`POST /swipe` runs **two statements in one atomic batch** (a single SQLite transaction):

1. `INSERT INTO swipes … ON CONFLICT DO NOTHING RETURNING id`. If nothing is inserted, the user already swiped on this profile, so the endpoint returns `409`. Concurrent duplicate requests are serialised by the `UNIQUE` index.
2. ```sql
   INSERT INTO matches (id, user_a_id, user_b_id)
   SELECT …
   WHERE EXISTS (my LIKE of them) AND EXISTS (their LIKE of me)
   ON CONFLICT DO NOTHING RETURNING id
   ```
   The condition reads the **stored** swipes, never the request. A PASS, a one-way LIKE, or a LIKE retried after an earlier PASS can never create a match.

`matched` is `true` only if step 2 inserted a row. `GET /matches` reads only the `matches` table, so one-sided interest never appears there.

---

## Security and privacy

The brief calls out privacy edge cases, and Coy's whole promise is that **nobody learns you like them unless it is mutual**. Everything below is enforced on the server and covered by tests.

### 1. The core promise: one-sided interest is never revealed

| Risk | Mitigation |
|---|---|
| Incoming-like data in a profile payload | Explicit allow-list DTOs (`lib/dto.ts`). Database rows are never spread into responses. Who-liked-whom is not stored on the profile at all. |
| **Feed order as a side channel** (likers shown first) | The feed is a stable hash shuffle of profile ids, independent of incoming likes. A test asserts the order is identical with and without the incoming likes. |
| **PASS response as a side channel** | LIKE and PASS run the same statements, and a test asserts PASS returns *byte-identical* JSON for someone who liked you and someone who did not. |
| **Error responses as a side channel** | `409` and `404` bodies are generic, and a test asserts identical bytes for both cases. |
| A client claiming a match | Request bodies are validated with `.strict()`, so a field like `matched` is rejected, and matching is decided only in SQL. |
| "N people liked you" counters, a likes-you list, Super Like, undo | Deliberately not built. Each one reveals or lets you probe one-sided interest. |
| **Location triangulation** | `lat` and `lng` never leave the server. Distance is a rounded band, and the distance filter compares bands, so binary-searching the filter cannot recover an exact distance. A test scans payloads for coordinates. |
| Reading or writing someone else's chat | Every chat query is scoped to "a match I belong to". Unknown, other people's and unmatched ids all return the same `404`. |

### 2. Data integrity

- `UNIQUE` and `CHECK` constraints in the schema (one swipe per pair, no self-swipes, canonical match pairs, bounded message length), so the guarantees hold even if application code is wrong.
- The swipe and its match are written in one atomic batch.
- A concurrency test fires five identical swipes at once and asserts exactly one swipe and one match.

### 3. Input validation and injection

- Every input is validated with Zod: bodies, query strings and route ids. Schemas are `.strict()`, ids are pattern-checked, and strings and lists have length limits.
- All SQL goes through Drizzle or bound parameters, so there is no string-built SQL.
- React escapes rendered text. `dangerouslySetInnerHTML` is used once, for a constant theme script with no user data.
- Errors have one shape and never include stack traces or database details. Logs contain error messages only, never request bodies or matching data.

### 4. Browser and transport hardening

- Every response sends `X-Content-Type-Options: nosniff`, a `Referrer-Policy` and a `Permissions-Policy` that denies camera, microphone and location. In production it also sends a **Content-Security-Policy** (same-origin only, no framing, no plugins), `X-Frame-Options: DENY` and `Strict-Transport-Security`. The `X-Powered-By` header is removed. An e2e test checks these.
- **CSRF:** write endpoints accept only `Content-Type: application/json` (`415` otherwise). A cross-site form cannot send that content type, and a cross-origin `fetch` with it needs a CORS preflight that this API never grants.
- API responses are `Cache-Control: no-store`, so private data is not cached.

### 5. Secrets and configuration

- No secrets are committed. `.env` is git-ignored and `.env.example` documents the variables. The Turso token is read from the environment only.
- The demo reset endpoint is disabled in production unless `DEMO_RESET=true`.

### 6. Dependencies

- The lockfile is committed and CI installs with `--frozen-lockfile`. Dependabot is configured for npm and GitHub Actions.
- `pnpm audit --prod` reports **no known vulnerabilities**. Two advisories remain in development-only tooling (Vitest's glob matcher and the migration generator's bundled esbuild). They never ship with the app.

### 7. Out of scope for this assignment

Real authentication and sessions, rate limiting, abuse moderation, audit logging, encryption at rest and account deletion flows. The brief asks for a single logged-in user with no external auth, so `CURRENT_USER_ID` stands in for a session. See [Limitations](#limitations-and-next-steps).

---

## Testing

85 unit and integration tests and 50 browser tests. All of them run in CI (`.github/workflows/ci.yml`: typecheck, unit tests, build, then Playwright).

| Layer | Where | What it proves |
|---|---|---|
| **Unit** | `tests/unit` | Validation edge cases (bad actions, injection-like ids, client-claimed matches). Matching rules: mutual, one-way, pass-on-a-liker, pass-then-like. Duplicates write nothing, and five concurrent duplicates create one swipe and one match. Database constraints. Feed exclusion, stability and filters. Distance bands. Chat access control, unmatch, report and read receipts. |
| **API integration** | `tests/integration/api.test.ts` | The real route handlers against a temporary SQLite file: status codes, response shapes, `no-store`, `415` for non-JSON bodies, and persistence across a fresh connection. |
| **Privacy (release-blocking)** | `tests/integration/privacy.test.ts` | Every key in feed and matches payloads against allow-lists. No coordinates anywhere. Feed order independent of incoming likes. A liker never appears in matches before reciprocity. Byte-identical PASS and `409` responses. A one-way like returns no match data. |
| **End to end** | `tests/e2e` | A production build, driven by a real browser on mobile (Pixel 7) and desktop. Navigation and the blank Home, drag right, drag left and snap-back, buttons, double-click sends one request, a failed swipe restores the card, the match flow, matches, chat with delivered and seen ticks, the empty state, reload persistence, filters, notifications, security headers, and colour regression checks. |

```bash
pnpm test        # unit and integration
pnpm test:e2e    # browser tests (builds the app first)
```

---

## Design

The look started from Coy's own design tokens (measured from the live app, see [docs/design-notes.md](docs/design-notes.md)). Discover is a sibling of Coy's style rather than a copy of it.

| From Coy's app | In Discover |
|---|---|
| One typeface (Bricolage Grotesque), hierarchy by weight | Kept |
| A phone-shaped column even on a monitor | Kept (480px) |
| Pink accent and the wordmark with a pink dot | Kept |
| Lilac as the "status" surface | Kept for empty and error states |
| 2px ink edge and hard shadow ("sticker" look) | Kept on the swipe card and LIKE/PASS stamps only. Everything else uses soft shadows. |
| Dark label on bright pink buttons | **Changed.** Filled pink surfaces use a deeper pink (`#D81E63`) with a white label (4.9:1 contrast). |
| Yellow and mint card surfaces | Not used |

Pink surfaces set a solid background colour first and layer any gradient on top, using plain gradients, so white text can never end up on a missing background in an older browser. A test checks this for chat bubbles and pop-ups.

**Product decisions.** Before building, I looked at what Tinder, Bumble and Hinge ship and kept only what fits Coy's promise:

| Feature | Decision | Why |
|---|---|---|
| Shared interests and interest-based openers | ✅ Added | A strong reason to start a chat, computed from public data only |
| Profile prompts, verified badge | ✅ Added | Trust and something to talk about |
| Distance (rounded) and filters | ✅ Added | A standard expectation, kept private by rounding |
| Chat, unmatch, report, read receipts | ✅ Added | Matches need somewhere to go. Receipts exist between mutual matches only. |
| Likes-you grid, Super Like, undo, "active now" | ❌ Rejected | Each one reveals or lets you probe one-sided interest, or leaks activity |

---

## Deployment

**The supported way to run this is locally** (see [Getting started](#getting-started)): one command, no accounts, no keys.

To host it, the app needs a database that every server instance can see:

- **A host with a persistent disk** (Render, Fly.io, Railway or a VPS): `pnpm build && pnpm start` with the default `file:./data/coy.db`. Nothing else to configure.
- **Serverless (Vercel):** a SQLite *file* can't be shared between instances, so point `DATABASE_URL` and `DATABASE_AUTH_TOKEN` at a hosted libSQL database such as Turso. It is the same SQLite engine and the same code. The `vercel-build` script migrates and seeds that database during the build.

Optional: `DEMO_RESET=true` shows the **Reset demo** button on the empty state.

Without a shared database, `lib/db/client.ts` falls back to copying a seeded file into the temp folder (`prepareRuntimeUrl`, unit-tested). That is only good enough for a single-instance demo: concurrent requests can land on different instances, and each has its own copy.

---

## Limitations and next steps

- **Single user by design.** A hosted demo is one shared account; use **Reset demo** to replay it.
- **Hosting needs a shared database** (see [Deployment](#deployment)); the file-based default is meant for local use or a single server with a disk.
- Seeded profiles never swipe "live": their interest in you is fixed seed data, and their chat replies are canned.
- The feed returns the whole remaining pool. A real product would paginate and rank it, with the same "no incoming-like signal" rule.
- No authentication, rate limiting or moderation (see [Security and privacy](#7-out-of-scope-for-this-assignment)).
- Photos are placeholders (portraits from pravatar.cc, scenery from picsum.photos), stored locally so the demo never shows broken images. Replace them before any real use.
- Verification is a seeded flag. A real version would use a selfie check.
