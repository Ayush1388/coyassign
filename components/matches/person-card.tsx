"use client";

import { Heart, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { listInterests, shortDistance } from "@/lib/format";
import { intentOf } from "@/lib/profile-options";
import { InterestChips } from "@/components/discover/interest-chips";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { Photo } from "@/components/ui/photo";

/**
 * The rich, borderless person card used by Liked and Matches: photo plus thumbnails,
 * distance, looking-for, what you share and interests. `footer` is the per-section status line;
 * `actions` sit under it (e.g. a Message button). Tapping the card body calls onOpen.
 */
export function PersonCard({
  profile: p,
  onOpen,
  footer,
  actions,
  testId,
  accent = false,
}: {
  profile: PublicProfile;
  onOpen: () => void;
  footer: React.ReactNode;
  actions?: React.ReactNode;
  testId: string;
  /** Pink ring for "needs your attention" (e.g. your turn to reply). */
  accent?: boolean;
}) {
  const intent = intentOf(p.intent);
  const distance = shortDistance(p.distanceKm);
  const photos = p.photos.length ? p.photos : [p.photoUrl];

  return (
    <div
      data-testid={testId}
      data-profile-id={p.id}
      className={`group flex gap-3.5 rounded-[24px] bg-surface p-3 transition-shadow ${
        accent
          ? "shadow-[0_0_0_2px_var(--accent),0_12px_28px_-16px_rgba(216,30,99,0.55)]"
          : "shadow-[0_0_0_1px_var(--hairline),0_10px_24px_-16px_rgba(21,18,29,0.35)] hover:shadow-[0_0_0_1px_var(--hairline),0_16px_30px_-16px_rgba(21,18,29,0.45)]"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${p.name}'s profile`}
        className="focus-ring relative w-[112px] shrink-0 rounded-[18px] text-left"
      >
        <span className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-soft">
          <Photo
            src={photos[0] ?? null}
            name={p.name}
            className="absolute inset-0 size-full transition-transform duration-300 group-hover:scale-[1.03]"
            eager
          />
        </span>
        {photos.length > 1 && (
          <span className="mt-1.5 flex gap-1" aria-label={`${photos.length} photos`}>
            {photos.slice(1, 3).map((src) => (
              <span key={src} className="relative block aspect-square flex-1 overflow-hidden rounded-[10px] bg-soft">
                <Photo src={src} name={p.name} className="absolute inset-0 size-full" />
              </span>
            ))}
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
        <button type="button" onClick={onOpen} className="focus-ring flex flex-col gap-1.5 rounded-[12px] text-left">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[19px] font-extrabold tracking-[-0.02em]">
              {p.name}, {p.age}
            </span>
            {p.verified && <VerifiedBadge className="size-[18px] shrink-0" />}
          </span>
          <span className="flex items-center gap-1 truncate text-[13px] font-semibold text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {distance ? `${distance} · ` : ""}
            {p.city}
          </span>
          {intent && (
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${
                p.sameIntent ? "bg-accent text-accent-ink" : "bg-soft"
              }`}
            >
              <span aria-hidden>{intent.emoji}</span> {intent.label}
              {p.sameIntent && <span className="font-semibold"> · same as you</span>}
            </span>
          )}
          {p.sharedInterests.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-accent-strong" data-testid="card-shared-line">
              <Heart className="size-3.5 fill-current" aria-hidden />
              You both like {listInterests(p.sharedInterests, 2)}
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-muted">Ask about {p.interests[0] ?? "their day"}!</span>
          )}
          <span className="mt-0.5">
            <InterestChips interests={p.interests} shared={p.sharedInterests} max={3} size="sm" />
          </span>
        </button>
        <div className="mt-auto pt-1">{footer}</div>
        {actions && <div className="pt-1">{actions}</div>}
      </div>
    </div>
  );
}
