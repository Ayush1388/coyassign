import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { apiError, internalError, json, readJsonBody } from "@/lib/http";
import { recordSwipe, SwipeError } from "@/lib/services/swipe";
import { swipeInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/swipe (also /swipe) with body { profileId, action: "LIKE" | "PASS" }. */
export async function POST(request: Request) {
  const read = await readJsonBody(request);
  if ("error" in read) return read.error;
  const body = read.body;

  const parsed = swipeInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "INVALID_INPUT",
      "Invalid swipe.",
      parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    );
  }

  try {
    const result = await recordSwipe(getDb(), CURRENT_USER_ID, parsed.data);
    return json(result, 201);
  } catch (err) {
    if (err instanceof SwipeError) {
      return err.code === "NOT_FOUND"
        ? apiError(404, "NOT_FOUND", "Profile not found.")
        : apiError(409, "ALREADY_SWIPED", "You've already decided on this profile.");
    }
    return internalError("swipe", err);
  }
}
