import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { apiError, internalError, json } from "@/lib/http";
import { getFeed } from "@/lib/services/feed";
import { feedQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/feed (also /feed). Optional ?minAge=&maxAge=&maxKm= filters. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = feedQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      400,
      "INVALID_INPUT",
      "Invalid filters.",
      parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    );
  }
  try {
    const profiles = await getFeed(getDb(), CURRENT_USER_ID, parsed.data);
    return json({ profiles });
  } catch (err) {
    return internalError("feed", err);
  }
}
