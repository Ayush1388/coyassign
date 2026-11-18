import { CURRENT_USER_ID } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { apiError, internalError, json } from "@/lib/http";
import { ChatError, getConversation, sendMessage } from "@/lib/services/chat";
import { matchIdSchema, messageInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => apiError(404, "NOT_FOUND", "Conversation not found.");

/** GET /api/matches/:id/messages: only the two matched people can read it. */
export async function GET(_req: Request, { params }: Ctx) {
  const id = matchIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  try {
    return json(await getConversation(getDb(), CURRENT_USER_ID, id.data));
  } catch (err) {
    if (err instanceof ChatError) return notFound();
    return internalError("messages", err);
  }
}

/** POST /api/matches/:id/messages with { body }. */
export async function POST(request: Request, { params }: Ctx) {
  const id = matchIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_INPUT", "Request body must be valid JSON.");
  }
  const parsed = messageInputSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid message.");

  try {
    const message = await sendMessage(getDb(), CURRENT_USER_ID, id.data, parsed.data.body);
    return json({ message }, 201);
  } catch (err) {
    if (err instanceof ChatError) return notFound();
    return internalError("messages", err);
  }
}
