import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Wordmark() {
  return (
    <span className="display text-[28px] leading-none" aria-label="coy">
      coy<span className="text-accent">.</span>
    </span>
  );
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
      <Wordmark />
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
