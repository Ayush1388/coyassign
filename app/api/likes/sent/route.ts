import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { internalError, json } from "@/lib/http";
import { getSentLikes } from "@/lib/services/likes";

export const dynamic = "force-dynamic";

/** GET /api/likes/sent: people *you* liked who haven't matched (yet). Never who liked you. */
export async function GET() {
  try {
    return json({ profiles: await getSentLikes(getDb(), CURRENT_USER_ID) });
  } catch (err) {
    return internalError("likes", err);
  }
}
