"use client";

import { Heart, RotateCcw, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type MatchDTO, type PublicProfile, type SwipeAction, type SwipeResponse } from "@/lib/api";
import { AppHeader } from "@/components/nav/app-header";
import { MatchOverlay } from "./match-overlay";
import { ProfileCard, ProfileCardSkeleton } from "./profile-card";
import { SwipeCard, type SwipeCardHandle } from "./swipe-card";

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profiles: PublicProfile[] };

type Toast = { id: number; tone: "like" | "pass" | "error"; text: string; retry?: () => void };

export function DiscoverScreen({ canReset }: { canReset: boolean }) {
  const [feed, setFeed] = useState<FeedState>({ status: "loading" });
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((t: Omit<Toast, "id">, ms = 1400) => {
    clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const loadFeed = useCallback(async () => {
    setFeed({ status: "loading" });
    try {
      setFeed({ status: "ready", profiles: await api.feed() });
    } catch (e) {
      setFeed({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load profiles." });
    }
  }, []);

  const loadMatchCount = useCallback(async () => {
    try {
      setMatchCount((await api.matches()).length);
    } catch {
      setMatchCount(null); // the badge is optional and the Matches screen has its own retry
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    void loadMatchCount();
  }, [loadFeed, loadMatchCount]);

  const profiles = feed.status === "ready" ? feed.profiles : [];
  const top = profiles[0];
  const next = profiles[1];
  const locked = busy || !!match || !top;

  // Server round trip. Returns null on failure so the card springs back and nothing is lost.
  const decide = useCallback(
    async (profile: PublicProfile, action: SwipeAction): Promise<SwipeResponse | null> => {
      try {
        return await api.swipe(profile.id, action);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
          // Already recorded (e.g. from another tab) or gone: drop the card, nothing to retry.
          return { success: true, matched: false, match: null };
        }
        showToast(
          {
            tone: "error",
            text: e instanceof ApiError && e.status === 0 ? "You're offline. Try again." : "Couldn't save that. Try again.",
            retry: () => cardRef.current?.swipe(action),
          },
          4000,
        );
        return null;
      }
    },
    [showToast],
  );

  const handleExit = useCallback(
    (profile: PublicProfile, action: SwipeAction, result: SwipeResponse) => {
      setFeed((f) => (f.status === "ready" ? { ...f, profiles: f.profiles.filter((p) => p.id !== profile.id) } : f));
      setBusy(false);
      if (result.matched) {
        setMatch(result.match);
        setMatchCount((c) => (c ?? 0) + 1);
        setToast(null);
      } else {
        showToast({
          tone: action === "LIKE" ? "like" : "pass",
          text: action === "LIKE" ? `You liked ${profile.name}` : `Passed on ${profile.name}`,
        });
      }
    },
    [showToast],
  );

  // Keyboard: ← pass, → like (desktop and accessibility).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowRight") cardRef.current?.swipe("LIKE");
      if (e.key === "ArrowLeft") cardRef.current?.swipe("PASS");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  async function resetDemo() {
    try {
      await api.resetDemo();
      setMatchCount(0);
      await loadFeed();
    } catch {
      showToast({ tone: "error", text: "Couldn't reset the demo." }, 3000);
    }
  }

  return (
    <>
      <AppHeader>
        <Link
          href="/discover/matches"
          data-testid="matches-link"
          className="sticker-sm pressable focus-ring relative flex h-10 items-center gap-1.5 rounded-full! px-3 text-sm font-semibold"
        >
          <Heart className="size-4 fill-accent text-accent" aria-hidden />
          Matches
          {!!matchCount && (
            <span
              data-testid="match-count"
              className="ml-0.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-xs leading-5 font-bold text-accent-ink"
            >
              {matchCount}
            </span>
          )}
        </Link>
      </AppHeader>

      <div className="flex items-baseline justify-between px-4 pt-2 pb-3">
        <h1 className="display text-[34px]">Discover</h1>
        {feed.status === "ready" && profiles.length > 0 && (
          <p className="text-sm font-medium text-muted" data-testid="remaining">
            {profiles.length} new {profiles.length === 1 ? "face" : "faces"}
          </p>
        )}
      </div>

      <section aria-label="Profiles" className="relative mx-4 min-h-[420px] flex-1">
        {feed.status === "loading" && (
          <div className="absolute inset-0">
            <ProfileCardSkeleton />
          </div>
        )}

        {feed.status === "error" && (
          <div className="sticker absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
            <p className="display text-2xl">Couldn&apos;t load profiles</p>
            <p className="text-sm text-muted">{feed.message}</p>
            <button
              type="button"
              onClick={() => void loadFeed()}
              className="sticker-sm pressable focus-ring h-11 rounded-full! bg-accent! px-6 font-bold text-accent-ink"
            >
              Try again
            </button>
          </div>
        )}

        {feed.status === "ready" && !top && (
          <EmptyState matchCount={matchCount ?? 0} canReset={canReset} onReset={resetDemo} />
        )}

        {next && (
          <motion.div
            key={`under-${next.id}`}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ scale: 0.9, y: 18, opacity: 0 }}
            animate={{ scale: 0.95, y: 14, opacity: 1 }}
          >
            <ProfileCard profile={next} />
          </motion.div>
        )}

        {top && (
          <motion.div
            key={top.id}
            className="absolute inset-0"
            initial={{ scale: 0.95, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <SwipeCard
              ref={cardRef}
              profile={top}
              onDecide={(action) => decide(top, action)}
              onExit={(action, result) => handleExit(top, action, result)}
              onBusyChange={setBusy}
            />
          </motion.div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`sticker-sm absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full! px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                toast.tone === "like" ? "bg-accent! text-accent-ink" : ""
              }`}
              role={toast.tone === "error" ? "alert" : "status"}
              data-testid="toast"
            >
              {toast.tone === "like" && <Heart className="size-4 fill-current" aria-hidden />}
              {toast.tone === "pass" && <X className="size-4" aria-hidden />}
              {toast.text}
              {toast.retry && (
                <button
                  type="button"
                  onClick={() => {
                    setToast(null);
                    toast.retry?.();
                  }}
                  className="focus-ring ml-1 font-bold text-accent underline"
                >
                  Retry
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="flex items-center justify-center gap-6 pt-5 pb-3">
        <button
          type="button"
          data-testid="pass-button"
          aria-label={top ? `Pass on ${top.name}` : "Pass"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("PASS")}
          className="sticker pressable focus-ring flex size-16 items-center justify-center rounded-full!"
        >
          <X className="size-7" strokeWidth={2.8} aria-hidden />
        </button>
        <button
          type="button"
          data-testid="like-button"
          aria-label={top ? `Like ${top.name}` : "Like"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("LIKE")}
          className="sticker pressable focus-ring flex size-[72px] items-center justify-center rounded-full! bg-accent! text-accent-ink"
        >
          <Heart className="size-8 fill-current" aria-hidden />
        </button>
      </div>
      <p className="hidden pb-2 text-center text-xs text-muted pointer-fine:block" aria-hidden>
        Tip: use ← and → to pass or like
      </p>

      <AnimatePresence>{match && <MatchOverlay match={match} onClose={() => setMatch(null)} />}</AnimatePresence>
    </>
  );
}

function EmptyState({ matchCount, canReset, onReset }: { matchCount: number; canReset: boolean; onReset: () => void }) {
  return (
    <div
      data-testid="empty-state"
      className="sticker absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center"
      style={{ background: "var(--tint-1)" }}
    >
      <div className="text-6xl" aria-hidden>
        👀
      </div>
      <h2 className="display text-[30px]">You&apos;re all caught up</h2>
      <p className="max-w-[260px] text-[15px] text-ink/75">
        New faces will show up here as people join. Your likes stay private unless they like you back.
      </p>
      <Link
        href="/discover/matches"
        className="sticker-sm pressable focus-ring mt-2 flex h-11 items-center gap-2 rounded-full! bg-accent! px-6 font-bold text-accent-ink"
      >
        <Sparkles className="size-4" aria-hidden />
        {matchCount > 0 ? `See your ${matchCount} ${matchCount === 1 ? "match" : "matches"}` : "See matches"}
      </Link>
      {canReset && (
        <button
          type="button"
          onClick={onReset}
          data-testid="reset-demo"
          className="focus-ring mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset demo
        </button>
      )}
    </div>
  );
}
