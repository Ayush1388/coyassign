import { BadgeCheck, Heart, MapPin, MoreHorizontal, Quote } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { shortDistance } from "@/lib/format";
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
}: {
  profile: PublicProfile;
  eager?: boolean;
  onOpen?: () => void;
}) {
  const shared = new Set(profile.sharedInterests.map((s) => s.toLowerCase()));
  const interests = [...profile.interests].sort(
    (a, b) => Number(shared.has(b.toLowerCase())) - Number(shared.has(a.toLowerCase())),
  );
  const distance = shortDistance(profile.distanceKm);

  return (
    <article
      aria-label={`${profile.name}, ${profile.age}`}
      className="relative h-full overflow-hidden rounded-[28px] border-(length:--bw) border-line bg-ink shadow-(--pop-hero)"
    >
      <Photo src={profile.photoUrl} name={profile.name} eager={eager} className="absolute inset-0 size-full" />

      {/* Scrims: a light one at the top for the pills, a deep one at the bottom for the text. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-[#120d17] via-[#120d17]/80 to-transparent"
      />

      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <div className="flex gap-1.5">
          {distance && (
            <span data-testid="card-distance" className="glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold">
              <MapPin className="size-3.5" aria-hidden /> {distance}
            </span>
          )}
          {profile.sharedInterests.length > 0 && (
            <span
              data-testid="card-shared"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/40 bg-accent px-3 text-[13px] font-extrabold text-accent-ink"
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

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-4 pb-4 text-white">
        <h2 className="flex items-center gap-2 text-[30px] leading-none font-extrabold tracking-[-0.03em]">
          <span>
            {profile.name}, <span className="font-semibold">{profile.age}</span>
          </span>
          {profile.verified && <VerifiedBadge className="size-7" onPhoto />}
        </h2>

        <p className="flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-white/85">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{profile.city}</span>
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
                    isShared ? "border border-white/50 bg-accent text-accent-ink" : "glass"
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
