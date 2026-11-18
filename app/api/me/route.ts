import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { internalError, json } from "@/lib/http";
import { getFilterOptions, getViewer } from "@/lib/services/feed";

export const dynamic = "force-dynamic";

/** GET /api/me: the logged-in user's own public basics (for "your interests" UI). */
export async function GET() {
  try {
    const db = getDb();
    const me = await getViewer(db, CURRENT_USER_ID);
    return json({
      me: { name: me.name, city: me.city, interests: me.interests, intent: me.intent },
      options: await getFilterOptions(db, CURRENT_USER_ID),
    });
  } catch (err) {
    return internalError("me", err);
  }
}
