"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import type { PublicProfile, SwipeAction, SwipeResponse } from "@/lib/api";
import { ProfileCard } from "./profile-card";

export type SwipeCardHandle = { swipe: (action: SwipeAction) => void };

const DISTANCE_THRESHOLD = 110; // px of drag needed to commit
const VELOCITY_THRESHOLD = 650; // px/s: a quick flick also commits

type Props = {
  profile: PublicProfile;
  ref?: Ref<SwipeCardHandle>;
  /** Persists the decision. Resolves to the server response, or null if it failed. */
  onDecide: (action: SwipeAction) => Promise<SwipeResponse | null>;
  /** Called once the card has fully left the screen and the server confirmed the swipe. */
  onExit: (action: SwipeAction, result: SwipeResponse) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Opens the full profile sheet. */
  onOpen?: () => void;
};

/**
 * The draggable top card.
 * - It follows the pointer and rotates slightly. LIKE and PASS stamps fade in with distance.
 * - Past the threshold it flies off while the request runs, so the UI never waits on the network.
 * - If the server rejects or fails, it springs back and the profile is NOT lost.
 * - A ref guard makes double taps, double drags and key repeats send exactly one request.
 */
export function SwipeCard({ profile, ref, onDecide, onExit, onBusyChange, onOpen }: Props) {
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const rotate = useTransform(x, [-260, 0, 260], reduceMotion ? [0, 0, 0] : [-12, 0, 12]);
  const likeOpacity = useTransform(x, [20, DISTANCE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-DISTANCE_THRESHOLD, -20], [1, 0]);
  const busy = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoCount = Math.max(1, profile.photos.length);

  /** Where the pointer went down, so a drag that ends in a "click" isn't treated as a tap. */
  const down = useRef<{ x: number; y: number } | null>(null);

  /**
   * Tap (not drag): the info area opens the full profile; the left or right of the
   * photo goes to the previous or next photo (Tinder-style).
   */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const start = down.current;
    down.current = null;
    if (busy.current || !start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return; // it was a drag
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    if (target.closest("[data-zone=info]") || photoCount === 1) {
      onOpen?.();
      return;
    }
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    const goBack = e.clientX - rect.left < rect.width / 2;
    setPhotoIndex((i) => (goBack ? Math.max(0, i - 1) : Math.min(photoCount - 1, i + 1)));
  }

  async function commit(action: SwipeAction) {
    if (busy.current) return;
    busy.current = true;
    onBusyChange?.(true);

    const dir = action === "LIKE" ? 1 : -1;
    const offscreen = dir * (Math.max(window.innerWidth, 480) + 120);
    const fly = animate(x, offscreen, { duration: reduceMotion ? 0.01 : 0.32, ease: [0.4, 0, 0.6, 1] });

    const result = await onDecide(action);
    await fly;

    if (result) {
      onExit(action, result); // parent removes this card; keep busy until unmount
      return;
    }
    // Unlock as soon as the spring-back starts, so a quick Retry isn't swallowed.
    // A new swipe's animation simply takes over this one.
    animate(x, 0, { type: "spring", stiffness: 380, damping: 28 });
    busy.current = false;
    onBusyChange?.(false);
  }

  useImperativeHandle(ref, () => ({ swipe: (action) => void commit(action) }));

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    if (offset.x > DISTANCE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) void commit("LIKE");
    else if (offset.x < -DISTANCE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) void commit("PASS");
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
  }

  return (
    <motion.div
      ref={root}
      data-testid="swipe-card"
      data-profile-id={profile.id}
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onPointerDownCapture={(e) => (down.current = { x: e.clientX, y: e.clientY })}
      onClick={handleClick}
      initial={false}
    >
      <ProfileCard profile={profile} eager onOpen={onOpen} photoIndex={photoIndex} />

      <motion.div
        aria-hidden
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-6 left-5 -rotate-12 rounded-2xl border-(length:--bw) border-line bg-accent px-4 py-1.5 shadow-(--pop)"
      >
        <span className="display text-[30px] text-accent-ink">LIKE</span>
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute top-6 right-5 rotate-12 rounded-2xl border-(length:--bw) border-line bg-surface px-4 py-1.5 shadow-(--pop)"
      >
        <span className="display text-[30px] text-ink">PASS</span>
      </motion.div>
    </motion.div>
  );
}
