"use client";

import { ArrowLeft, Check, CheckCheck, Clock3, Flag, Heart, MoreVertical, Quote, SendHorizontal, ShieldCheck, UserX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Conversation, type MessageDTO } from "@/lib/api";
import { formatDay, formatTime, listInterests } from "@/lib/format";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { Photo } from "@/components/ui/photo";
import { Sheet } from "@/components/ui/sheet";

type Pending = { id: string; body: string; createdAt: string; sendState: "sending" | "failed" };

const REASONS = [
  ["fake_profile", "Fake profile or scam"],
  ["inappropriate_messages", "Inappropriate messages"],
  ["harassment", "Harassment"],
  ["underage", "Looks under 18"],
  ["other", "Something else"],
] as const;

export function ChatScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [error, setError] = useState<"not_found" | "failed" | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<null | "menu" | "unmatch" | "report">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const c = await api.conversation(matchId);
      setConvo(c);
      setError(null);
      // Drop optimistic messages the server now has.
      setPending((p) => p.filter((m) => m.sendState === "failed" || !c.messages.some((s) => s.fromMe && s.body === m.body)));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? "not_found" : "failed");
    }
  }, [matchId]);

  // Poll while open: replies, typing and read receipts arrive in the background.
  useEffect(() => {
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 1200);
    return () => clearInterval(t);
  }, [load]);

  const count = (convo?.messages.length ?? 0) + pending.length + (convo?.typing ? 1 : 0);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [count]);

  async function send(text: string, retryId?: string) {
    const body = text.trim();
    if (!body) return;
    const temp: Pending = { id: retryId ?? `temp_${Date.now()}`, body, createdAt: new Date().toISOString(), sendState: "sending" };
    setPending((p) => [...p.filter((m) => m.id !== temp.id), temp]);
    if (!retryId) setDraft("");
    try {
      await api.send(matchId, body);
      await load();
    } catch {
      setPending((p) => p.map((m) => (m.id === temp.id ? { ...m, sendState: "failed" } : m)));
    }
  }

  async function doUnmatch() {
    try {
      await api.unmatch(matchId);
      router.replace("/discover/matches");
    } catch {
      setActionError("Couldn't unmatch. Try again.");
    }
  }

  async function doReport(reason: string) {
    try {
      await api.report(matchId, reason);
      router.replace("/discover/matches");
    } catch {
      setActionError("Couldn't send the report. Try again.");
    }
  }

  if (error === "not_found") {
    return (
      <Shell>
        <div className="m-5 flex flex-col items-start gap-3 rounded-[24px] bg-status p-7">
          <p className="display text-[28px]">This chat isn&apos;t available</p>
          <p className="text-[16px] text-muted">The match may have ended.</p>
          <Link href="/discover/chats" className="pill-primary focus-ring mt-1 h-12">
            Back to chats
          </Link>
        </div>
      </Shell>
    );
  }

  const p = convo?.match.profile;
  const messages = convo?.messages ?? [];
  const empty = convo && messages.length === 0 && pending.length === 0;
  const lastMineId = [...messages].reverse().find((m) => m.fromMe)?.id;

  // Group consecutive messages from the same side (tighter spacing, joined corners).
  const rows: (MessageDTO | (Pending & { fromMe: true }))[] = [...messages, ...pending.map((m) => ({ ...m, fromMe: true as const }))];

  return (
    <Shell>
      <header className="flex items-center gap-3 bg-surface/95 px-3 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 shadow-[0_1px_0_var(--hairline)] backdrop-blur">
        <Link href="/discover/chats" aria-label="Back to chats" className="btn-soft focus-ring shrink-0">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        {p ? (
          <>
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface">
              <Photo src={p.photoUrl} name={p.name} className="absolute inset-0 size-full" eager />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[17px] leading-tight font-extrabold">
                <span className="truncate" data-testid="chat-name">
                  {p.name}
                </span>
                {p.verified && <VerifiedBadge className="size-[18px]" />}
              </p>
              <p className="truncate text-[12.5px] font-semibold text-muted">
                {convo?.typing ? <span className="text-accent-strong">typing…</span> : `Matched ${formatDay(convo!.match.createdAt)} · ${p.city}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMenu("menu")}
              aria-label="Safety and options"
              data-testid="chat-menu"
              className="btn-soft focus-ring shrink-0"
            >
              <MoreVertical className="size-5" aria-hidden />
            </button>
          </>
        ) : (
          <div className="h-11 flex-1 animate-pulse rounded-full bg-soft" />
        )}
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-soft px-3.5 py-4" data-testid="chat-log">
        {convo && p && (
          <div className="mx-auto mb-5 max-w-[360px] rounded-[24px] bg-surface p-4 text-center shadow-[0_8px_24px_-14px_rgba(21,18,29,0.35)]">
            <div className="mx-auto flex w-fit -space-x-2">
              <span className="relative flex size-14 items-center justify-center rounded-full bg-accent-strong text-[15px] font-extrabold text-white ring-4 ring-surface">
                You
              </span>
              <span className="relative size-14 overflow-hidden rounded-full ring-4 ring-surface">
                <Photo src={p.photoUrl} name={p.name} className="absolute inset-0 size-full" eager />
              </span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.06em] text-accent-strong uppercase">
              <Heart className="size-3 fill-current" aria-hidden /> It&apos;s mutual
            </p>
            <p className="display mt-0.5 text-[20px]">You and {p.name} matched</p>
            {convo.match.sharedInterests.length > 0 && (
              <p className="mt-1 text-[14px] text-muted">
                You both like <b className="text-ink">{listInterests(convo.match.sharedInterests, 3)}</b>
              </p>
            )}
            {convo.match.prompt && (
              <div className="mt-3 rounded-[16px] bg-soft px-3.5 py-2.5 text-left">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold tracking-[0.08em] text-muted uppercase">
                  <Quote className="size-3" aria-hidden /> {convo.match.prompt.question}
                </span>
                <p className="text-[14px] font-semibold">{convo.match.prompt.answer}</p>
              </div>
            )}
          </div>
        )}

        <p className="mb-4 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-semibold text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Never share OTPs, passwords or money details.
        </p>

        {rows.length > 0 && (
          <p className="mb-3 text-center">
            <span className="rounded-full bg-surface/80 px-3 py-1 text-[11px] font-bold text-muted">Today</span>
          </p>
        )}

        <ul className="flex flex-col">
          {rows.map((m, i) => {
            const prev = rows[i - 1];
            const next = rows[i + 1];
            const firstOfGroup = !prev || prev.fromMe !== m.fromMe;
            const lastOfGroup = !next || next.fromMe !== m.fromMe;
            const isPending = "sendState" in m;
            return (
              <Bubble
                key={m.id}
                m={m}
                first={firstOfGroup}
                last={lastOfGroup}
                sendState={isPending ? m.sendState : undefined}
                showStatusLabel={!isPending && m.id === lastMineId && !pending.length}
                seenAt={!isPending ? (m as MessageDTO).seenAt : undefined}
                onRetry={isPending ? () => void send(m.body, m.id) : undefined}
                avatar={!m.fromMe && lastOfGroup ? p?.photoUrl ?? null : undefined}
                name={p?.name ?? ""}
              />
            );
          })}
          <AnimatePresence>
            {convo?.typing && (
              <motion.li
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 flex items-end gap-2 self-start"
                data-testid="typing"
              >
                <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
                  {p && <Photo src={p.photoUrl} name={p.name} className="absolute inset-0 size-full" />}
                </span>
                <span
                  className="flex items-center gap-1 rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-3 shadow-[0_2px_6px_-3px_rgba(21,18,29,0.25)]"
                  aria-label={`${p?.name} is typing`}
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-2 rounded-full bg-muted/70"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </span>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>

        {empty && convo.starters.length > 0 && (
          <div className="mt-3" data-testid="starters">
            <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-muted uppercase">Break the ice</p>
            <div className="flex flex-col items-start gap-2">
              {convo.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    input.current?.focus();
                  }}
                  className="focus-ring rounded-[18px] bg-surface px-3.5 py-2.5 text-left text-[14px] font-semibold shadow-[0_2px_8px_-4px_rgba(21,18,29,0.3)] transition-colors hover:bg-accent-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error === "failed" && (
          <p role="alert" className="mt-3 text-center text-[13px] font-bold text-accent-strong">
            Connection trouble, retrying…
          </p>
        )}
      </div>

      <form
        className="flex items-end gap-2 bg-surface px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--hairline)]"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <label htmlFor="composer" className="sr-only">
          Message {p?.name}
        </label>
        <textarea
          id="composer"
          ref={input}
          rows={1}
          value={draft}
          maxLength={500}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder={p ? `Message ${p.name}…` : "Message…"}
          data-testid="composer"
          className="max-h-32 min-h-12 flex-1 resize-none rounded-[24px] bg-soft px-4 py-3 text-[16px] leading-snug outline-none transition-shadow placeholder:text-muted focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          data-testid="send"
          className="fab fab-like focus-ring size-12 shrink-0 disabled:opacity-35"
        >
          <SendHorizontal className="size-5 text-white" aria-hidden />
        </button>
      </form>

      <Sheet open={menu === "menu"} onClose={() => setMenu(null)} title="Safety & options" testId="chat-options">
        <div className="flex flex-col gap-2 pt-1">
          <SheetRow onClick={() => setMenu("unmatch")} icon={<UserX className="size-5" aria-hidden />}>
            Unmatch {p?.name}
          </SheetRow>
          <SheetRow onClick={() => setMenu("report")} icon={<Flag className="size-5" aria-hidden />}>
            Report {p?.name}
          </SheetRow>
          <p className="mt-1 text-[13px] font-semibold text-muted">{p?.name} won&apos;t be told you unmatched or reported them.</p>
        </div>
      </Sheet>

      <Sheet open={menu === "unmatch"} onClose={() => setMenu(null)} title={`Unmatch ${p?.name ?? ""}?`} testId="unmatch-sheet">
        <p className="text-[16px]">This deletes the chat for both of you, and {p?.name} won&apos;t appear in Discover again.</p>
        {actionError && (
          <p role="alert" className="mt-2 text-[14px] font-bold text-accent-strong">
            {actionError}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => setMenu(null)} className="focus-ring h-12 flex-1 rounded-full bg-soft text-[16px] font-bold hover:bg-hairline">
            Cancel
          </button>
          <button type="button" onClick={() => void doUnmatch()} className="pill-primary focus-ring h-12 flex-1" data-testid="confirm-unmatch">
            Unmatch
          </button>
        </div>
      </Sheet>

      <Sheet open={menu === "report"} onClose={() => setMenu(null)} title={`Report ${p?.name ?? ""}`} testId="report-sheet">
        <p className="text-[15px] text-muted">Reporting also unmatches you. Our team reviews every report.</p>
        {actionError && (
          <p role="alert" className="mt-2 text-[14px] font-bold text-accent-strong">
            {actionError}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map(([value, label]) => (
            <SheetRow key={value} onClick={() => void doReport(value)}>
              {label}
            </SheetRow>
          ))}
        </div>
      </Sheet>
    </Shell>
  );
}

function SheetRow({ onClick, icon, children }: { onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex min-h-13 items-center gap-3 rounded-[16px] bg-soft px-4 text-left text-[16px] font-bold transition-colors hover:bg-hairline"
    >
      {icon}
      {children}
    </button>
  );
}

/** Full-screen chat layer (the tab bar is hidden on this route). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-soft">
      <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-surface">{children}</div>
    </div>
  );
}

/** Read receipt: 🕓 sending · ✓ delivered · ✓✓ (blue) seen. */
function Receipt({ state }: { state: "sending" | "failed" | "delivered" | "seen" }) {
  if (state === "sending") return <Clock3 className="size-3.5 text-muted" aria-label="Sending" />;
  if (state === "seen") return <CheckCheck className="size-4 text-[#1f7aec]" strokeWidth={2.5} aria-label="Seen" data-testid="tick-seen" />;
  if (state === "delivered") return <Check className="size-4 text-muted" strokeWidth={2.5} aria-label="Delivered" data-testid="tick-delivered" />;
  return null;
}

function Bubble({
  m,
  first,
  last,
  sendState,
  showStatusLabel,
  seenAt,
  onRetry,
  avatar,
  name,
}: {
  m: { id: string; body: string; fromMe: boolean; createdAt: string; status?: MessageDTO["status"] };
  first: boolean;
  last: boolean;
  sendState?: "sending" | "failed";
  /** Spell the status out ("Seen 8:25 pm" / "Delivered") under my most recent message. */
  showStatusLabel: boolean;
  seenAt?: string;
  onRetry?: () => void;
  avatar?: string | null;
  name: string;
}) {
  const state = sendState ?? m.status ?? "delivered";
  // Joined corners inside a group, a "tail" corner on the last bubble.
  const mineShape = `rounded-[20px] ${first ? "" : "rounded-tr-[6px]"} ${last ? "rounded-br-[6px]" : "rounded-br-[6px]"}`;
  const theirShape = `rounded-[20px] ${first ? "" : "rounded-tl-[6px]"} rounded-bl-[6px]`;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex max-w-[82%] items-end gap-2 ${m.fromMe ? "self-end" : "self-start"} ${first ? "mt-2.5" : "mt-0.5"}`}
      data-testid={m.fromMe ? "msg-mine" : "msg-theirs"}
      data-status={m.fromMe ? state : undefined}
    >
      {!m.fromMe && (
        <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
          {avatar !== undefined && <Photo src={avatar} name={name} className="absolute inset-0 size-full" />}
        </span>
      )}
      <span className={`flex flex-col ${m.fromMe ? "items-end" : "items-start"}`}>
        <span
          className={`px-3.5 py-2 text-[15.5px] leading-snug break-words whitespace-pre-wrap ${
            m.fromMe
              ? `${mineShape} bubble-mine`
              : `${theirShape} bg-surface text-ink shadow-[0_2px_8px_-4px_rgba(21,18,29,0.28)]`
          } ${sendState === "sending" ? "opacity-75" : ""}`}
        >
          {m.body}
        </span>
        {last && (
          <span className="mt-1 flex items-center gap-1 px-1 text-[11px] font-semibold text-muted">
            {sendState === "failed" ? (
              <button type="button" onClick={onRetry} className="focus-ring font-bold text-accent-strong underline">
                Not sent. Tap to retry
              </button>
            ) : (
              <>
                {formatTime(m.createdAt)}
                {m.fromMe && <Receipt state={state} />}
                {showStatusLabel && state === "seen" && (
                  <span data-testid="seen-label" className="font-bold text-[#1a63cf]">
                    Seen{seenAt ? ` ${formatTime(seenAt)}` : ""}
                  </span>
                )}
                {showStatusLabel && state === "delivered" && <span data-testid="delivered-label">Delivered</span>}
              </>
            )}
          </span>
        )}
      </span>
    </motion.li>
  );
}
