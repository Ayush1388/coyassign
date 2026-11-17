"use client";

import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

export type Theme = "coy" | "minimal";
const KEY = "coy-theme";

export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="minimal"||t==="coy")document.documentElement.dataset.theme=t}catch(e){}`;

/** Switches between the Coy look (default) and the minimal look. A UI preference only. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("coy");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "minimal" ? "minimal" : "coy");
  }, []);

  const next: Theme = theme === "coy" ? "minimal" : "coy";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the theme still applies for this visit */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      data-theme-current={theme}
      aria-label={`Switch to ${next === "coy" ? "Coy" : "Minimal"} style`}
      title={`Style: ${theme === "coy" ? "Coy" : "Minimal"}. Tap to switch`}
      className="sticker-sm pressable focus-ring flex h-10 items-center gap-1.5 rounded-full! px-3 text-sm font-semibold"
    >
      <Palette className="size-4" aria-hidden />
      <span>{theme === "coy" ? "Coy" : "Minimal"}</span>
    </button>
  );
}
