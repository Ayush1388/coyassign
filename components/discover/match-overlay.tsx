"use client";

import { Heart, Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { MatchDTO } from "@/lib/api";
import { Photo } from "@/components/ui/photo";

const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const r = 120 + (i % 3) * 30;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, d: (i % 4) * 0.04 };
});

/**
 * Shown only when POST /swipe returns matched: true; the client never infers a match.
 * Yellow card = Coy's "news about you" surface (same as its "Someone has a crush on you" card).
 */
export function MatchOverlay({ match, onClose }: { match: MatchDTO; onClose: () => void }) {
  const reduce = useReducedMotion();
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      data-testid="match-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.div
        className="sticker-hero relative w-full max-w-[440px] bg-news! px-6 pt-7 pb-6"
        initial={reduce ? false : { scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 24 }}
      >
        {!reduce &&
          BURST.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute top-[128px] left-1/2 text-accent"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: b.x, y: b.y, scale: 1, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.15 + b.d, ease: "easeOut" }}
            >
              <Heart className="size-4 fill-current stroke-ink" strokeWidth={1.5} />
            </motion.span>
          ))}

        <p className="micro-label inline-flex items-center gap-1.5 rounded-full border-(length:--bw) border-line bg-surface px-3 py-1">
          <Lock className="size-3" aria-hidden /> Mutual
        </p>

        <div className="relative mx-auto my-5 flex h-[132px] w-[236px] items-center justify-center">
          <motion.div
            className="absolute left-0 size-[120px] -rotate-6 overflow-hidden rounded-[20px] border-(length:--bw) border-line bg-accent shadow-(--pop)"
            initial={reduce ? false : { x: -40, rotate: -20, opacity: 0 }}
            animate={{ x: 0, rotate: -6, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
          >
            <div className="flex size-full items-center justify-center">
              <span className="display text-[28px] text-accent-ink">You</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute right-0 size-[120px] rotate-6 overflow-hidden rounded-[20px] border-(length:--bw) border-line shadow-(--pop)"
            initial={reduce ? false : { x: 40, rotate: 20, opacity: 0 }}
            animate={{ x: 0, rotate: 6, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          >
            <Photo src={match.profile.photoUrl} name={match.profile.name} className="size-full" eager />
          </motion.div>
          <motion.div
            className="relative z-10 flex size-12 items-center justify-center rounded-full border-(length:--bw) border-line bg-surface"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Heart className="size-6 fill-accent text-ink" strokeWidth={1.75} aria-hidden />
          </motion.div>
        </div>

        <h2 id="match-title" className="display text-[44px]">
          It&apos;s a match!
        </h2>
        <p className="mt-2 text-[19px] leading-[1.45] text-ink/75">
          You and <strong className="font-bold text-ink">{match.profile.name}</strong> liked each other. Only the two of
          you know.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button ref={primary} type="button" onClick={onClose} className="btn-primary pressable focus-ring w-full">
            Keep swiping
          </button>
          <Link href="/discover/matches" className="btn-secondary pressable focus-ring w-full">
            See matches
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
