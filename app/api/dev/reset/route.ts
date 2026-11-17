import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { resetDemo } from "@/lib/db/seed";
import { demoResetEnabled } from "@/lib/demo";
import { apiError, internalError, json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Demo helper: clears the logged-in user's swipes and matches so the flow can be replayed. */
export async function POST() {
  if (!demoResetEnabled()) return apiError(403, "FORBIDDEN", "Demo reset is disabled.");
  try {
    await resetDemo(getDb(), CURRENT_USER_ID);
    return json({ success: true });
  } catch (err) {
    return internalError("reset", err);
  }
}
