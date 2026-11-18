import { GraduationCap, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { Photo } from "@/components/ui/photo";

/**
 * Pure presentation: swipe behaviour lives in SwipeCard.
 * The card stays white because in Coy's system surface colour carries meaning
 * (yellow = news, lilac = status, mint = reward), and here the photo is the colour.
 * Interests are flat soft pills: edge and pop are reserved for things you can press.
 */
export function ProfileCard({ profile, eager }: { profile: PublicProfile; eager?: boolean }) {
  return (
    <article aria-label={`${profile.name}, ${profile.age}`} className="sticker-hero flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 border-b-(length:--bw) border-line bg-soft">
        <Photo src={profile.photoUrl} name={profile.name} eager={eager} className="absolute inset-0 size-full" />
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4 pb-5">
        <h2 className="display text-[32px]">
          {profile.name}
          <span className="text-[26px] font-semibold tracking-normal text-muted">, {profile.age}</span>
        </h2>

        <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[14px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden /> {profile.city}
          </span>
          {profile.college && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <GraduationCap className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{profile.college}</span>
            </span>
          )}
        </p>

        {profile.bio && <p className="line-clamp-2 text-[16px] leading-[1.4]">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Interests">
            {profile.interests.slice(0, 4).map((i) => (
              <li key={i} className="rounded-full bg-soft px-3 py-1 text-[13px] font-semibold">
                {i}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="sticker-hero flex h-full animate-pulse flex-col overflow-hidden" aria-label="Loading profiles" role="status">
      <div className="flex-1 bg-soft" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-8 w-1/2 rounded-xl bg-soft" />
        <div className="h-4 w-2/3 rounded-lg bg-soft" />
        <div className="h-4 w-full rounded-lg bg-soft" />
      </div>
    </div>
  );
}
