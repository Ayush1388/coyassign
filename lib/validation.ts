import { z } from "zod";
import { DRINKING_IDS, INTENT_IDS, SMOKING_IDS, WORKOUT_IDS } from "./profile-options";

export const SWIPE_ACTIONS = ["LIKE", "PASS"] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

const id = z
  .string()
  .trim()
  .min(1, "id is required")
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "id has invalid characters");

/**
 * `.strict()` rejects unknown keys, so a client can't sneak in fields like
 * `matched: true`. Match status is only ever decided by the server.
 */
export const swipeInputSchema = z
  .object({
    profileId: id,
    action: z.enum(SWIPE_ACTIONS, { error: "action must be LIKE or PASS" }),
  })
  .strict();
export type SwipeInput = z.infer<typeof swipeInputSchema>;

const flag = z.enum(["1", "true"]).transform(() => true).optional();
const label = z.string().min(1).max(40).regex(/^[\p{L}\p{N} &'-]+$/u);

/** Comma-separated list param, e.g. ?intents=long_term,friends. `allowed` restricts it to known ids. */
const csv = (allowed?: readonly string[]) =>
  z
    .string()
    .max(500)
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(allowed ? z.string().refine((v) => allowed.includes(v), "unknown option") : label).max(30))
    .optional();

/** GET /feed query string. Every filter is optional; all of them use public profile fields. */
export const feedQuerySchema = z
  .object({
    minAge: z.coerce.number().int().min(18).max(99).optional(),
    maxAge: z.coerce.number().int().min(18).max(99).optional(),
    maxKm: z.coerce.number().int().min(1).max(20000).optional(),
    intents: csv(INTENT_IDS),
    drinking: csv(DRINKING_IDS),
    smoking: csv(SMOKING_IDS),
    workout: csv(WORKOUT_IDS),
    interests: csv(),
    languages: csv(),
    verified: flag,
    shared: flag,
  })
  .strict()
  .refine((q) => q.minAge == null || q.maxAge == null || q.minAge <= q.maxAge, {
    message: "minAge must be <= maxAge",
  });
export type FeedFilters = z.infer<typeof feedQuerySchema>;

export const matchIdSchema = id;

export const messageInputSchema = z
  .object({ body: z.string().trim().min(1, "Message can't be empty").max(500, "Keep it under 500 characters") })
  .strict();

export const REPORT_REASONS = ["fake_profile", "inappropriate_messages", "harassment", "underage", "other"] as const;
export const reportInputSchema = z.object({ reason: z.enum(REPORT_REASONS) }).strict();
