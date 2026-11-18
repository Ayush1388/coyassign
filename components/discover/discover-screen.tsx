"use client";

import { Heart, Info, RotateCcw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type Filters,
  type FilterOptions,
  type MatchDTO,
  type PublicProfile,
  type SwipeAction,
  type SwipeResponse,
} from "@/lib/api";
import { AppHeader } from "@/components/nav/app-header";
import { Photo } from "@/components/ui/photo";
import { activeCount, FiltersSheet, loadFilters, saveFilters } from "./filters-sheet";
import { MatchOverlay } from "./match-overlay";
import { ProfileCard, ProfileCardSkeleton } from "./profile-card";
import { ProfileSheet } from "./profile-sheet";
import { SectionTabs } from "./section-tabs";
import { SwipeCard, type SwipeCardHandle } from "./swipe-card";
import { useCounts } from "./use-counts";

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profiles: PublicProfile[] };

type Toast = { id: number; tone: "like" | "pass" | "error"; text: string; retry?: () => void };

/** The deck: the next card sits behind, tilted and peeking out on the right. The one after waits invisibly. */
const STACK = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
  { x: 16, y: 8, rotate: 5, scale: 0.96, opacity: 1 },
  { x: 16, y: 8, rotate: 5, scale: 0.96, opacity: 0 },
];

export function DiscoverScreen({ canReset }: { canReset: boolean }) {
  const [feed, setFeed] = useState<FeedState>({ status: "loading" });
  const [filters, setFilters] = useState<Filters | null>(null);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [myIntent, setMyIntent] = useState<string | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sheet, setSheet] = useState<"profile" | "filters" | null>(null);
  const { counts, refresh: refreshCounts } = useCounts();
  const cardRef = useRef<SwipeCardHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((t: Omit<Toast, "id">, ms = 1400) => {
    clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const loadFeed = useCallback(async (f: Filters) => {
    setFeed({ status: "loading" });
    try {
      setFeed({ status: "ready", profiles: await api.feed(f) });
    } catch (e) {
      setFeed({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load profiles." });
    }
  }, []);

  // Filters live in localStorage (a UI preference), so read them after mount.
  useEffect(() => {
    setFilters(loadFilters());
    api
      .me()
      .then(({ me, options }) => {
        setMyInterests(me.interests);
        setMyIntent(me.intent);
        setOptions(options);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filters) void loadFeed(filters);
  }, [filters, loadFeed]);

  const profiles = feed.status === "ready" ? feed.profiles : [];
  const top = profiles[0];
  const locked = busy || !!match || !top || sheet !== null;

  const decide = useCallback(
    async (profile: PublicProfile, action: SwipeAction): Promise<SwipeResponse | null> => {
      try {
        return await api.swipe(profile.id, action);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
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
      void refreshCounts();
      if (result.matched) {
        setMatch(result.match);
        setToast(null);
      } else if (action === "LIKE") {
        // A pass needs no toast: the PASS stamp and the card leaving left are feedback enough.
        showToast({ tone: "like", text: `You liked ${profile.name}` });
      }
    },
    [showToast, refreshCounts],
  );

  // Keyboard: ← pass, → like, ↑ open profile.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input,textarea,[contenteditable],[role=dialog]")) return;
      if (e.key === "ArrowRight") cardRef.current?.swipe("LIKE");
      if (e.key === "ArrowLeft") cardRef.current?.swipe("PASS");
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSheet("profile");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  function applyFilters(f: Filters) {
    saveFilters(f);
    setFilters(f);
    setSheet(null);
  }

  async function resetDemo() {
    try {
      await api.resetDemo();
      void refreshCounts();
      if (filters) await loadFeed(filters);
    } catch {
      showToast({ tone: "error", text: "Couldn't reset the demo." }, 3000);
    }
  }

  const filterCount = filters ? activeCount(filters) : 0;
  const filtered = filterCount > 0;
  const attention = counts ? counts.yourTurn + counts.newMatches : 0;

  return (
    <>
      <AppHeader attention={attention} />
      <SectionTabs active="discover" counts={counts} />

      {/* Hero line */}
      <div className="px-5 pt-3 pb-2">
        <h1 className="font-serif text-[31px] leading-[1.05] tracking-[-0.01em] whitespace-nowrap">
          Meet <em className="text-accent-strong">interesting</em> people
        </h1>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-muted">
            Secret likes,{" "}
            <span className="relative inline-block text-ink">
              real
              <svg aria-hidden viewBox="0 0 60 8" className="absolute -bottom-1.5 left-0 h-2 w-full text-accent" preserveAspectRatio="none">
                <path d="M1 5.5C14 1.5 32 1 59 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>{" "}
            chats.
          </p>
          {feed.status === "ready" && profiles.length > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border-(length:--bw) border-hairline bg-surface py-0.5 pr-3 pl-0.5">
              <span className="flex -space-x-2" aria-hidden>
                {profiles.slice(0, 3).map((p) => (
                  <span key={p.id} className="relative size-7 overflow-hidden rounded-full border-2 border-surface">
                    <Photo src={p.photoUrl} name={p.name} className="absolute inset-0 size-full" eager />
                  </span>
                ))}
              </span>
              <p data-testid="remaining" className="text-[12px] font-bold whitespace-nowrap text-muted">
                <strong className="text-[14px] font-extrabold text-ink">{profiles.length}</strong> new{" "}
                {profiles.length === 1 ? "face" : "faces"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* The deck */}
      <section aria-label="Profiles" className="relative mx-auto flex min-h-0 w-full max-w-[370px] flex-1 flex-col px-5 sm:px-0">
        <div className="relative min-h-[360px] max-h-[560px] flex-1 pt-2 pr-5 pb-3">
          <div className="absolute top-2 right-5 bottom-3 left-0">
            {(feed.status === "loading" || filters === null) && <ProfileCardSkeleton />}

            {feed.status === "error" && (
              <div
                className="sticker-hero absolute inset-0 flex flex-col items-center justify-center gap-3 bg-status! p-7 text-center"
                role="alert"
              >
                <span className="emoji-tile size-14 text-3xl" aria-hidden>
                  😵‍💫
                </span>
                <p className="display text-[26px]">Couldn&apos;t load profiles</p>
                <p className="text-[15px] text-muted">{feed.message}</p>
                <button
                  type="button"
                  onClick={() => filters && void loadFeed(filters)}
                  className="btn-primary pressable focus-ring mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {feed.status === "ready" && !top && (
              <EmptyState
                filtered={filtered}
                matchCount={counts?.matches ?? 0}
                canReset={canReset}
                onReset={resetDemo}
                onWiden={() => setSheet("filters")}
              />
            )}

            {profiles
              .slice(0, 3)
              .map((p, i) => ({ p, i }))
              .reverse()
              .map(({ p, i }) =>
                i === 0 ? (
                  <motion.div
                    key={p.id}
                    className="absolute inset-0 z-10"
                    initial={STACK[1]}
                    animate={STACK[0]}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  >
                    <SwipeCard
                      ref={cardRef}
                      profile={p}
                      onDecide={(action) => decide(p, action)}
                      onExit={(action, result) => handleExit(p, action, result)}
                      onBusyChange={setBusy}
                      onOpen={() => setSheet("profile")}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={p.id}
                    aria-hidden
                    data-testid="stack-card"
                    className="pointer-events-none absolute inset-0"
                    style={{ zIndex: 10 - i, transformOrigin: "50% 100%" }}
                    initial={STACK[2]}
                    animate={STACK[i]}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    <ProfileCard profile={p} />
                  </motion.div>
                ),
              )}

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  className={`absolute top-14 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border-(length:--bw) border-line px-4 py-2 text-[14px] font-bold whitespace-nowrap shadow-(--pop) ${
                    toast.tone === "like" ? "bg-accent text-accent-ink" : "bg-surface text-ink"
                  }`}
                  role={toast.tone === "error" ? "alert" : "status"}
                  data-testid="toast"
                >
                  {toast.tone === "like" && <Heart className="size-4 fill-current" aria-hidden />}
                  {toast.tone === "pass" && <X className="size-4" strokeWidth={3} aria-hidden />}
                  {toast.text}
                  {toast.retry && (
                    <button
                      type="button"
                      onClick={() => {
                        setToast(null);
                        toast.retry?.();
                      }}
                      className="focus-ring -my-2 ml-1 min-h-11 px-1 font-extrabold text-accent-strong underline underline-offset-2"
                    >
                      Retry
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Actions: profile · pass · LIKE · filters */}
      <div className="flex items-center justify-center gap-5 pt-3 pb-2">
        <button
          type="button"
          data-testid="info-button"
          aria-label={top ? `Open ${top.name}'s full profile` : "Open profile"}
          disabled={!top || busy || !!match}
          onClick={() => setSheet("profile")}
          className="fab focus-ring size-[50px] text-muted hover:text-ink"
        >
          <Info className="size-[22px]" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          data-testid="pass-button"
          aria-label={top ? `Pass on ${top.name}` : "Pass"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("PASS")}
          className="fab focus-ring size-16"
        >
          <X className="size-8 text-[#f2546b]" strokeWidth={2.75} aria-hidden />
        </button>
        <button
          type="button"
          data-testid="like-button"
          aria-label={top ? `Like ${top.name}` : "Like"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("LIKE")}
          className="fab fab-like focus-ring size-[76px]"
        >
          <Heart className="size-9 fill-white text-white drop-shadow-[0_2px_3px_rgba(150,0,60,0.35)]" strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setSheet("filters")}
          data-testid="filters-button"
          aria-label={filtered ? `Filters (${filterCount} on)` : "Filters"}
          className="fab focus-ring relative size-[50px] text-muted hover:text-ink"
        >
          <SlidersHorizontal className="size-[22px]" strokeWidth={2.2} aria-hidden />
          {filtered && (
            <span
              aria-hidden
              data-testid="filter-count"
              className="absolute -top-1 -right-1 min-w-[20px] rounded-full border-2 border-surface bg-accent px-1 text-center text-[11px] leading-[16px] font-extrabold text-accent-ink"
            >
              {filterCount}
            </span>
          )}
        </button>
      </div>
      <p className="hidden pb-2 text-center text-[12px] font-semibold text-muted pointer-fine:block" aria-hidden>
        Drag, or use ← pass · → like · ↑ profile
      </p>

      <ProfileSheet
        profile={top ?? null}
        open={sheet === "profile" && !!top}
        onClose={() => setSheet(null)}
        onDecide={(action) => {
          setSheet(null);
          // Let the sheet close first so the card animation is visible.
          setTimeout(() => cardRef.current?.swipe(action), 180);
        }}
      />
      <FiltersSheet
        open={sheet === "filters"}
        value={filters ?? {}}
        myInterests={myInterests}
        myIntent={myIntent}
        options={options}
        onClose={() => setSheet(null)}
        onApply={applyFilters}
      />

      <AnimatePresence>{match && <MatchOverlay match={match} onClose={() => setMatch(null)} />}</AnimatePresence>
    </>
  );
}

/** Lilac = Coy's status surface (same as its "No one has added you yet" card). */
function EmptyState({
  filtered,
  matchCount,
  canReset,
  onReset,
  onWiden,
}: {
  filtered: boolean;
  matchCount: number;
  canReset: boolean;
  onReset: () => void;
  onWiden: () => void;
}) {
  return (
    <div
      data-testid="empty-state"
      className="sticker-hero absolute inset-0 flex flex-col items-start justify-center gap-3 bg-status! p-6"
    >
      <span className="emoji-tile size-14 text-[30px]" aria-hidden>
        {filtered ? "🔭" : "👀"}
      </span>
      <h2 className="display mt-1 text-[30px]">{filtered ? "No one fits your filters" : "You're all caught up"}</h2>
      <p className="text-[16px] leading-[1.45] text-ink/75">
        {filtered
          ? "Try a wider distance or age range. Good matches are often just outside it."
          : "New faces will show up here as people join. Your likes stay secret unless they like you back."}
      </p>
      {filtered ? (
        <button type="button" onClick={onWiden} className="btn-primary pressable focus-ring mt-2">
          <SlidersHorizontal className="size-[18px]" aria-hidden /> Widen filters
        </button>
      ) : (
        <Link href="/discover/matches" className="btn-primary pressable focus-ring mt-2">
          <Sparkles className="size-[18px]" aria-hidden />
          {matchCount > 0 ? `See your ${matchCount} ${matchCount === 1 ? "match" : "matches"}` : "See matches"}
        </Link>
      )}
      {canReset && !filtered && (
        <button
          type="button"
          onClick={onReset}
          data-testid="reset-demo"
          className="focus-ring inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-muted underline underline-offset-4 hover:text-ink"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset demo
        </button>
      )}
    </div>
  );
}
