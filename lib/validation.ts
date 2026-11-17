import { z } from "zod";

export const SWIPE_ACTIONS = ["LIKE", "PASS"] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

/**
 * `.strict()` rejects unknown keys, so a client can't sneak in fields like
 * `matched: true`. Match status is only ever decided by the server.
 */
export const swipeInputSchema = z
  .object({
    profileId: z
      .string()
      .trim()
      .min(1, "profileId is required")
      .max(64)
      .regex(/^[A-Za-z0-9_-]+$/, "profileId has invalid characters"),
    action: z.enum(SWIPE_ACTIONS, { error: "action must be LIKE or PASS" }),
  })
  .strict();

export type SwipeInput = z.infer<typeof swipeInputSchema>;
