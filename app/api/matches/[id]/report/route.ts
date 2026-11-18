import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { apiError, internalError, json } from "@/lib/http";
import { ChatError, reportMatch } from "@/lib/services/chat";
import { matchIdSchema, reportInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/matches/:id/report with { reason }: records a report and unmatches. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = matchIdSchema.safeParse((await params).id);
  if (!id.success) return apiError(404, "NOT_FOUND", "Match not found.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_INPUT", "Request body must be valid JSON.");
  }
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "INVALID_INPUT", "Choose a reason.");
  try {
    await reportMatch(getDb(), CURRENT_USER_ID, id.data, parsed.data.reason);
    return json({ success: true });
  } catch (err) {
    if (err instanceof ChatError) return apiError(404, "NOT_FOUND", "Match not found.");
    return internalError("report", err);
  }
}
