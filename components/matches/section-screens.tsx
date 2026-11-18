"use client";

import { Heart, Hourglass, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type MatchDTO, type PublicProfile } from "@/lib/api";
import { formatDay, timeAgo } from "@/lib/format";
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

const GridSkeleton = () => (
  <ul className="grid grid-cols-2 gap-4" role="status" aria-label="Loading">
    {[0, 1, 2, 3].map((i) => (
      <li key={i} className="aspect-[3/4] animate-pulse rounded-[22px] bg-soft" />
    ))}
  </ul>
);

/** A photo tile with name over a scrim, like a mini Discover card. */
function PersonTile({
  href,
  photoUrl,
  name,
  age,
  verified,
  badge,
  footer,
  testId,
  profileId,
  index,
}: {
  href?: string;
  photoUrl: string | null;
  name: string;
  age: number;
  verified: boolean;
  badge?: React.ReactNode;
  footer: React.ReactNode;
  testId: string;
  profileId: string;
  index: number;
}) {
  const body = (
    <>
      <Photo src={photoUrl} name={name} className="absolute inset-0 size-full" eager />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#120d17] via-[#120d17]/70 to-transparent" />
      {badge && <span className="absolute top-2.5 left-2.5">{badge}</span>}
      <span className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5 text-white">
        <span className="flex items-center gap-1 text-[19px] leading-tight font-extrabold">
          <span className="truncate">
            {name}, {age}
          </span>
          {verified && <VerifiedBadge className="size-[18px] shrink-0" onPhoto />}
        </span>
        <span className="text-[12px] font-bold text-white/85">{footer}</span>
      </span>
    </>
  );
  const cls =
    "relative block aspect-[3/4] overflow-hidden rounded-[22px] border-(length:--bw) border-line bg-ink shadow-(--pop)";
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25, ease: "easeOut" }}
    >
      {href ? (
        <Link href={href} data-testid={testId} data-profile-id={profileId} className={`${cls} pressable focus-ring`}>
          {body}
        </Link>
      ) : (
        <div data-testid={testId} data-profile-id={profileId} className={cls}>
          {body}
        </div>
      )}
    </motion.li>
  );
}

const sharedBadge = (n: number) =>
  n > 0 ? (
    <span className="inline-flex h-7 items-center gap-1 rounded-full border border-white/50 bg-accent px-2.5 text-[12px] font-extrabold text-accent-ink">
      <Heart className="size-3 fill-current" aria-hidden /> {n} in common
    </span>
  ) : null;

/* ---------------------------------------------------------------- Matches */

const fetchMatches = () => api.matches();

/** Every mutual match. Tap one to chat. One-sided likes never appear here. */
export function MatchesScreen() {
  const { state, reload } = useLive(fetchMatches);
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
      {state.status === "loading" && <GridSkeleton />}
      {state.status === "error" && <ErrorBox message={state.message} onRetry={() => void reload()} />}
      {state.status === "ready" && list.length === 0 && (
        <Empty
          testId="matches-empty"
          emoji="🤫"
          title="No matches yet"
          body="When someone you like likes you back, they'll appear here. One-sided likes always stay secret."
          cta={
            <Link href="/discover" className="btn-primary pressable focus-ring mt-3">
              Start discovering
            </Link>
          }
        />
      )}
      {list.length > 0 && (
        <ul className="grid grid-cols-2 gap-4" data-testid="matches-list">
          {list.map((m, i) => (
            <PersonTile
              key={m.id}
              index={i}
              href={`/discover/matches/${m.id}`}
              testId="match-item"
              profileId={m.profile.id}
              photoUrl={m.profile.photoUrl}
              name={m.profile.name}
              age={m.profile.age}
              verified={m.profile.verified}
              badge={sharedBadge(m.sharedInterests.length)}
              footer={
                m.lastMessage ? (
                  m.lastMessage.fromMe ? (
                    "Chatting"
                  ) : (
                    <span className="text-[#ff9cc0]">Your turn</span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-3" aria-hidden /> Say hi · {formatDay(m.createdAt)}
                  </span>
                )
              }
            />
          ))}
        </ul>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ Liked */

const fetchLiked = () => api.sentLikes();

/**
 * People YOU liked who haven't matched (yet). Coy deliberately has no
 * "who liked you" list: that would break the core promise.
 */
export function LikedScreen() {
  const { state, reload } = useLive<PublicProfile[]>(fetchLiked);
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
      {state.status === "loading" && <GridSkeleton />}
      {state.status === "error" && <ErrorBox message={state.message} onRetry={() => void reload()} />}
      {state.status === "ready" && list.length === 0 && (
        <Empty
          testId="liked-empty"
          emoji="💌"
          title="No pending likes"
          body="People you like show up here until they like you back. Nobody can see this list but you."
          cta={
            <Link href="/discover" className="btn-primary pressable focus-ring mt-3">
              Discover people
            </Link>
          }
        />
      )}
      {list.length > 0 && (
        <ul className="grid grid-cols-2 gap-4" data-testid="liked-list">
          {list.map((p, i) => (
            <PersonTile
              key={p.id}
              index={i}
              testId="liked-item"
              profileId={p.id}
              photoUrl={p.photoUrl}
              name={p.name}
              age={p.age}
              verified={p.verified}
              badge={sharedBadge(p.sharedInterests.length)}
              footer={
                <span className="inline-flex items-center gap-1">
                  <Hourglass className="size-3" aria-hidden /> Only you can see this
                </span>
              }
            />
          ))}
        </ul>
      )}
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
        <div className="mb-5">
          <h2 className="micro-label text-muted">New matches · say hi</h2>
          <ul className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pt-1 pb-2">
            {fresh.map((m) => (
              <li key={m.id} className="shrink-0">
                <Link
                  href={`/discover/matches/${m.id}`}
                  data-testid="new-match"
                  className="focus-ring flex w-[72px] flex-col items-center gap-1.5 rounded-[18px]"
                >
                  <span className="relative block size-[68px] overflow-hidden rounded-full border-(length:--bw) border-line shadow-(--pop)">
                    <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" eager />
                  </span>
                  <span className="max-w-full truncate text-[13px] font-bold">{m.profile.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
