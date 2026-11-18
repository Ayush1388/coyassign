"use client";

import { ArrowLeft, Flag, Heart, MoreVertical, Send, ShieldCheck, UserX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Conversation, type MessageDTO } from "@/lib/api";
import { formatDay, formatTime, listInterests } from "@/lib/format";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { Photo } from "@/components/ui/photo";
import { Sheet } from "@/components/ui/sheet";

type Pending = MessageDTO & { status: "sending" | "failed" };

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
      setPending((p) => p.filter((m) => m.status === "failed" || !c.messages.some((s) => s.body === m.body && s.fromMe)));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? "not_found" : "failed");
    }
  }, [matchId]);

  // Poll while open: demo profiles reply a few seconds after you message.
  useEffect(() => {
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 1500);
    return () => clearInterval(t);
  }, [load]);

  const count = (convo?.messages.length ?? 0) + pending.length + (convo?.typing ? 1 : 0);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [count]);

  async function send(text: string, retryId?: string) {
    const body = text.trim();
    if (!body) return;
    const temp: Pending = {
      id: retryId ?? `temp_${Date.now()}`,
      body,
      fromMe: true,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setPending((p) => [...p.filter((m) => m.id !== temp.id), temp]);
    if (!retryId) setDraft("");
    try {
      await api.send(matchId, body);
      await load();
    } catch {
      setPending((p) => p.map((m) => (m.id === temp.id ? { ...m, status: "failed" } : m)));
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
        <div className="m-5 sticker-hero flex flex-col items-start gap-3 bg-status! p-7">
          <p className="display text-[28px]">This chat isn&apos;t available</p>
          <p className="text-[16px] text-muted">The match may have ended.</p>
          <Link href="/discover/matches" className="btn-primary pressable focus-ring mt-1">
            Back to matches
          </Link>
        </div>
      </Shell>
    );
  }

  const p = convo?.match.profile;
  const empty = convo && convo.messages.length === 0 && pending.length === 0;

  return (
    <Shell>
      <header className="flex items-center gap-3 border-b border-hairline px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <Link href="/discover/chats" aria-label="Back to chats" className="btn-soft focus-ring shrink-0">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        {p ? (
          <>
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full border-(length:--bw) border-line">
              <Photo src={p.photoUrl} name={p.name} className="absolute inset-0 size-full" eager />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[18px] leading-tight font-extrabold">
                <span className="truncate" data-testid="chat-name">
                  {p.name}
                </span>
                {p.verified && <VerifiedBadge className="size-[18px]" />}
              </p>
              <p className="truncate text-[13px] font-semibold text-muted">
                Matched {formatDay(convo!.match.createdAt)} · {p.city}
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

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite" data-testid="chat-log">
        {convo && p && (
          <div className="sticker mx-auto mb-5 max-w-[360px] bg-reward! p-4 text-center">
            <p className="micro-label inline-flex items-center gap-1.5">
              <Heart className="size-3 fill-accent text-ink" aria-hidden /> It&apos;s mutual
            </p>
            <p className="display mt-1 text-[22px]">You and {p.name} matched</p>
            {convo.match.sharedInterests.length > 0 && (
              <p className="mt-1 text-[14px] font-semibold">You both like {listInterests(convo.match.sharedInterests, 3)}</p>
            )}
            {convo.match.prompt && (
              <p className="mt-3 rounded-[14px] border-(length:--bw) border-line bg-surface px-3 py-2 text-left text-[14px]">
                <span className="micro-label block text-[10px] text-muted">{convo.match.prompt.question}</span>
                {convo.match.prompt.answer}
              </p>
            )}
          </div>
        )}

        <p className="mb-4 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Never share OTPs, passwords or money details.
        </p>

        <ul className="flex flex-col gap-2">
          {convo?.messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          {pending.map((m) => (
            <Bubble key={m.id} m={m} status={m.status} onRetry={() => void send(m.body, m.id)} />
          ))}
          <AnimatePresence>
            {convo?.typing && (
              <motion.li
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="self-start"
                data-testid="typing"
              >
                <span className="flex items-center gap-1 rounded-[20px] rounded-bl-md bg-soft px-4 py-3" aria-label={`${p?.name} is typing`}>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-muted"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </span>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>

        {empty && convo.starters.length > 0 && (
          <div className="mt-2" data-testid="starters">
            <p className="micro-label mb-2 text-muted">Break the ice</p>
            <div className="flex flex-col items-start gap-2">
              {convo.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    input.current?.focus();
                  }}
                  className="focus-ring rounded-[16px] border-(length:--bw) border-line bg-surface px-3.5 py-2 text-left text-[14px] font-semibold transition-colors hover:bg-accent-soft"
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
        className="flex items-end gap-2 border-t border-hairline px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
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
          className="focus-ring max-h-32 min-h-12 flex-1 resize-none rounded-[var(--radius-input)] border-(length:--bw) border-line bg-surface px-4 py-3 text-[16px] leading-snug outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          data-testid="send"
          className="sticker pressable focus-ring flex size-12 shrink-0 items-center justify-center rounded-full! bg-accent!"
        >
          <Send className="size-5 text-accent-ink" aria-hidden />
        </button>
      </form>

      <Sheet open={menu === "menu"} onClose={() => setMenu(null)} title="Safety & options" testId="chat-options">
        <div className="flex flex-col gap-2.5 pt-1">
          <button type="button" onClick={() => setMenu("unmatch")} className="btn-secondary pressable focus-ring justify-start!">
            <UserX className="size-5" aria-hidden /> Unmatch {p?.name}
          </button>
          <button type="button" onClick={() => setMenu("report")} className="btn-secondary pressable focus-ring justify-start!">
            <Flag className="size-5" aria-hidden /> Report {p?.name}
          </button>
          <p className="mt-1 text-[13px] font-semibold text-muted">
            {p?.name} won&apos;t be told you unmatched or reported them.
          </p>
        </div>
      </Sheet>

      <Sheet open={menu === "unmatch"} onClose={() => setMenu(null)} title={`Unmatch ${p?.name ?? ""}?`} testId="unmatch-sheet">
        <p className="text-[16px]">This deletes the chat for both of you, and {p?.name} won&apos;t appear in Discover again.</p>
        {actionError && <p role="alert" className="mt-2 text-[14px] font-bold text-accent-strong">{actionError}</p>}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => setMenu(null)} className="btn-secondary pressable focus-ring flex-1">
            Cancel
          </button>
          <button type="button" onClick={() => void doUnmatch()} className="btn-primary pressable focus-ring flex-1" data-testid="confirm-unmatch">
            Unmatch
          </button>
        </div>
      </Sheet>

      <Sheet open={menu === "report"} onClose={() => setMenu(null)} title={`Report ${p?.name ?? ""}`} testId="report-sheet">
        <p className="text-[15px] text-muted">Reporting also unmatches you. Our team reviews every report.</p>
        {actionError && <p role="alert" className="mt-2 text-[14px] font-bold text-accent-strong">{actionError}</p>}
        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => void doReport(value)}
              className="focus-ring min-h-12 rounded-[16px] bg-soft px-4 text-left text-[16px] font-bold transition-colors hover:bg-hairline"
            >
              {label}
            </button>
          ))}
        </div>
      </Sheet>
    </Shell>
  );
}

/** Full-screen chat layer (the tab bar is hidden on this route). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-bg">
      <div className="mx-auto flex h-dvh max-w-[480px] flex-col">{children}</div>
    </div>
  );
}

function Bubble({ m, status, onRetry }: { m: MessageDTO; status?: "sending" | "failed"; onRetry?: () => void }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: status === "sending" ? 0.7 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex max-w-[80%] flex-col ${m.fromMe ? "items-end self-end" : "items-start self-start"}`}
      data-testid={m.fromMe ? "msg-mine" : "msg-theirs"}
    >
      <span
        className={`rounded-[20px] px-4 py-2.5 text-[16px] leading-snug break-words whitespace-pre-wrap ${
          m.fromMe
            ? "rounded-br-md border-(length:--bw) border-line bg-accent text-accent-ink"
            : "rounded-bl-md bg-soft text-ink"
        }`}
      >
        {m.body}
      </span>
      <span className="mt-0.5 px-1 text-[11px] font-semibold text-muted">
        {status === "sending" ? "Sending…" : status === "failed" ? "" : formatTime(m.createdAt)}
        {status === "failed" && (
          <button type="button" onClick={onRetry} className="focus-ring font-bold text-accent-strong underline">
            Not sent. Tap to retry
          </button>
        )}
      </span>
    </motion.li>
  );
}
