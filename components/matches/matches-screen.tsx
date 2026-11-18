"use client";

import { ArrowLeft, Heart, MapPin } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type MatchDTO } from "@/lib/api";
import { AppHeader } from "@/components/nav/app-header";
import { Photo } from "@/components/ui/photo";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; matches: MatchDTO[] };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** Matches are what you earned, so they use mint, Coy's reward surface. */
export function MatchesScreen() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", matches: await api.matches() });
    } catch (e) {
      setState({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load matches." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const count = state.status === "ready" ? state.matches.length : 0;

  return (
    <>
      <AppHeader />
      <div className="px-5 pt-3 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/discover" aria-label="Back to Discover" className="btn-soft focus-ring">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="display text-[40px]">Matches</h1>
          {count > 0 && (
            <span className="ml-auto rounded-full bg-soft px-3 py-1 text-[13px] font-bold text-muted">{count} mutual</span>
          )}
        </div>
        <p className="mt-2 text-[14px] font-semibold text-muted">Only people who liked you back. One-sided likes never show up.</p>
      </div>

      <section aria-label="Your matches" className="px-5 pb-6">
        {state.status === "loading" && (
          <ul className="grid grid-cols-2 gap-4" role="status" aria-label="Loading matches">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="aspect-[3/4] animate-pulse rounded-[20px] bg-soft" />
            ))}
          </ul>
        )}

        {state.status === "error" && (
          <div className="sticker-hero flex flex-col items-start gap-3 bg-status! p-7" role="alert">
            <p className="display text-[28px]">Couldn&apos;t load matches</p>
            <p className="text-[16px] text-muted">{state.message}</p>
            <button type="button" onClick={() => void load()} className="btn-primary pressable focus-ring mt-1">
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.matches.length === 0 && (
          <div data-testid="matches-empty" className="sticker-hero flex flex-col items-start gap-3 bg-status! p-7">
            <span className="emoji-tile size-16 text-[34px]" aria-hidden>
              🤫
            </span>
            <p className="display mt-2 text-[32px]">No matches yet</p>
            <p className="max-w-[300px] text-[17px] leading-[1.45] text-ink/75">
              When someone you like likes you back, they&apos;ll appear here. One-sided likes always stay secret.
            </p>
            <Link href="/discover" className="btn-primary pressable focus-ring mt-3">
              Start discovering
            </Link>
          </div>
        )}

        {state.status === "ready" && state.matches.length > 0 && (
          <ul className="grid grid-cols-2 gap-4" data-testid="matches-list">
            {state.matches.map((m, i) => (
              <motion.li
                key={m.id}
                data-testid="match-item"
                data-profile-id={m.profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25, ease: "easeOut" }}
                className="sticker flex flex-col overflow-hidden"
              >
                <div className="relative aspect-square border-b-(length:--bw) border-line bg-soft">
                  <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" />
                  <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border-(length:--bw) border-line bg-surface">
                    <Heart className="size-4 fill-accent text-ink" strokeWidth={1.75} aria-hidden />
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 bg-reward px-3 pt-2.5 pb-3">
                  <p className="display text-[20px]">
                    {m.profile.name}
                    <span className="text-[16px] font-semibold tracking-normal text-muted">, {m.profile.age}</span>
                  </p>
                  <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-ink/70">
                    <MapPin className="size-3.5 shrink-0" aria-hidden /> {m.profile.city}
                  </p>
                  <p className="micro-label mt-1 text-[11px] text-ink">Matched · {dateFmt.format(new Date(m.createdAt))}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
