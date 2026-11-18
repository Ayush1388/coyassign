"use client";

import { Heart, HeartHandshake, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { Counts } from "./use-counts";

export type Section = "discover" | "matches" | "liked" | "chats";

/** Discover itself lives in the bottom tab bar, so these are its sub-sections only. */
const TABS = [
  { id: "matches", href: "/discover/matches", label: "Matches", Icon: HeartHandshake, count: (c: Counts) => c.matches },
  // "Liked" = people YOU liked (pending). There is deliberately no "who liked you" tab.
  { id: "liked", href: "/discover/liked", label: "Liked", Icon: Heart, count: (c: Counts) => c.liked },
  { id: "chats", href: "/discover/chats", label: "Chats", Icon: MessageCircle, count: (c: Counts) => c.yourTurn },
] as const;

/**
 * Pill tabs under the header. Soft fills, no outlines: the active one is the pink
 * gradient, the rest are quiet. The keyboard focus ring only appears for keyboard
 * users (:focus-visible), never on tap.
 */
export function SectionTabs({ active, counts }: { active: Section; counts: Counts | null }) {
  return (
    <nav aria-label="Discover sections" className="px-5 pt-0.5 pb-1">
      <ul className="flex gap-1.5">
        {TABS.map(({ id, href, label, Icon, count }) => {
          const isActive = id === active;
          const n = counts ? count(counts) : 0;
          return (
            <li key={id} className="flex-auto">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                data-testid={id === "matches" ? "matches-link" : `tab-${id}`}
                className={`focus-ring relative flex h-11 items-center justify-center gap-1 rounded-full px-2.5 text-[14px] font-bold whitespace-nowrap outline-none transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.97] ${
                  isActive ? "pink-glow" : "bg-soft text-ink hover:bg-hairline"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${isActive ? "fill-current" : "text-accent-strong"}`}
                  strokeWidth={2.2}
                  aria-hidden
                />
                <span>{label}</span>
                {n > 0 && (
                  <span
                    data-testid={id === "matches" ? "match-count" : `count-${id}`}
                    className={`ml-0.5 min-w-[18px] rounded-full px-1 text-center text-[11px] leading-[18px] font-extrabold ${
                      isActive ? "bg-white text-ink" : "bg-accent text-accent-ink"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
