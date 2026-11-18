import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { matches, messages, reports, users, type UserRow } from "../db/schema";
import { sharedWith, toMatchProfile, type MatchProfile, type MessageDTO } from "../dto";
import { getViewer } from "./feed";

export class ChatError extends Error {
  constructor(public readonly code: "NOT_FOUND") {
    super(code);
  }
}

type MatchContext = { matchId: string; createdAt: string; other: UserRow; viewer: UserRow };

/**
 * Loads a match only if `userId` is one of its two members. Anything else
 * (a non-existent id, someone else's match, an unmatched conversation) is the
 * same NOT_FOUND, so ids can't be probed.
 */
export async function loadMatch(db: DB, userId: string, matchId: string): Promise<MatchContext> {
  const row = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), or(eq(matches.userAId, userId), eq(matches.userBId, userId))))
    .get();
  if (!row) throw new ChatError("NOT_FOUND");
  const otherId = row.userAId === userId ? row.userBId : row.userAId;
  const other = await db.select().from(users).where(eq(users.id, otherId)).get();
  if (!other) throw new ChatError("NOT_FOUND");
  return { matchId: row.id, createdAt: row.createdAt, other, viewer: await getViewer(db, userId) };
}

const toDTO = (
  m: { id: string; body: string; senderId: string; deliverAt: string; seenAt?: string | null },
  userId: string,
  nowIso = new Date().toISOString(),
): MessageDTO => {
  const fromMe = m.senderId === userId;
  return {
    id: m.id,
    body: m.body,
    fromMe,
    createdAt: m.deliverAt,
    // Receipts are only shown on your own messages.
    ...(fromMe ? { status: m.seenAt && m.seenAt <= nowIso ? ("seen" as const) : ("delivered" as const) } : {}),
  };
};

export type Conversation = {
  match: { id: string; createdAt: string; profile: MatchProfile; sharedInterests: string[]; prompt: { question: string; answer: string } | null };
  messages: MessageDTO[];
  /** The other person has a reply on the way (demo profiles answer after a short delay). */
  typing: boolean;
  /** Openers built from shared interests and their prompt. */
  starters: string[];
};

export async function getConversation(db: DB, userId: string, matchId: string, now = new Date()): Promise<Conversation> {
  const ctx = await loadMatch(db, userId, matchId);
  const nowIso = now.toISOString();

  // Opening the chat marks their delivered messages as seen (their read receipt).
  await db
    .update(messages)
    .set({ seenAt: nowIso })
    .where(and(eq(messages.matchId, matchId), eq(messages.senderId, ctx.other.id), lte(messages.deliverAt, nowIso), isNull(messages.seenAt)));

  const delivered = await db
    .select()
    .from(messages)
    .where(and(eq(messages.matchId, matchId), lte(messages.deliverAt, nowIso)))
    .orderBy(asc(messages.deliverAt), asc(messages.createdAt));

  const pending = await db
    .select({ n: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.matchId, matchId), gt(messages.deliverAt, nowIso), eq(messages.senderId, ctx.other.id)))
    .get();

  const shared = sharedWith(ctx.viewer, ctx.other);
  const prompt =
    ctx.other.promptQuestion && ctx.other.promptAnswer
      ? { question: ctx.other.promptQuestion, answer: ctx.other.promptAnswer }
      : null;

  return {
    match: { id: ctx.matchId, createdAt: ctx.createdAt, profile: toMatchProfile(ctx.other), sharedInterests: shared, prompt },
    messages: delivered.map((m) => toDTO(m, userId, nowIso)),
    typing: (pending?.n ?? 0) > 0,
    starters: buildStarters(ctx.other, shared, prompt),
  };
}

export function buildStarters(
  other: UserRow,
  shared: string[],
  prompt: { question: string; answer: string } | null,
): string[] {
  const out: string[] = [];
  if (shared[0]) out.push(`Okay, important question: what got you into ${shared[0].toLowerCase()}?`);
  if (prompt) out.push(`Your "${prompt.question}" answer made me smile. Tell me more?`);
  if (shared[1]) out.push(`${shared[1]} buddy? I'm in. What's your go-to?`);
  out.push(`Hey ${other.name}! How's your week going?`);
  return out.slice(0, 3);
}

/**
 * Demo-only "other side" of the conversation: seeded profiles reply a couple of
 * seconds later. It's stored with a future deliver_at, so it works on serverless
 * with no background jobs, and it's hidden until it "arrives".
 */
function demoReply(other: UserRow, shared: string[], theirCount: number): string {
  const topic = shared[0] ?? (Array.isArray(other.interests) ? other.interests[0] : undefined) ?? "this";
  const lines = [
    "Haha hi! I was hoping you'd message first 😄",
    `Honestly? ${topic} is my whole personality at this point. You?`,
    "Okay you're fun. What does your ideal weekend look like?",
    "We should continue this over coffee sometime ☕",
    "😂 fair. Tell me something that's not on your profile.",
  ];
  return lines[theirCount % lines.length];
}

export async function sendMessage(db: DB, userId: string, matchId: string, body: string, now = new Date()) {
  const ctx = await loadMatch(db, userId, matchId);
  const nowIso = now.toISOString();

  const theirCount =
    (
      await db
        .select({ n: sql<number>`count(*)` })
        .from(messages)
        .where(and(eq(messages.matchId, matchId), eq(messages.senderId, ctx.other.id)))
        .get()
    )?.n ?? 0;

  const replyMs = now.getTime() + 1800 + Math.min(body.length * 15, 1500);
  const replyAt = new Date(replyMs).toISOString();
  // Demo: they "read" your message shortly before replying (stored ahead of time, shown once due).
  const seenAt = new Date(Math.max(now.getTime() + 700, replyMs - 1100)).toISOString();
  const mine = { id: `msg_${randomUUID()}`, matchId, senderId: userId, body, createdAt: nowIso, deliverAt: nowIso, seenAt };
  const reply = {
    id: `msg_${randomUUID()}`,
    matchId,
    senderId: ctx.other.id,
    body: demoReply(ctx.other, sharedWith(ctx.viewer, ctx.other), theirCount),
    createdAt: replyAt,
    deliverAt: replyAt,
  };

  await db.batch([db.insert(messages).values(mine), db.insert(messages).values(reply)]);
  return toDTO(mine, userId, nowIso);
}

/** Unmatch: the conversation and the match disappear for both people. The swipe stays, so they never reappear in Discover. */
export async function unmatch(db: DB, userId: string, matchId: string) {
  await loadMatch(db, userId, matchId);
  await db.batch([db.delete(messages).where(eq(messages.matchId, matchId)), db.delete(matches).where(eq(matches.id, matchId))]);
}

export async function reportMatch(db: DB, userId: string, matchId: string, reason: string) {
  const ctx = await loadMatch(db, userId, matchId);
  await db.batch([
    db.insert(reports).values({ id: `report_${randomUUID()}`, reporterId: userId, reportedId: ctx.other.id, reason }),
    db.delete(messages).where(eq(messages.matchId, matchId)),
    db.delete(matches).where(eq(matches.id, matchId)),
  ]);
}
