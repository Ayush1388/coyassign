"use client";

import { Heart, Lock, RotateCcw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type Filters,
  type MatchDTO,
  type PublicProfile,
  type SwipeAction,
  type SwipeResponse,
} from "@/lib/api";
import { AppHeader } from "@/components/nav/app-header";
import { FiltersSheet, isFiltered, loadFilters, saveFilters } from "./filters-sheet";
import { MatchOverlay } from "./match-overlay";
import { ProfileCard, ProfileCardSkeleton } from "./profile-card";
import { ProfileSheet } from "./profile-sheet";
import { SwipeCard, type SwipeCardHandle } from "./swipe-card";

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profiles: PublicProfile[] };

type Toast = { id: number; tone: "like" | "pass" | "error"; text: string; retry?: () => void };

/**
 * How the cards behind the top one sit: a neat deck peeking out a little from the
 * TOP-RIGHT corner of the top card. Same size, untilted, evenly offset.
 */
const STACK = [
  { x: 0, y: 0 },
  { x: 8, y: -8 },
  { x: 16, y: -16 },
];

export function DiscoverScreen({ canReset }: { canReset: boolean }) {
  const [feed, setFeed] = useState<FeedState>({ status: "loading" });
  const [filters, setFilters] = useState<Filters | null>(null);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sheet, setSheet] = useState<"profile" | "filters" | null>(null);
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
    api.matches().then((m) => setMatchCount(m.length)).catch(() => setMatchCount(null));
    api.me().then((me) => setMyInterests(me.interests)).catch(() => {});
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
      setMatchCount(0);
      if (filters) await loadFeed(filters);
    } catch {
      showToast({ tone: "error", text: "Couldn't reset the demo." }, 3000);
    }
  }

  const filtered = filters ? isFiltered(filters) : false;

  return (
    <>
      <AppHeader>
        <Link
          href="/discover/matches"
          data-testid="matches-link"
          aria-label={matchCount ? `Matches, ${matchCount}` : "Matches"}
          className="btn-soft focus-ring px-3.5"
        >
          <Heart className="size-[18px] fill-accent text-accent-strong" aria-hidden />
          Matches
          {!!matchCount && (
            <span
              data-testid="match-count"
              className="min-w-[22px] rounded-full border-(length:--bw) border-line bg-accent px-1.5 text-center text-[12px] leading-[18px] font-extrabold text-accent-ink"
            >
              {matchCount}
            </span>
          )}
        </Link>
      </AppHeader>

      <div className="px-5 pt-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="display text-[36px]">Discover</h1>
          <button
            type="button"
            onClick={() => setSheet("filters")}
            data-testid="filters-button"
            aria-label={filtered ? "Filters (on)" : "Filters"}
            className="btn-soft focus-ring relative px-3.5"
          >
            <SlidersHorizontal className="size-[18px]" aria-hidden />
            Filters
            {filtered && (
              <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-bg bg-accent" />
            )}
          </button>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          <span>
            Likes stay secret unless it&apos;s mutual
            {feed.status === "ready" && profiles.length > 0 && (
              <>
                {" · "}
                <span data-testid="remaining">
                  {profiles.length} new {profiles.length === 1 ? "face" : "faces"}
                </span>
              </>
            )}
          </span>
        </p>
      </div>

      {/* The deck: narrower than the screen, with the next cards visibly stacked behind. */}
      <section aria-label="Profiles" className="relative mx-auto w-full max-w-[350px] flex-1 px-5 sm:px-0">
        <div className="relative h-full min-h-[440px] max-h-[540px] pt-4 pr-4">
          <div className="absolute top-4 right-4 bottom-0 left-0">
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
                matchCount={matchCount ?? 0}
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
                    style={{ zIndex: 10 - i }}
                    initial={{ ...STACK[Math.min(i + 1, 2)], opacity: i === 2 ? 0 : 1 }}
                    animate={{ ...STACK[i], opacity: 1 }}
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
                  className={`absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border-(length:--bw) border-line px-4 py-2 text-[14px] font-bold whitespace-nowrap shadow-(--pop) ${
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

      <div className="flex items-center justify-center gap-7 pt-3 pb-2">
        <button
          type="button"
          data-testid="pass-button"
          aria-label={top ? `Pass on ${top.name}` : "Pass"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("PASS")}
          className="sticker pressable focus-ring flex size-16 items-center justify-center rounded-full!"
        >
          <X className="size-7" strokeWidth={3} aria-hidden />
        </button>
        <button
          type="button"
          data-testid="like-button"
          aria-label={top ? `Like ${top.name}` : "Like"}
          disabled={locked}
          onClick={() => cardRef.current?.swipe("LIKE")}
          className="sticker pressable focus-ring flex size-[72px] items-center justify-center rounded-full! bg-accent!"
        >
          <Heart className="size-8 fill-surface text-ink" strokeWidth={2} aria-hidden />
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
