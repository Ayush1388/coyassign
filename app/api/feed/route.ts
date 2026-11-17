import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { internalError, json } from "@/lib/http";
import { getFeed } from "@/lib/services/feed";

export const dynamic = "force-dynamic";

/** GET /api/feed (also /feed): profiles the user hasn't swiped on yet. */
export async function GET() {
  try {
    const profiles = await getFeed(getDb(), CURRENT_USER_ID);
    return json({ profiles });
  } catch (err) {
    return internalError("feed", err);
  }
}
