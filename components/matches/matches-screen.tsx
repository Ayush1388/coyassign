"use client";

import { ArrowLeft, Heart, MapPin } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type MatchDTO } from "@/lib/api";
import { AppHeader } from "@/components/nav/app-header";
import { Photo } from "@/components/ui/photo";
import { tintFor } from "@/components/discover/profile-card";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; matches: MatchDTO[] };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

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

  return (
    <>
      <AppHeader />
      <div className="flex items-center gap-3 px-4 pt-2 pb-4">
        <Link
          href="/discover"
          aria-label="Back to Discover"
          className="sticker-sm pressable focus-ring flex size-10 items-center justify-center rounded-full!"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="display text-[34px]">Matches</h1>
        {state.status === "ready" && state.matches.length > 0 && (
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-accent-ink">
            {state.matches.length}
          </span>
        )}
      </div>

      <section aria-label="Your matches" className="px-4">
        {state.status === "loading" && (
          <ul className="grid grid-cols-2 gap-4" role="status" aria-label="Loading matches">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="sticker aspect-[3/4] animate-pulse bg-surface-2!" />
            ))}
          </ul>
        )}

        {state.status === "error" && (
          <div className="sticker flex flex-col items-center gap-3 p-8 text-center" role="alert">
            <p className="display text-2xl">Couldn&apos;t load matches</p>
            <p className="text-sm text-muted">{state.message}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="sticker-sm pressable focus-ring h-11 rounded-full! bg-accent! px-6 font-bold text-accent-ink"
            >
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.matches.length === 0 && (
          <div
            data-testid="matches-empty"
            className="sticker flex flex-col items-center gap-3 p-8 text-center"
            style={{ background: "var(--tint-1)" }}
          >
            <div className="text-5xl" aria-hidden>
              🤫
            </div>
            <p className="display text-[26px]">No matches yet</p>
            <p className="max-w-[270px] text-[15px] text-ink/75">
              When someone you like likes you back, they&apos;ll appear here. One-sided likes always stay secret.
            </p>
            <Link
              href="/discover"
              className="sticker-sm pressable focus-ring mt-2 flex h-11 items-center rounded-full! bg-accent! px-6 font-bold text-accent-ink"
            >
              Start discovering
            </Link>
          </div>
        )}

        {state.status === "ready" && state.matches.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 pb-4" data-testid="matches-list">
            {state.matches.map((m, i) => (
              <motion.li
                key={m.id}
                data-testid="match-item"
                data-profile-id={m.profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="sticker flex flex-col overflow-hidden"
                style={{ background: tintFor(m.profile.id) }}
              >
                <div className="relative aspect-square border-b-(length:--bw) border-line">
                  <Photo src={m.profile.photoUrl} name={m.profile.name} className="absolute inset-0 size-full" />
                  <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border-(length:--bw) border-line bg-surface">
                    <Heart className="size-4 fill-accent text-accent" aria-hidden />
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <p className="display text-xl">
                    {m.profile.name}
                    <span className="font-sans text-base font-medium tracking-normal text-muted">, {m.profile.age}</span>
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs font-medium text-ink/75">
                    <MapPin className="size-3.5 shrink-0" aria-hidden /> {m.profile.city}
                  </p>
                  <p className="mt-1 text-xs font-bold text-accent">Matched · {dateFmt.format(new Date(m.createdAt))}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
