import { cn } from "@/lib/utils";
import { getRarityColor, getRarityBg, getRarityLabel, getBadgeDefinition } from "@/lib/gamification";

interface BadgeCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  /** Show as locked/unearned */
  locked?: boolean;
  className?: string;
}

export function BadgeCard({
  slug,
  name,
  description,
  icon,
  earnedAt,
  locked = false,
  className,
}: BadgeCardProps) {
  const def = getBadgeDefinition(slug);
  const rarity = def?.rarity || "common";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all",
        locked
          ? "opacity-40 grayscale border-border bg-muted/30"
          : cn(getRarityBg(rarity), getRarityColor(rarity)),
        className
      )}
    >
      {/* Icon */}
      <span className={cn("text-2xl", locked && "opacity-50")}>
        {locked ? "🔒" : icon}
      </span>

      {/* Name */}
      <p className="font-semibold text-xs leading-tight">
        {locked ? "???" : name}
      </p>

      {/* Description */}
      {!locked && (
        <p className="text-[10px] opacity-70 leading-tight line-clamp-2">
          {description}
        </p>
      )}

      {/* Rarity badge */}
      {!locked && (
        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border", getRarityColor(rarity))}>
          {getRarityLabel(rarity)}
        </span>
      )}

      {/* Earned date */}
      {earnedAt && !locked && (
        <p className="text-[9px] opacity-50">
          {earnedAt.toLocaleDateString("ru-RU")}
        </p>
      )}
    </div>
  );
}
