"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useImperativeHandle, useRef, type Ref } from "react";
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
      data-testid="swipe-card"
      data-profile-id={profile.id}
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={false}
    >
      <ProfileCard profile={profile} eager onOpen={onOpen} />

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
