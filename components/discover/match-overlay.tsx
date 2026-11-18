"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { MatchDTO } from "@/lib/api";
import { listInterests } from "@/lib/format";
import { Photo } from "@/components/ui/photo";

/**
 * Shown only when POST /swipe returns matched: true; the client never infers a match.
 * Deliberately quiet: one dark card, white text, two photos, one pink button.
 */
export function MatchOverlay({ match, onClose }: { match: MatchDTO; onClose: () => void }) {
  const reduce = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the dialog itself (no visible ring) so Esc and Tab work, instead of
    // focusing a button, which drew a heavy outline around it on open.
    card.current?.focus();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.div
        ref={card}
        tabIndex={-1}
        className="w-full max-w-[360px] rounded-[28px] bg-[#16131c] px-6 pt-8 pb-6 text-center text-white shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)] outline-none"
        initial={reduce ? false : { scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
      >
        <div className="relative mx-auto flex h-[96px] w-[184px] items-center justify-center">
          <motion.div
            className="absolute left-0 flex size-[88px] -rotate-6 items-center justify-center rounded-[20px] bg-accent-strong"
            initial={reduce ? false : { x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
          >
            <span className="display text-[24px] text-white">You</span>
          </motion.div>
          <motion.div
            className="absolute right-0 size-[88px] rotate-6 overflow-hidden rounded-[20px]"
            initial={reduce ? false : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <Photo src={match.profile.photoUrl} name={match.profile.name} className="size-full" eager />
          </motion.div>
          <span className="relative z-10 flex size-9 items-center justify-center rounded-full bg-white">
            <Heart className="size-[18px] fill-accent-strong text-accent-strong" aria-hidden />
          </span>
        </div>

        <h2 id="match-title" className="display mt-6 text-[34px] text-white">
          It&apos;s a match!
        </h2>
        <p className="mt-2 text-[16px] leading-[1.45] text-white/75">
          You and <strong className="font-bold text-white">{match.profile.name}</strong> liked each other.
        </p>
        {match.sharedInterests.length > 0 && (
          <p className="mt-1 text-[14px] font-medium text-white/60">You both like {listInterests(match.sharedInterests)}</p>
        )}

        <div className="mt-7 flex flex-col gap-1.5">
          <Link href={`/discover/matches/${match.id}`} className="pill-primary focus-ring h-12 w-full" data-testid="send-message">
            Send a message
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring h-11 w-full rounded-full text-[15px] font-semibold text-white/75 transition-colors hover:text-white"
          >
            Keep swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
