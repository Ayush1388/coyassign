"use client";

import Link from "next/link";
import type { Counts } from "./use-counts";

export type Section = "discover" | "matches" | "liked" | "chats";

const TABS = [
  { id: "discover", href: "/discover", label: "Discover", count: () => 0 },
  { id: "matches", href: "/discover/matches", label: "Matches", count: (c: Counts) => c.matches },
  // "Liked" = people YOU liked (pending). There is deliberately no "who liked you" tab.
  { id: "liked", href: "/discover/liked", label: "Liked", count: (c: Counts) => c.liked },
  { id: "chats", href: "/discover/chats", label: "Chats", count: (c: Counts) => c.yourTurn },
] as const;

/** Pill tabs under the header (Discover / Matches / Liked / Chats). Scrolls sideways on narrow phones. */
export function SectionTabs({ active, counts }: { active: Section; counts: Counts | null }) {
  return (
    <nav aria-label="Discover sections" className="px-5 pt-0.5 pb-1">
      <ul className="grid grid-cols-4 gap-1.5">
        {TABS.map(({ id, href, label, count }) => {
          const isActive = id === active;
          const n = counts ? count(counts) : 0;
          return (
            <li key={id} className="min-w-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                data-testid={id === "matches" ? "matches-link" : `tab-${id}`}
                className={`focus-ring relative flex h-11 items-center justify-center gap-1 rounded-full px-1 text-[14px] font-bold whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? "pink-glow border-(length:--bw) border-line"
                    : "border-(length:--bw) border-hairline bg-surface text-ink hover:border-line"
                }`}
              >
                <span className="truncate">{label}</span>
                {n > 0 && (
                  <span
                    data-testid={id === "matches" ? "match-count" : `count-${id}`}
                    aria-label={`${n}`}
                    className="absolute -top-1.5 -right-0.5 min-w-[20px] rounded-full border-2 border-bg bg-accent px-1 text-center text-[11px] leading-[16px] font-extrabold text-accent-ink"
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
