import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Coy's wordmark: lowercase, heavy, with a round pink dot (not a period). */
export function Wordmark() {
  return (
    <span className="inline-flex items-end gap-[3px] text-[30px] leading-none font-extrabold tracking-[-0.045em]" aria-label="coy">
      coy
      <span aria-hidden className="mb-[5px] size-[9px] rounded-full bg-accent" />
    </span>
  );
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-2">
      <Wordmark />
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
