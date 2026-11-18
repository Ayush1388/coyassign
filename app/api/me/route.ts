import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { internalError, json } from "@/lib/http";
import { getViewer } from "@/lib/services/feed";

export const dynamic = "force-dynamic";

/** GET /api/me: the logged-in user's own public basics (for "your interests" UI). */
export async function GET() {
  try {
    const me = await getViewer(getDb(), CURRENT_USER_ID);
    return json({ me: { name: me.name, city: me.city, interests: me.interests } });
  } catch (err) {
    return internalError("me", err);
  }
}
