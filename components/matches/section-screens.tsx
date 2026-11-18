"use client";

import { Hourglass, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type MatchDTO, type PublicProfile } from "@/lib/api";
import { formatDay, timeAgo } from "@/lib/format";
import { ProfileSheet } from "@/components/discover/profile-sheet";
import { PersonCard } from "./person-card";
import { AppHeader } from "@/components/nav/app-header";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { SectionTabs, type Section } from "@/components/discover/section-tabs";
import { summarise, useCounts } from "@/components/discover/use-counts";
import { Photo } from "@/components/ui/photo";

type Load<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/** Fetch + keep fresh (replies and matches arrive in the background). */
function useLive<T>(fetcher: () => Promise<T>, pollMs = 4000) {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setState({ status: "loading" });
      try {
        setState({ status: "ready", data: await fetcher() });
      } catch (e) {
        if (!quiet) setState({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load this." });
      }
    },
    [fetcher],
  );
  useEffect(() => {
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(true), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);
  return { state, reload: load };
}

function Frame({
  section,
  title,
  subtitle,
  children,
}: {
  section: Section;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { counts } = useCounts();
  return (
    <>
      <AppHeader attention={counts ? counts.yourTurn + counts.newMatches : 0} />
      <SectionTabs active={section} counts={counts} />
      <div className="px-5 pt-4 pb-4">
        <h1 className="font-serif text-[34px] leading-[1.02]">{title}</h1>
        <p className="mt-1.5 text-[14px] font-semibold text-muted">{subtitle}</p>
      </div>
      <section className="px-5 pb-6">{children}</section>
    </>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="sticker-hero flex flex-col items-start gap-3 bg-status! p-7" role="alert">
      <p className="display text-[26px]">Couldn&apos;t load this</p>
      <p className="text-[16px] text-muted">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary pressable focus-ring mt-1">
        Try again
      </button>
    </div>
  );
}

function Empty({ emoji, title, body, cta, testId }: { emoji: string; title: string; body: string; cta: React.ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="sticker-hero flex flex-col items-start gap-3 bg-status! p-7">
      <span className="emoji-tile size-16 text-[34px]" aria-hidden>
        {emoji}
      </span>
      <p className="display mt-2 text-[28px]">{title}</p>
      <p className="text-[16px] leading-[1.45] text-ink/75">{body}</p>
      {cta}
    </div>
  );
}

/* ---------------------------------------------------------------- Matches */

const fetchMatches = () => api.matches();

/** Every mutual match as a rich card: what you share, what they're after, and where the chat stands. */
export function MatchesScreen() {
  const { state, reload } = useLive(fetchMatches);
  const [open, setOpen] = useState<PublicProfile | null>(null);
  const list = state.status === "ready" ? state.data : [];
  return (
    <Frame
      section="matches"
      title={
        <>
          It&apos;s <em className="text-accent-strong">mutual</em>
        </>
      }
      subtitle="Only people who liked you back. One-sided likes never show up."
    >
      {state.status === "loading" && <CardsSkeleton />}
      {state.status === "error" && <ErrorBox message={state.message} onRetry={() => void reload()} />}
      {state.status === "ready" && list.length === 0 && (
        <Empty
          testId="matches-empty"
          emoji="🤫"
          title="No matches yet"
          body="When someone you like likes you back, they'll appear here. One-sided likes always stay secret."
          cta={
            <Link href="/discover" className="pill-primary focus-ring mt-3 h-12">
              Start discovering
            </Link>
          }
        />
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-3.5" data-testid="matches-list">
          {list.map((m, i) => {
            const theirTurn = !!m.lastMessage && !m.lastMessage.fromMe;
            const profile = m.details;
            if (!profile) return null;
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25, ease: "easeOut" }}
              >
                <PersonCard
                  testId="match-item"
                  profile={profile}
                  accent={theirTurn}
                  onOpen={() => setOpen(profile)}
                  footer={
                    m.lastMessage ? (
                      <p className="flex min-w-0 items-center gap-1.5 text-[13px]">
                        {theirTurn && (
                          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-extrabold tracking-[0.04em] uppercase">
                            Your turn
                          </span>
                        )}
                        <span className={`truncate ${theirTurn ? "font-bold" : "text-muted"}`}>
                          {m.lastMessage.fromMe ? "You: " : ""}
                          {m.lastMessage.body}
                        </span>
                      </p>
                    ) : (
                      <p className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
                        <Sparkles className="size-3.5 text-accent-strong" aria-hidden /> New match · {formatDay(m.createdAt)}
                      </p>
                    )
                  }
                  actions={
                    <Link
                      href={`/discover/matches/${m.id}`}
                      data-testid="match-chat"
                      className="pill-primary focus-ring h-10 w-full text-[14px]"
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      {m.lastMessage ? (theirTurn ? "Reply" : "Open chat") : "Say hi"}
                    </Link>
                  }
                />
              </motion.li>
            );
          })}
        </ul>
      )}
      <ProfileSheet profile={open} open={!!open} onClose={() => setOpen(null)} note="It's mutual. You can message each other." />
    </Frame>
  );
}

const CardsSkeleton = () => (
  <div className="space-y-3" role="status" aria-label="Loading">
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-[178px] animate-pulse rounded-[24px] bg-soft" />
    ))}
  </div>
);

/* ------------------------------------------------------------------ Liked */

const fetchLiked = () => api.sentLikes();

/**
 * People YOU liked who haven't matched (yet), as rich cards: what you share,
 * what they're looking for, distance. Coy deliberately has no "who liked you" list.
 */
export function LikedScreen() {
  const { state, reload } = useLive<PublicProfile[]>(fetchLiked);
  const [open, setOpen] = useState<PublicProfile | null>(null);
  const list = state.status === "ready" ? state.data : [];
  return (
    <Frame
      section="liked"
      title={
        <>
          Your <em className="text-accent-strong">secret</em> likes
        </>
      }
      subtitle="They only find out if they like you back. Then it's a match."
    >
      {state.status === "loading" && <CardsSkeleton />}
      {state.status === "error" && <ErrorBox message={state.message} onRetry={() => void reload()} />}
      {state.status === "ready" && list.length === 0 && (
        <Empty
          testId="liked-empty"
          emoji="💌"
          title="No pending likes"
          body="People you like show up here until they like you back. Nobody can see this list but you."
          cta={
            <Link href="/discover" className="pill-primary focus-ring mt-3 h-12">
              Discover people
            </Link>
          }
        />
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-3.5" data-testid="liked-list">
          {list.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25, ease: "easeOut" }}
            >
              <PersonCard
                testId="liked-item"
                profile={p}
                onOpen={() => setOpen(p)}
                footer={
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted">
                    <Hourglass className="size-3" aria-hidden /> Waiting on them · only you can see this
                  </span>
                }
              />
            </motion.li>
          ))}
        </ul>
      )}
      <ProfileSheet
        profile={open}
        open={!!open}
        onClose={() => setOpen(null)}
        note="You liked them. They'll only find out if they like you back."
      />
    </Frame>
  );
}

/* ------------------------------------------------------------------ Chats */

/** Conversations sorted by latest activity, plus new matches to start one with. */
export function ChatsScreen() {
  const { state, reload } = useLive(fetchMatches);
  const all = state.status === "ready" ? state.data : [];
  const convos = all.filter((m) => m.lastMessage);
  const fresh = all.filter((m) => !m.lastMessage);
  const c = summarise(all, 0);

  return (
    <Frame
      section="chats"
      title={
        <>
          Your <em className="text-accent-strong">chats</em>
        </>
      }
      subtitle={c.yourTurn ? `${c.yourTurn} waiting on you.` : "Only matches can message you."}
    >
      {state.status === "loading" && (
        <div className="space-y-3" role="status" aria-label="Loading chats">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[78px] animate-pulse rounded-[20px] bg-soft" />
          ))}
        </div>
      )}
      {state.status === "error" && <ErrorBox message={state.message} onRetry={() => void reload()} />}

      {fresh.length > 0 && (
        <div className="mb-6">
          <h2 className="micro-label text-muted">New matches · say hi</h2>
          <ul className="mt-3 flex flex-col gap-2.5" data-testid="new-matches">
            {fresh.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/discover/matches/${m.id}`}
                  data-testid="new-match"
                  data-profile-id={m.profile.id}
                  className="focus-ring flex items-center gap-3 rounded-[20px] border border-hairline bg-surface p-3 transition-colors hover:bg-soft"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface">
                    <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" eager />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[16px] font-extrabold">{m.profile.name}</span>
                      {m.profile.verified && <VerifiedBadge className="size-4" />}
                      <span className="ml-auto shrink-0 text-[12px] font-semibold text-muted">{formatDay(m.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-muted">
                      {m.sharedInterests.length
                        ? `You both like ${m.sharedInterests.slice(0, 2).join(" & ")}`
                        : "You matched. Say hi!"}
                    </span>
                  </span>
                  <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-accent-soft px-3 text-[13px] font-extrabold text-ink">
                    <MessageCircle className="size-3.5" aria-hidden /> Say hi
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {convos.length > 0 && <h2 className="micro-label mb-3 text-muted">Messages</h2>}

      {state.status === "ready" && convos.length === 0 && (
        <Empty
          testId="chats-empty"
          emoji="💬"
          title="No chats yet"
          body={
            fresh.length
              ? "Pick a new match above. We'll suggest an opener based on what you both like."
              : "Match with someone to start chatting. Only mutual matches can message each other."
          }
          cta={
            fresh.length ? null : (
              <Link href="/discover" className="btn-primary pressable focus-ring mt-3">
                Discover people
              </Link>
            )
          }
        />
      )}

      {convos.length > 0 && (
        <ul className="flex flex-col gap-2.5" data-testid="conversations">
          {convos.map((m: MatchDTO) => {
            const last = m.lastMessage!;
            const theirTurn = !last.fromMe;
            return (
              <li key={m.id}>
                <Link
                  href={`/discover/matches/${m.id}`}
                  data-testid="chat-item"
                  data-profile-id={m.profile.id}
                  className="focus-ring flex items-center gap-3 rounded-[20px] bg-soft p-3 transition-colors hover:bg-hairline"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full border-(length:--bw) border-line">
                    <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" eager />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[16px] font-extrabold">{m.profile.name}</span>
                      {m.profile.verified && <VerifiedBadge className="size-4" />}
                      <span className="ml-auto shrink-0 text-[12px] font-semibold text-muted">{timeAgo(last.createdAt)}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-[14px] ${theirTurn ? "font-bold text-ink" : "text-muted"}`}>
                      {last.fromMe ? "You: " : ""}
                      {last.body}
                    </span>
                    {theirTurn && (
                      <span className="micro-label mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-ink">
                        Your turn
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Frame>
  );
}
