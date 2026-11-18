/** Labels for the server's coarse distance band (never exact). */
export function distanceLabel(km: number | null): string | null {
  if (km == null) return null;
  if (km === 0) return "Under 1 km away";
  return `${km.toLocaleString("en-IN")} km away`;
}

export function shortDistance(km: number | null): string | null {
  if (km == null) return null;
  if (km === 0) return "< 1 km";
  return `${km.toLocaleString("en-IN")} km`;
}

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));

/** "now", "5m", "3h", or a date: for message lists. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return formatDay(iso);
}

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** "Coffee", "Coffee & Books", "Coffee, Books & 2 more" */
export function listInterests(items: string[], max = 2): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length <= max) return `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`;
  return `${items.slice(0, max).join(", ")} & ${items.length - max} more`;
}
