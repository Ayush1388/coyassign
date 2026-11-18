"use client";

import { Bell, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type MatchDTO } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { Sheet } from "@/components/ui/sheet";

type Note = {
  id: string;
  matchId: string;
  kind: "match" | "message";
  title: string;
  detail: string;
  at: string;
  photoUrl: string | null;
  name: string;
};

/**
 * Notifications are things waiting on you, nothing more:
 *  - a match you haven't said hi to yet      -> "You matched with Sana"
 *  - someone's last message is unanswered     -> "Maya texted you"
 * Once you reply, the notification goes away. This is separate from the Chats page,
 * which is where conversations live.
 */
export function buildNotifications(matches: MatchDTO[]): Note[] {
  const notes: Note[] = [];
  for (const m of matches) {
    const base = { matchId: m.id, photoUrl: m.profile.photoUrl, name: m.profile.name };
    if (!m.lastMessage) {
      notes.push({ ...base, id: `match_${m.id}`, kind: "match", title: `You matched with ${m.profile.name}`, detail: "Tap to say hi", at: m.createdAt });
    } else if (!m.lastMessage.fromMe) {
      notes.push({ ...base, id: `msg_${m.id}`, kind: "message", title: `${m.profile.name} texted you`, detail: m.lastMessage.body, at: m.lastMessage.createdAt });
    }
  }
  return notes.sort((a, b) => b.at.localeCompare(a.at));
}

export function NotificationsBell() {
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .matches()
        .then((m) => alive && setMatches(m))
        .catch(() => {
          /* the bell is decorative; keep the last good value */
        });
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const notes = useMemo(() => buildNotifications(matches), [matches]);
  const n = notes.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="bell"
        aria-haspopup="dialog"
        aria-label={n ? `Notifications, ${n} new` : "Notifications"}
        className="btn-soft focus-ring relative size-11"
      >
        <Bell className="size-5" aria-hidden />
        {n > 0 && (
          <span
            aria-hidden
            data-testid="bell-count"
            className="absolute -top-0.5 -right-0.5 min-w-[20px] rounded-full border-2 border-bg bg-accent-strong px-1 text-center text-[11px] leading-[16px] font-extrabold text-white"
          >
            {n}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications" testId="notifications-sheet">
        {n === 0 ? (
          <div className="flex flex-col items-start gap-1.5 py-6" data-testid="notifications-empty">
            <p className="display text-[24px]">You&apos;re all caught up</p>
            <p className="text-[15px] text-muted">New matches and messages will show up here.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1 pt-1" data-testid="notifications-list">
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/discover/matches/${note.matchId}`}
                  onClick={() => setOpen(false)}
                  data-testid="notification-item"
                  data-kind={note.kind}
                  className="focus-ring flex items-center gap-3.5 rounded-[18px] px-2 py-3 transition-colors hover:bg-soft"
                >
                  <span className="relative size-12 shrink-0">
                    <span className="relative block size-12 overflow-hidden rounded-full bg-soft">
                      <Photo src={note.photoUrl} name={note.name} className="absolute inset-0 size-full" eager />
                    </span>
                    <span
                      aria-hidden
                      className="absolute -right-1 -bottom-1 flex size-[22px] items-center justify-center rounded-full border-2 border-surface bg-accent-strong text-white"
                    >
                      {note.kind === "match" ? (
                        <Heart className="size-3 fill-current" />
                      ) : (
                        <MessageCircle className="size-3 fill-current" />
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] leading-tight font-extrabold">{note.title}</span>
                    <span className="mt-1 block truncate text-[14px] text-muted">{note.detail}</span>
                  </span>
                  <span className="shrink-0 self-start pt-0.5 text-[12px] font-semibold text-muted">{timeAgo(note.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
