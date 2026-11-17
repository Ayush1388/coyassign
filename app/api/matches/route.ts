import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { internalError, json } from "@/lib/http";
import { getMatches } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

/** GET /api/matches (also /matches): confirmed mutual matches only. */
export async function GET() {
  try {
    const matches = await getMatches(getDb(), CURRENT_USER_ID);
    return json({ matches });
  } catch (err) {
    return internalError("matches", err);
  }
}
