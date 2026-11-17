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
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-(length:--bw) border-line bg-(--tabbar) backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-[460px] gap-2 px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition-colors ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.6 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
