"use client";

import { ArrowLeft, Heart } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type MatchDTO } from "@/lib/api";
import { listInterests, timeAgo } from "@/lib/format";
import { AppHeader } from "@/components/nav/app-header";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { Photo } from "@/components/ui/photo";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; matches: MatchDTO[] };

/**
 * Inbox. "New matches" (mint, Coy's reward surface) are people you haven't talked
 * to yet. Conversations below are sorted by latest activity.
 */
export function MatchesScreen() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState({ status: "loading" });
    try {
      setState({ status: "ready", matches: await api.matches() });
    } catch (e) {
      if (!quiet) setState({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load matches." });
    }
  }, []);

  useEffect(() => {
    void load();
    // Replies arrive in the background, so keep the inbox fresh while it's open.
    const t = setInterval(() => document.visibilityState === "visible" && void load(true), 4000);
    return () => clearInterval(t);
  }, [load]);

  const all = state.status === "ready" ? state.matches : [];
  const fresh = all.filter((m) => !m.lastMessage);
  const convos = all.filter((m) => m.lastMessage);

  return (
    <>
      <AppHeader />
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/discover" aria-label="Back to Discover" className="btn-soft focus-ring">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="display text-[36px]">Matches</h1>
          {all.length > 0 && (
            <span className="ml-auto rounded-full bg-soft px-3 py-1 text-[13px] font-bold text-muted">{all.length} mutual</span>
          )}
        </div>
        <p className="mt-2 text-[13px] font-semibold text-muted">Only people who liked you back. One-sided likes never show up.</p>
      </div>

      <section aria-label="Your matches" className="pb-6">
        {state.status === "loading" && (
          <div className="px-5" role="status" aria-label="Loading matches">
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[124px] w-[92px] shrink-0 animate-pulse rounded-[18px] bg-soft" />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-[20px] bg-soft" />
              ))}
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="mx-5 sticker-hero flex flex-col items-start gap-3 bg-status! p-7" role="alert">
            <p className="display text-[28px]">Couldn&apos;t load matches</p>
            <p className="text-[16px] text-muted">{state.message}</p>
            <button type="button" onClick={() => void load()} className="btn-primary pressable focus-ring mt-1">
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && all.length === 0 && (
          <div data-testid="matches-empty" className="mx-5 sticker-hero flex flex-col items-start gap-3 bg-status! p-7">
            <span className="emoji-tile size-16 text-[34px]" aria-hidden>
              🤫
            </span>
            <p className="display mt-2 text-[30px]">No matches yet</p>
            <p className="text-[17px] leading-[1.45] text-ink/75">
              When someone you like likes you back, they&apos;ll appear here. One-sided likes always stay secret.
            </p>
            <Link href="/discover" className="btn-primary pressable focus-ring mt-3">
              Start discovering
            </Link>
          </div>
        )}

        {fresh.length > 0 && (
          <div>
            <h2 className="micro-label px-5 text-muted">New matches · say hi</h2>
            <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pt-1 pb-3" data-testid="new-matches">
              {fresh.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.04 }}
                  className="shrink-0"
                >
                  <Link
                    href={`/discover/matches/${m.id}`}
                    data-testid="match-item"
                    data-profile-id={m.profile.id}
                    className="focus-ring group flex w-[92px] flex-col items-center gap-1.5 rounded-[18px]"
                  >
                    <span className="relative block h-[116px] w-[92px] overflow-hidden rounded-[18px] border-(length:--bw) border-line bg-reward shadow-(--pop) transition-transform duration-75 group-active:translate-x-[3px] group-active:translate-y-[3px] group-active:shadow-none">
                      <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" eager />
                      {m.sharedInterests.length > 0 && (
                        <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-full border-(length:--bw) border-line bg-accent-soft px-1.5 text-[11px] font-extrabold">
                          <Heart className="size-2.5 fill-accent text-ink" aria-hidden />
                          {m.sharedInterests.length}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate text-[14px] font-bold">{m.profile.name}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {convos.length > 0 && (
          <div className="mt-3 px-5">
            <h2 className="micro-label text-muted">Messages</h2>
            <ul className="mt-3 flex flex-col gap-2.5" data-testid="conversations">
              {convos.map((m) => {
                const last = m.lastMessage!;
                const theirTurn = !last.fromMe;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/discover/matches/${m.id}`}
                      data-testid="match-item"
                      data-profile-id={m.profile.id}
                      className="focus-ring flex items-center gap-3 rounded-[20px] bg-soft p-3 transition-colors hover:bg-hairline"
                    >
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-full border-(length:--bw) border-line">
                        <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" />
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
          </div>
        )}

        {fresh.length > 0 && convos.length === 0 && (
          <p className="mx-5 mt-4 rounded-[20px] bg-soft p-4 text-[14px] font-semibold text-muted">
            Tip: open a match to see conversation starters based on what you have in common
            {fresh[0].sharedInterests.length > 0 ? ` (like ${listInterests(fresh[0].sharedInterests)})` : ""}.
          </p>
        )}
      </section>
    </>
  );
}
