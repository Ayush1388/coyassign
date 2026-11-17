import { GraduationCap, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api";
import { Photo } from "@/components/ui/photo";

/** Picks one of the theme's tint surfaces from the (public) profile id. */
export function tintFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return `var(--tint-${Math.abs(h) % 4})`;
}

/** Pure presentation: the swipe behaviour lives in SwipeCard. */
export function ProfileCard({ profile, eager }: { profile: PublicProfile; eager?: boolean }) {
  return (
    <article
      aria-label={`${profile.name}, ${profile.age}`}
      className="sticker flex h-full flex-col overflow-hidden"
      style={{ background: tintFor(profile.id) }}
    >
      <div className="relative min-h-0 flex-1 border-b-(length:--bw) border-line">
        <Photo src={profile.photoUrl} name={profile.name} eager={eager} className="absolute inset-0 size-full" />
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <h2 className="display text-[30px]">
          {profile.name}
          <span className="font-sans text-2xl font-medium tracking-normal text-muted">, {profile.age}</span>
        </h2>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-ink/80">
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

        {profile.bio && <p className="line-clamp-2 text-[15px] leading-snug text-ink/85">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-0.5" aria-label="Interests">
            {profile.interests.slice(0, 4).map((i) => (
              <li
                key={i}
                className="rounded-full border-(length:--bw) border-line bg-surface px-2.5 py-0.5 text-xs font-semibold"
              >
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
    <div className="sticker flex h-full animate-pulse flex-col overflow-hidden" aria-label="Loading profiles" role="status">
      <div className="flex-1 bg-surface-2" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-7 w-1/2 rounded-lg bg-surface-2" />
        <div className="h-4 w-2/3 rounded bg-surface-2" />
        <div className="h-4 w-full rounded bg-surface-2" />
      </div>
    </div>
  );
}
