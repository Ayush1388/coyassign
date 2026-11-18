import { BadgeCheck, Heart, MapPin, MoreHorizontal, Quote } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { shortDistance } from "@/lib/format";
import { intentOf } from "@/lib/profile-options";
import { Photo } from "@/components/ui/photo";
import { interestIcon } from "./interest-icon";

export function VerifiedBadge({ className = "size-6", onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  return (
    <span title="Photo verified" className="inline-flex">
      <BadgeCheck
        className={`${className} ${onPhoto ? "fill-[#3b82f6] text-white" : "fill-[#d7ecff] text-ink"}`}
        strokeWidth={2.2}
        aria-hidden
      />
      <span className="sr-only">Photo verified</span>
    </span>
  );
}

/**
 * The swipe card: full-bleed photo, details over a dark scrim at the bottom
 * (the scrim keeps white text above 4.5:1 on any photo). Shared interests are
 * the only pink chips. The prompt replaces a photo strip, since we don't have
 * per-interest photos and won't fake them.
 */
export function ProfileCard({
  profile,
  eager,
  onOpen,
  photoIndex = 0,
}: {
  profile: PublicProfile;
  eager?: boolean;
  onOpen?: () => void;
  /** Which photo of profile.photos to show (the swipe card lets you tap through them). */
  photoIndex?: number;
}) {
  const photos = profile.photos.length ? profile.photos : [profile.photoUrl];
  const current = photos[Math.min(photoIndex, photos.length - 1)] ?? null;
  const shared = new Set(profile.sharedInterests.map((s) => s.toLowerCase()));
  const interests = [...profile.interests].sort(
    (a, b) => Number(shared.has(b.toLowerCase())) - Number(shared.has(a.toLowerCase())),
  );
  const distance = shortDistance(profile.distanceKm);
  const intent = intentOf(profile.intent);

  return (
    <article
      aria-label={`${profile.name}, ${profile.age}`}
      className="relative h-full overflow-hidden rounded-[28px] border-(length:--bw) border-line bg-ink shadow-(--pop-hero)"
    >
      <Photo key={current ?? "none"} src={current} name={profile.name} eager={eager} className="absolute inset-0 size-full" />
      {/* Preload the other photos so tapping through is instant. */}
      {eager &&
        photos.slice(1).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src ?? ""} alt="" aria-hidden className="hidden" />
        ))}

      {/* Scrims: a light one at the top for the pills, a deep one at the bottom for the text. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 scrim-top" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] scrim-bottom"
      />

      {photos.length > 1 && (
        <div className="absolute inset-x-3 top-2 flex gap-1" aria-label={`Photo ${photoIndex + 1} of ${photos.length}`} data-testid="photo-bars">
          {photos.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}

      <div className="absolute inset-x-3 top-5 flex items-start justify-between gap-2">
        <div className="flex gap-1.5">
          {distance && (
            <span data-testid="card-distance" className="glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold">
              <MapPin className="size-3.5" aria-hidden /> {distance}
            </span>
          )}
          {profile.sharedInterests.length > 0 && (
            <span
              data-testid="card-shared"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/40 bg-accent-strong px-3 text-[13px] font-extrabold text-white"
            >
              <Heart className="size-3.5 fill-current" aria-hidden />
              {profile.sharedInterests.length} in common
            </span>
          )}
        </div>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            onPointerDownCapture={(e) => e.stopPropagation()}
            aria-label={`Open ${profile.name}'s full profile`}
            data-testid="open-profile"
            className="glass focus-ring flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-4 pb-4 text-white" data-zone="info">
        <h2 className="flex items-center gap-2 text-[30px] leading-none font-extrabold tracking-[-0.03em]">
          <span>
            {profile.name}, <span className="font-semibold">{profile.age}</span>
          </span>
          {profile.verified && <VerifiedBadge className="size-7" onPhoto />}
        </h2>

        <p className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-white/85">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{profile.city}</span>
          </span>
          {intent && (
            <span
              data-testid="card-intent"
              className="glass inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-bold"
              title={profile.sameIntent ? "Looking for the same thing as you" : `Looking for: ${intent.label}`}
            >
              <span aria-hidden>{intent.emoji}</span> {intent.short}
              {profile.sameIntent && <span className="sr-only"> (same as you)</span>}
            </span>
          )}
        </p>

        {profile.bio && <p className="line-clamp-2 text-[15px] leading-[1.38] text-white/95">{profile.bio}</p>}

        {interests.length > 0 && (
          <ul className="flex max-h-8 flex-wrap gap-1.5 overflow-hidden pt-0.5" aria-label="Interests">
            {interests.slice(0, 3).map((i) => {
              const Icon = interestIcon(i);
              const isShared = shared.has(i.toLowerCase());
              return (
                <li
                  key={i}
                  data-shared={isShared || undefined}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${
                    isShared ? "border border-white/50 bg-accent-strong text-white" : "glass"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {i}
                  {isShared && <span className="sr-only"> (you both like this)</span>}
                </li>
              );
            })}
          </ul>
        )}

        {profile.prompt && (
          <div className="glass mt-0.5 rounded-[18px] px-3.5 py-2.5">
            <p className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.08em] text-white/75 uppercase">
              <Quote className="size-3" aria-hidden /> {profile.prompt.question}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[14px] leading-snug font-semibold">{profile.prompt.answer}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse flex-col justify-end gap-3 overflow-hidden rounded-[28px] border-(length:--bw) border-line bg-soft p-5 shadow-(--pop-hero)"
      aria-label="Loading profiles"
      role="status"
    >
      <div className="h-8 w-1/2 rounded-xl bg-hairline" />
      <div className="h-4 w-2/3 rounded-lg bg-hairline" />
      <div className="h-4 w-full rounded-lg bg-hairline" />
    </div>
  );
}
