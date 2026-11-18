import {
  Bike,
  BookOpen,
  Camera,
  ChefHat,
  Coffee,
  Dumbbell,
  Film,
  Footprints,
  Gamepad2,
  Guitar,
  Mountain,
  Music,
  Palette,
  PenLine,
  Plane,
  Sparkles,
  Trophy,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

/** Best-effort icon for an interest label (decorative, so it's always aria-hidden). */
const RULES: [RegExp, LucideIcon][] = [
  [/cook|chef|baking|biryani/i, ChefHat],
  [/street food|food|kebab/i, Utensils],
  [/trek|hik|climb|mountain/i, Mountain],
  [/motorbike|cycling|bike/i, Bike],
  [/travel|road trip/i, Plane],
  [/coffee|chai/i, Coffee],
  [/guitar/i, Guitar],
  [/music|vinyl|drum|karaoke|jazz|gig/i, Music],
  [/photo/i, Camera],
  [/book|read|poetry|philosophy/i, BookOpen],
  [/writ|calligraph/i, PenLine],
  [/film|theatre/i, Film],
  [/gam|fifa|anime|board/i, Gamepad2],
  [/surf|ocean|scuba|swim/i, Waves],
  [/run|dance|bhangra|garba/i, Footprints],
  [/yoga|badminton|tennis|basketball|football|volleyball|cricket|f1/i, Trophy],
  [/art|design|illustrat|textile|pottery|sketch|typography|architecture/i, Palette],
  [/gym|fitness/i, Dumbbell],
];

export function interestIcon(label: string): LucideIcon {
  return RULES.find(([re]) => re.test(label))?.[1] ?? Sparkles;
}
