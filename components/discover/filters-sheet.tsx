"use client";

import { useEffect, useState } from "react";
import type { Filters } from "@/lib/api";
import { Sheet } from "@/components/ui/sheet";

export const AGE_MIN = 18;
export const AGE_MAX = 40;
/** Steps for the distance slider. The last one means "anywhere". */
export const DISTANCE_STEPS = [5, 10, 25, 50, 100, 500, null] as const;

export const DEFAULT_FILTERS: Filters = {};
const KEY = "coy-discover-filters";

/** Filters are a per-device UI preference, so localStorage is fine here (swipes are not). */
export function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Filters) : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function saveFilters(f: Filters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}

export const isFiltered = (f: Filters) => f.minAge != null || f.maxAge != null || f.maxKm != null;

export function FiltersSheet({
  open,
  value,
  myInterests,
  onClose,
  onApply,
}: {
  open: boolean;
  value: Filters;
  myInterests: string[];
  onClose: () => void;
  onApply: (f: Filters) => void;
}) {
  const [minAge, setMinAge] = useState(value.minAge ?? AGE_MIN);
  const [maxAge, setMaxAge] = useState(value.maxAge ?? AGE_MAX);
  const [distIdx, setDistIdx] = useState(() => {
    const i = DISTANCE_STEPS.findIndex((d) => d === (value.maxKm ?? null));
    return i < 0 ? DISTANCE_STEPS.length - 1 : i;
  });

  useEffect(() => {
    if (!open) return;
    setMinAge(value.minAge ?? AGE_MIN);
    setMaxAge(value.maxAge ?? AGE_MAX);
    const i = DISTANCE_STEPS.findIndex((d) => d === (value.maxKm ?? null));
    setDistIdx(i < 0 ? DISTANCE_STEPS.length - 1 : i);
  }, [open, value]);

  const maxKm = DISTANCE_STEPS[distIdx];

  function apply() {
    onApply({
      minAge: minAge > AGE_MIN ? minAge : undefined,
      maxAge: maxAge < AGE_MAX ? maxAge : undefined,
      maxKm: maxKm ?? undefined,
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      testId="filters-sheet"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setMinAge(AGE_MIN);
              setMaxAge(AGE_MAX);
              setDistIdx(DISTANCE_STEPS.length - 1);
            }}
            className="btn-secondary pressable focus-ring flex-1"
          >
            Reset
          </button>
          <button type="button" onClick={apply} className="btn-primary pressable focus-ring flex-1" data-testid="apply-filters">
            Show people
          </button>
        </div>
      }
    >
      <section className="mt-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[17px] font-bold">Maximum distance</h3>
          <p className="text-[15px] font-bold text-accent-strong" data-testid="distance-value">
            {maxKm == null ? "Anywhere" : `${maxKm} km`}
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={DISTANCE_STEPS.length - 1}
          step={1}
          value={distIdx}
          onChange={(e) => setDistIdx(Number(e.target.value))}
          aria-label="Maximum distance"
          aria-valuetext={maxKm == null ? "Anywhere" : `${maxKm} kilometres`}
          className="mt-3 w-full accent-(--accent)"
          data-testid="distance-slider"
        />
        <p className="mt-1 text-[13px] font-semibold text-muted">
          Distances are rounded, so nobody can pinpoint where you live.
        </p>
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[17px] font-bold">Age</h3>
          <p className="text-[15px] font-bold text-accent-strong">
            {minAge}–{maxAge === AGE_MAX ? `${AGE_MAX}+` : maxAge}
          </p>
        </div>
        <label className="mt-3 flex items-center gap-3 text-[13px] font-semibold text-muted">
          <span className="w-8">Min</span>
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={minAge}
            onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge))}
            aria-label="Minimum age"
            className="flex-1 accent-(--accent)"
          />
        </label>
        <label className="mt-2 flex items-center gap-3 text-[13px] font-semibold text-muted">
          <span className="w-8">Max</span>
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={maxAge}
            onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge))}
            aria-label="Maximum age"
            className="flex-1 accent-(--accent)"
          />
        </label>
      </section>

      {myInterests.length > 0 && (
        <section className="mt-6 rounded-[20px] bg-soft p-4">
          <h3 className="micro-label text-muted">Your interests</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {myInterests.map((i) => (
              <li key={i} className="rounded-full border-(length:--bw) border-line bg-surface px-3 py-1 text-[13px] font-semibold">
                {i}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] font-semibold text-muted">Anything you share is highlighted on cards.</p>
        </section>
      )}
    </Sheet>
  );
}
