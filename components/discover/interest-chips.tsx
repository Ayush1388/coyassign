import { Heart } from "lucide-react";

/**
 * Interests with the ones you share pulled to the front and highlighted
 * (pink-soft + edge + heart). Others are flat soft pills.
 */
export function InterestChips({
  interests,
  shared,
  max,
  size = "md",
}: {
  interests: string[];
  shared: string[];
  max?: number;
  size?: "sm" | "md";
}) {
  const sharedSet = new Set(shared.map((s) => s.toLowerCase()));
  const ordered = [...interests].sort(
    (a, b) => Number(sharedSet.has(b.toLowerCase())) - Number(sharedSet.has(a.toLowerCase())),
  );
  const shown = max ? ordered.slice(0, max) : ordered;
  const extra = ordered.length - shown.length;
  const pad = size === "sm" ? "px-2.5 py-[3px] text-[12px]" : "px-3 py-1 text-[13px]";

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
      {shown.map((i) => {
        const isShared = sharedSet.has(i.toLowerCase());
        return (
          <li
            key={i}
            data-shared={isShared || undefined}
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad} ${
              isShared ? "border-(length:--bw) border-line bg-accent-soft" : "border-(length:--bw) border-transparent bg-soft"
            }`}
          >
            {isShared && <Heart className="size-3 fill-accent text-ink" strokeWidth={2} aria-hidden />}
            {i}
            {isShared && <span className="sr-only"> (you both like this)</span>}
          </li>
        );
      })}
      {extra > 0 && <li className={`rounded-full bg-soft font-semibold text-muted ${pad}`}>+{extra}</li>}
    </ul>
  );
}
