"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type MatchDTO } from "@/lib/api";

export type Counts = { matches: number; liked: number; yourTurn: number; newMatches: number };

/** Live counts for the section tabs and the bell. Refreshes in the background. */
export function useCounts(pollMs = 5000) {
  const [counts, setCounts] = useState<Counts | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [matches, liked] = await Promise.all([api.matches(), api.sentLikes()]);
      setCounts(summarise(matches, liked.length));
    } catch {
      /* counts are decorative; keep the last good value */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => document.visibilityState === "visible" && void refresh(), pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { counts, refresh, setCounts };
}

export function summarise(matches: MatchDTO[], liked: number): Counts {
  return {
    matches: matches.length,
    liked,
    yourTurn: matches.filter((m) => m.lastMessage && !m.lastMessage.fromMe).length,
    newMatches: matches.filter((m) => !m.lastMessage).length,
  };
}
