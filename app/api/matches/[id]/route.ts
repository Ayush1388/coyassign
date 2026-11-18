import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { apiError, internalError, json } from "@/lib/http";
import { ChatError, unmatch } from "@/lib/services/chat";
import { matchIdSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** DELETE /api/matches/:id unmatches: removes the match and the chat. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = matchIdSchema.safeParse((await params).id);
  if (!id.success) return apiError(404, "NOT_FOUND", "Match not found.");
  try {
    await unmatch(getDb(), CURRENT_USER_ID, id.data);
    return json({ success: true });
  } catch (err) {
    if (err instanceof ChatError) return apiError(404, "NOT_FOUND", "Match not found.");
    return internalError("unmatch", err);
  }
}
