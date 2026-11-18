import { Bell } from "lucide-react";
import Link from "next/link";
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

/**
 * Logo left; round icon buttons right (bell + style switch).
 * The bell shows a dot when a chat is waiting on you or there's a match you haven't messaged.
 */
export function AppHeader({ attention = 0, children }: { attention?: number; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-3">
      <Wordmark />
      <div className="flex items-center gap-2">
        {children}
        <Link
          href="/discover/chats"
          aria-label={attention ? `Notifications, ${attention} waiting` : "Notifications"}
          data-testid="bell"
          className="btn-soft focus-ring relative size-11"
        >
          <Bell className="size-5" aria-hidden />
          {attention > 0 && (
            <span aria-hidden className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-soft bg-accent" />
          )}
        </Link>
        <ThemeToggle compact />
      </div>
    </header>
  );
}
