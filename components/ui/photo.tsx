"use client";

import { useState } from "react";

/** Profile photo with a graceful initials fallback if the image is missing or fails. */
export function Photo({
  src,
  name,
  className = "",
  eager = false,
}: {
  src: string | null;
  name: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex items-center justify-center bg-accent-soft text-accent ${className}`}
      >
        <span className="display text-[40%] text-5xl">{name.slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps onError fallback and drag control simple
    <img
      src={src}
      alt={name}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`select-none object-cover ${className}`}
    />
  );
}
