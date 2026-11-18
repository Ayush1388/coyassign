"use client";

import { GraduationCap, Heart, MapPin, Quote, X } from "lucide-react";
import type { PublicProfile, SwipeAction } from "@/lib/api";
import { distanceLabel, listInterests } from "@/lib/format";
import { drinkingOf, intentOf, smokingOf, workoutOf } from "@/lib/profile-options";
import { Photo } from "@/components/ui/photo";
import { Sheet } from "@/components/ui/sheet";
import { InterestChips } from "./interest-chips";
import { VerifiedBadge } from "./profile-card";

/** Full profile: about, prompt, everything in common. You can decide from here too. */
export function ProfileSheet({
  profile,
  open,
  onClose,
  onDecide,
}: {
  profile: PublicProfile | null;
  open: boolean;
  onClose: () => void;
  onDecide: (action: SwipeAction) => void;
}) {
  if (!profile) return null;
  const distance = distanceLabel(profile.distanceKm);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${profile.name}, ${profile.age}`}
      testId="profile-sheet"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={() => onDecide("PASS")} className="btn-secondary pressable focus-ring flex-1">
            <X className="size-5" strokeWidth={3} aria-hidden /> Pass
          </button>
          <button type="button" onClick={() => onDecide("LIKE")} className="btn-primary pressable focus-ring flex-1">
            <Heart className="size-5 fill-surface" aria-hidden /> Like
          </button>
        </div>
      }
    >
      <div className="relative mt-1 aspect-[4/5] w-full overflow-hidden rounded-[20px] border-(length:--bw) border-line bg-soft">
        <Photo src={profile.photoUrl} name={profile.name} className="absolute inset-0 size-full" eager />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] font-semibold text-muted">
        {profile.verified && (
          <span className="inline-flex items-center gap-1 text-ink">
            <VerifiedBadge className="size-5" /> Verified
          </span>
        )}
        {distance && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden /> {distance}
          </span>
        )}
        <span>{profile.city}</span>
        {profile.college && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="size-4" aria-hidden /> {profile.college}
          </span>
        )}
      </div>

      {profile.sharedInterests.length > 0 && (
        <div className="mt-4 rounded-[20px] border-(length:--bw) border-line bg-accent-soft p-4">
          <p className="micro-label">In common</p>
          <p className="display mt-1 text-[22px]">You both like {listInterests(profile.sharedInterests, 3)}</p>
        </div>
      )}

      {(() => {
        const intent = intentOf(profile.intent);
        const life = [drinkingOf(profile.lifestyle.drinking), smokingOf(profile.lifestyle.smoking), workoutOf(profile.lifestyle.workout)].filter(Boolean);
        return (
          <section className="mt-5 grid grid-cols-1 gap-2.5" aria-label="Looking for and lifestyle">
            {intent && (
              <div className={`flex items-center gap-3 rounded-[18px] p-3.5 ${profile.sameIntent ? "bg-accent-soft ring-2 ring-accent" : "bg-soft"}`}>
                <span className="text-[26px] leading-none" aria-hidden>
                  {intent.emoji}
                </span>
                <span>
                  <span className="micro-label block text-[10px] text-muted">Looking for</span>
                  <span className="text-[16px] font-extrabold">{intent.label}</span>
                  {profile.sameIntent && <span className="ml-1.5 text-[13px] font-bold text-accent-strong">· same as you</span>}
                </span>
              </div>
            )}
            {(life.length > 0 || profile.languages.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {life.map((l) => (
                  <span key={l!.phrase} className="inline-flex h-8 items-center gap-1 rounded-full bg-soft px-3 text-[13px] font-semibold">
                    <span aria-hidden>{l!.emoji}</span> {l!.phrase}
                  </span>
                ))}
                {profile.languages.length > 0 && (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full bg-soft px-3 text-[13px] font-semibold">
                    <span aria-hidden>🗣️</span> {profile.languages.join(", ")}
                  </span>
                )}
              </div>
            )}
          </section>
        );
      })()}

      {profile.bio && (
        <section className="mt-5">
          <h3 className="micro-label text-muted">About</h3>
          <p className="mt-1.5 text-[17px] leading-[1.45]">{profile.bio}</p>
        </section>
      )}

      {profile.prompt && (
        <section className="sticker mt-5 bg-[var(--tint-sky)]! p-4" aria-label="Prompt">
          <p className="micro-label inline-flex items-center gap-1.5">
            <Quote className="size-3.5" aria-hidden /> {profile.prompt.question}
          </p>
          <p className="display mt-2 text-[22px] leading-[1.15]">{profile.prompt.answer}</p>
        </section>
      )}

      <section className="mt-5">
        <h3 className="micro-label text-muted">Interests</h3>
        <div className="mt-2">
          <InterestChips interests={profile.interests} shared={profile.sharedInterests} />
        </div>
      </section>

      <p className="mt-5 text-[13px] font-semibold text-muted">
        {profile.name} only finds out you liked them if they like you back.
      </p>
    </Sheet>
  );
}
