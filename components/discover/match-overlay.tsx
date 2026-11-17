"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { MatchDTO } from "@/lib/api";
import { Photo } from "@/components/ui/photo";

const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return { x: Math.cos(angle) * (120 + (i % 3) * 30), y: Math.sin(angle) * (120 + (i % 3) * 30), d: (i % 4) * 0.04 };
});

/**
 * Shown only when POST /swipe returns matched: true. The client never infers a match.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="sticker relative w-full max-w-[400px] overflow-visible px-6 pt-8 pb-6 text-center"
        style={{ background: "var(--tint-0)" }}
        initial={reduce ? false : { scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        {!reduce &&
          BURST.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute top-[118px] left-1/2 text-accent"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: b.x, y: b.y, scale: 1, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.15 + b.d, ease: "easeOut" }}
            >
              <Heart className="size-4 fill-current" />
            </motion.span>
          ))}

        <div className="relative mx-auto mb-5 flex h-[130px] w-[230px] items-center justify-center">
          <motion.div
            className="absolute left-0 size-[120px] -rotate-6 overflow-hidden rounded-[22px] border-(length:--bw) border-line shadow-(--shadow-sm)"
            initial={reduce ? false : { x: -40, rotate: -20, opacity: 0 }}
            animate={{ x: 0, rotate: -6, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
          >
            <div className="flex size-full items-center justify-center bg-accent text-accent-ink">
              <span className="display text-2xl">You</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute right-0 size-[120px] rotate-6 overflow-hidden rounded-[22px] border-(length:--bw) border-line shadow-(--shadow-sm)"
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
            transition={{ delay: 0.3, duration: 0.45 }}
          >
            <Heart className="size-6 fill-accent text-accent" aria-hidden />
          </motion.div>
        </div>

        <h2 id="match-title" className="display text-[40px]">
          It&apos;s a match!
        </h2>
        <p className="mx-auto mt-2 max-w-[280px] text-[15px] text-ink/80">
          You and <strong>{match.profile.name}</strong> liked each other. Only the two of you know.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            ref={primary}
            type="button"
            onClick={onClose}
            className="sticker-sm pressable focus-ring h-12 rounded-full! bg-accent! font-bold text-accent-ink"
          >
            Keep swiping
          </button>
          <Link
            href="/discover/matches"
            className="sticker-sm pressable focus-ring flex h-12 items-center justify-center rounded-full! font-bold"
          >
            See matches
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
