"use client";

import { Heart, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { listInterests, shortDistance } from "@/lib/format";
import { intentOf } from "@/lib/profile-options";
import { InterestChips } from "@/components/discover/interest-chips";
import { VerifiedBadge } from "@/components/discover/profile-card";
import { Photo } from "@/components/ui/photo";

/**
 * The person card used by Liked and Matches.
 *
 * Spacing follows an 8px rhythm: 16px frame, 16px between photo and details, 12px between
 * groups, 4–6px inside a group. No colour fills inside the card: pink appears only as the
 * heart and the "you both like" text. The status line and the optional action sit on their
 * own row under a divider, so nothing is squeezed into the narrow details column.
 */
export function PersonCard({
  profile: p,
  onOpen,
  footer,
  actions,
  testId,
}: {
  profile: PublicProfile;
  onOpen: () => void;
  footer: React.ReactNode;
  actions?: React.ReactNode;
  testId: string;
}) {
  const intent = intentOf(p.intent);
  const distance = shortDistance(p.distanceKm);
  const photos = p.photos.length ? p.photos : [p.photoUrl];

  return (
    <div
      data-testid={testId}
      data-profile-id={p.id}
      className="group rounded-[24px] bg-surface p-4 shadow-[0_0_0_1px_var(--hairline),0_10px_24px_-16px_rgba(21,18,29,0.35)] transition-shadow hover:shadow-[0_0_0_1px_var(--hairline),0_16px_30px_-16px_rgba(21,18,29,0.45)]"
    >
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${p.name}'s profile`}
          className="focus-ring relative w-[104px] shrink-0 self-start rounded-[18px] text-left"
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
            <span className="mt-2 flex gap-2" aria-label={`${photos.length} photos`}>
              {photos.slice(1, 3).map((src) => (
                <span key={src} className="relative block aspect-square flex-1 overflow-hidden rounded-[10px] bg-soft">
                  <Photo src={src} name={p.name} className="absolute inset-0 size-full" />
                </span>
              ))}
            </span>
          )}
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
          className="focus-ring flex min-w-0 flex-1 cursor-pointer flex-col gap-3 rounded-[12px] text-left"
        >
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5">
              <span className="truncate text-[19px] font-extrabold tracking-[-0.02em]">
                {p.name}, {p.age}
              </span>
              {p.verified && <VerifiedBadge className="size-[18px] shrink-0" />}
            </p>
            <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {distance ? `${distance} · ` : ""}
                {p.city}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {intent && (
              <p className="text-[14px] font-semibold">
                <span aria-hidden>{intent.emoji}</span> {intent.label}
              </p>
            )}
            {p.sharedInterests.length > 0 ? (
              <p className="flex items-start gap-1.5 text-[13px] leading-snug font-semibold text-accent-strong" data-testid="card-shared-line">
                <Heart className="mt-[3px] size-3.5 shrink-0 fill-current" aria-hidden />
                You both like {listInterests(p.sharedInterests, 2)}
              </p>
            ) : (
              <p className="text-[13px] font-medium text-muted">Ask about {p.interests[0] ?? "their day"}!</p>
            )}
          </div>

          <InterestChips interests={p.interests} shared={p.sharedInterests} max={3} size="sm" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3.5">
        <div className="min-w-0 flex-1">{footer}</div>
        {actions}
      </div>
    </div>
  );
}
