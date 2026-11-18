import { BadgeCheck, GraduationCap, Heart, Info, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { shortDistance } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { InterestChips } from "./interest-chips";

export function VerifiedBadge({ className = "size-6" }: { className?: string }) {
  return (
    <span title="Photo verified" className="inline-flex">
      <BadgeCheck className={`${className} fill-[#d7ecff] text-ink`} strokeWidth={2} aria-hidden />
      <span className="sr-only">Photo verified</span>
    </span>
  );
}

/**
 * The swipe card. White (the photo is the colour, per Coy's "surface colour names
 * the moment" rule). What you have in common gets the only pink.
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
  const shared = profile.sharedInterests.length;
  const distance = shortDistance(profile.distanceKm);

  return (
    <article aria-label={`${profile.name}, ${profile.age}`} className="sticker-hero flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 border-b-(length:--bw) border-line bg-soft">
        <Photo src={profile.photoUrl} name={profile.name} eager={eager} className="absolute inset-0 size-full" />

        {distance && (
          <span
            data-testid="card-distance"
            className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border-(length:--bw) border-line bg-surface px-2.5 py-1 text-[12px] font-bold"
          >
            <MapPin className="size-3.5" aria-hidden />
            {distance}
          </span>
        )}

        {shared > 0 && (
          <span
            data-testid="card-shared"
            className="absolute bottom-3 left-3 inline-flex -rotate-2 items-center gap-1.5 rounded-full border-(length:--bw) border-line bg-accent-soft px-3 py-1 text-[13px] font-extrabold shadow-(--pop)"
          >
            <Heart className="size-3.5 fill-accent text-ink" strokeWidth={2} aria-hidden />
            {shared} {shared === 1 ? "thing" : "things"} in common
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="display flex items-center gap-1.5 text-[28px]">
            <span>
              {profile.name}
              <span className="text-[22px] font-semibold tracking-normal text-muted">, {profile.age}</span>
            </span>
            {profile.verified && <VerifiedBadge />}
          </h2>
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              onPointerDownCapture={(e) => e.stopPropagation()}
              aria-label={`Open ${profile.name}'s full profile`}
              data-testid="open-profile"
              className="btn-soft focus-ring -mt-1 -mr-1 shrink-0"
            >
              <Info className="size-5" aria-hidden />
            </button>
          )}
        </div>

        <p className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-muted">
          {profile.college ? (
            <>
              <GraduationCap className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{profile.college}</span>
            </>
          ) : (
            <>
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{profile.city}</span>
            </>
          )}
        </p>

        {profile.bio && <p className="line-clamp-2 text-[15px] leading-[1.38]">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <div className="pt-1">
            <InterestChips interests={profile.interests} shared={profile.sharedInterests} max={3} size="sm" />
          </div>
        )}
      </div>
    </article>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="sticker-hero flex h-full animate-pulse flex-col overflow-hidden" aria-label="Loading profiles" role="status">
      <div className="flex-1 bg-soft" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-7 w-1/2 rounded-xl bg-soft" />
        <div className="h-4 w-2/3 rounded-lg bg-soft" />
        <div className="h-4 w-full rounded-lg bg-soft" />
      </div>
    </div>
  );
}
