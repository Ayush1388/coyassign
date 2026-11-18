"use client";

import { Flame, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/discover", label: "Discover", Icon: Flame },
] as const;

export function TabBar() {
  const pathname = usePathname();
  // Chats are full-screen, like every messaging app.
  if (/^\/discover\/matches\/[^/]+$/.test(pathname)) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-(--tabbar) backdrop-blur-md">
      <ul className="mx-auto flex max-w-[480px] gap-2 px-5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-[18px] text-[13px] font-bold transition-colors duration-150 ${
                  active ? "text-accent-strong" : "text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                <Icon
                  className={`size-[22px] ${active ? "fill-accent-strong text-accent-strong" : ""}`}
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden
                />
                {label}
                {active && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-full bg-accent-strong" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
