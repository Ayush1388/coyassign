"use client";

import { BadgeCheck, Check, Heart, Languages, MapPin, Sparkles, Target, Wine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type Filters, type FilterOptions } from "@/lib/api";
import { DRINKING, INTENTS, intentOf, SMOKING, WORKOUT } from "@/lib/profile-options";
import { Sheet } from "@/components/ui/sheet";
import { interestIcon } from "./interest-icon";

export const AGE_MIN = 18;
export const AGE_MAX = 40;
/** Steps for the distance slider. The last one means "anywhere". */
export const DISTANCE_STEPS = [2, 5, 10, 25, 50, 100, 500, null] as const;

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

/** How many filter groups are active (for the badge). */
export function activeCount(f: Filters): number {
  let n = 0;
  if (f.maxKm != null) n++;
  if (f.minAge != null || f.maxAge != null) n++;
  for (const k of ["intents", "drinking", "smoking", "workout", "interests", "languages"] as const) if (f[k]?.length) n++;
  if (f.verified) n++;
  if (f.shared) n++;
  return n;
}
export const isFiltered = (f: Filters) => activeCount(f) > 0;

const toggle = (list: string[] | undefined, v: string) => {
  const s = new Set(list ?? []);
  if (s.has(v)) s.delete(v);
  else s.add(v);
  return s.size ? [...s] : undefined;
};

export function FiltersSheet({
  open,
  value,
  myInterests,
  myIntent,
  options,
  onClose,
  onApply,
}: {
  open: boolean;
  value: Filters;
  myInterests: string[];
  myIntent: string | null;
  options: FilterOptions | null;
  onClose: () => void;
  onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>(value);
  const [preview, setPreview] = useState<number | null>(null);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Live "Show N people" count (debounced), so people see the cost of each filter.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreview(null);
    const t = setTimeout(() => {
      api
        .feed(draft)
        .then((p) => !cancelled && setPreview(p.length))
        .catch(() => !cancelled && setPreview(null));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [draft, open]);

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const distIdx = useMemo(() => {
    const i = DISTANCE_STEPS.findIndex((d) => d === (draft.maxKm ?? null));
    return i < 0 ? DISTANCE_STEPS.length - 1 : i;
  }, [draft.maxKm]);
  const maxKm = DISTANCE_STEPS[distIdx];
  const minAge = draft.minAge ?? AGE_MIN;
  const maxAge = draft.maxAge ?? AGE_MAX;
  const count = activeCount(draft);
  const mine = intentOf(myIntent);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      testId="filters-sheet"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft({})}
            disabled={count === 0}
            className="focus-ring h-13 rounded-full bg-soft px-5 text-[16px] font-bold transition-colors hover:bg-hairline disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            data-testid="apply-filters"
            className="pill-primary focus-ring h-13 flex-1"
          >
            {preview == null ? "Show people" : preview === 0 ? "No one fits yet" : `Show ${preview} ${preview === 1 ? "person" : "people"}`}
          </button>
        </div>
      }
    >
      <p className="-mt-1 mb-4 text-[14px] font-semibold text-muted" data-testid="filters-summary">
        {count ? `${count} ${count === 1 ? "filter" : "filters"} on · ` : ""}Fewer filters = more people. Everything here is public profile info.
      </p>

      {/* Looking for */}
      <Section icon={<Target className="size-4" />} title="Looking for" onClear={draft.intents ? () => set({ intents: undefined }) : undefined}>
        <div className="grid grid-cols-2 gap-2">
          {INTENTS.map((it) => {
            const on = !!draft.intents?.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                aria-pressed={on}
                data-testid={`intent-${it.id}`}
                onClick={() => set({ intents: toggle(draft.intents, it.id) })}
                className={`focus-ring relative flex min-h-[64px] flex-col items-start justify-center rounded-[18px] px-3.5 py-2.5 text-left transition-all duration-150 active:scale-[0.98] ${
                  on ? "bg-surface shadow-sm ring-2 ring-accent-strong" : "bg-soft hover:bg-hairline"
                }`}
              >
                <span className="text-[20px] leading-none" aria-hidden>
                  {it.emoji}
                </span>
                <span className="mt-1 text-[14px] leading-tight font-bold">{it.label}</span>
                {on && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-accent-strong text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {mine && !(draft.intents?.length === 1 && draft.intents[0] === mine.id) && (
          <button
            type="button"
            onClick={() => set({ intents: [mine.id] })}
            className="focus-ring mt-2.5 text-[13px] font-bold text-accent-strong underline underline-offset-4"
          >
            Same as me ({mine.emoji} {mine.label})
          </button>
        )}
      </Section>

      {/* Distance */}
      <Section icon={<MapPin className="size-4" />} title="Maximum distance" value={maxKm == null ? "Anywhere" : `${maxKm} km`} valueTestId="distance-value">
        <input
          type="range"
          min={0}
          max={DISTANCE_STEPS.length - 1}
          step={1}
          value={distIdx}
          onChange={(e) => set({ maxKm: DISTANCE_STEPS[Number(e.target.value)] ?? undefined })}
          aria-label="Maximum distance"
          aria-valuetext={maxKm == null ? "Anywhere" : `${maxKm} kilometres`}
          className="range w-full"
          style={{ "--fill": `${(distIdx / (DISTANCE_STEPS.length - 1)) * 100}%` } as React.CSSProperties}
          data-testid="distance-slider"
        />
        <p className="mt-2 text-[12px] font-semibold text-muted">Distances are rounded, so nobody can pinpoint where you live.</p>
      </Section>

      {/* Age */}
      <Section icon={<Sparkles className="size-4" />} title="Age" value={`${minAge} – ${maxAge === AGE_MAX ? `${AGE_MAX}+` : maxAge}`}>
        <DualRange
          min={AGE_MIN}
          max={AGE_MAX}
          low={minAge}
          high={maxAge}
          onChange={(lo, hi) => set({ minAge: lo > AGE_MIN ? lo : undefined, maxAge: hi < AGE_MAX ? hi : undefined })}
        />
      </Section>

      {/* Quick picks */}
      <Section icon={<BadgeCheck className="size-4" />} title="Quick picks">
        <div className="overflow-hidden rounded-[18px] bg-soft">
          <SwitchRow
            label="Verified profiles only"
            hint="Photo-verified people"
            checked={!!draft.verified}
            onChange={(v) => set({ verified: v || undefined })}
            testId="verified-switch"
          />
          <div className="mx-4 h-px bg-hairline" />
          <SwitchRow
            label="Something in common"
            hint={myInterests.length ? `Shares at least one of your ${myInterests.length} interests` : "Shares an interest with you"}
            checked={!!draft.shared}
            onChange={(v) => set({ shared: v || undefined })}
            testId="shared-switch"
            icon={<Heart className="size-4 fill-accent text-accent" aria-hidden />}
          />
        </div>
      </Section>

      {/* Interests */}
      {options && options.interests.length > 0 && (
        <Section
          icon={<Heart className="size-4" />}
          title="Interests"
          hint="Any of these"
          onClear={draft.interests ? () => set({ interests: undefined }) : undefined}
        >
          <ChipGroup>
            {options.interests.map((i) => {
              const Icon = interestIcon(i);
              const isMine = myInterests.some((m) => m.toLowerCase() === i.toLowerCase());
              return (
                <Chip key={i} on={!!draft.interests?.includes(i)} onClick={() => set({ interests: toggle(draft.interests, i) })}>
                  <Icon className="size-3.5" aria-hidden /> {i}
                  {isMine && <span className="size-1.5 rounded-full bg-accent" title="On your profile" aria-label="(yours)" />}
                </Chip>
              );
            })}
          </ChipGroup>
        </Section>
      )}

      {/* Lifestyle */}
      <Section icon={<Wine className="size-4" />} title="Lifestyle">
        <SubLabel>Drinking</SubLabel>
        <ChipGroup>
          {DRINKING.map((o) => (
            <Chip key={o.id} on={!!draft.drinking?.includes(o.id)} onClick={() => set({ drinking: toggle(draft.drinking, o.id) })}>
              <span aria-hidden>{o.emoji}</span> {o.label}
            </Chip>
          ))}
        </ChipGroup>
        <SubLabel>Smoking</SubLabel>
        <ChipGroup>
          {SMOKING.map((o) => (
            <Chip
              key={o.id}
              on={!!draft.smoking?.includes(o.id)}
              onClick={() => set({ smoking: toggle(draft.smoking, o.id) })}
              testId={`smoking-${o.id}`}
            >
              <span aria-hidden>{o.emoji}</span> {o.label}
            </Chip>
          ))}
        </ChipGroup>
        <SubLabel>Workout</SubLabel>
        <ChipGroup>
          {WORKOUT.map((o) => (
            <Chip key={o.id} on={!!draft.workout?.includes(o.id)} onClick={() => set({ workout: toggle(draft.workout, o.id) })}>
              <span aria-hidden>{o.emoji}</span> {o.label}
            </Chip>
          ))}
        </ChipGroup>
      </Section>

      {/* Languages */}
      {options && options.languages.length > 0 && (
        <Section
          icon={<Languages className="size-4" />}
          title="Speaks"
          hint="Any of these"
          onClear={draft.languages ? () => set({ languages: undefined }) : undefined}
        >
          <ChipGroup>
            {options.languages.map((l) => (
              <Chip key={l} on={!!draft.languages?.includes(l)} onClick={() => set({ languages: toggle(draft.languages, l) })}>
                {l}
              </Chip>
            ))}
          </ChipGroup>
        </Section>
      )}
    </Sheet>
  );
}

/* ---------- small building blocks ---------- */

function Section({
  icon,
  title,
  value,
  valueTestId,
  hint,
  onClear,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  valueTestId?: string;
  hint?: string;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline py-5 first-of-type:border-t-0 first-of-type:pt-1">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden>
          {icon}
        </span>
        <h3 className="text-[17px] font-extrabold">{title}</h3>
        {hint && <span className="text-[12px] font-semibold text-muted">· {hint}</span>}
        {value && (
          <span data-testid={valueTestId} className="ml-auto text-[15px] font-extrabold text-accent-strong">
            {value}
          </span>
        )}
        {onClear && (
          <button type="button" onClick={onClear} className="focus-ring ml-auto text-[13px] font-bold text-muted hover:text-ink">
            Clear
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 mb-2 text-[12px] font-bold tracking-[0.06em] text-muted uppercase first:mt-0">{children}</p>
);

const ChipGroup = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap gap-2">{children}</div>;

function Chip({
  on,
  onClick,
  children,
  testId,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      data-testid={testId}
      className={`focus-ring inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-all duration-150 active:scale-[0.96] ${
        on ? "bg-surface font-bold text-ink shadow-sm ring-2 ring-accent-strong" : "bg-soft text-ink hover:bg-hairline"
      }`}
    >
      {on && <Check className="size-3.5 text-accent-strong" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  testId,
  icon,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15px] font-bold">
          {icon}
          {label}
        </span>
        <span className="block text-[13px] text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
        className="switch focus-ring"
      />
    </label>
  );
}

/** Two-thumb range built from two native range inputs (keyboard + screen-reader friendly). */
function DualRange({
  min,
  max,
  low,
  high,
  onChange,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="dual-range relative h-8">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-hairline" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
        style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={low}
        onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)}
        aria-label="Minimum age"
        className="range-thumb absolute inset-0 w-full"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={high}
        onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))}
        aria-label="Maximum age"
        className="range-thumb absolute inset-0 w-full"
      />
    </div>
  );
}
