import { Zap, TrendingUp } from "lucide-react";
import { xpToNextLevel } from "@/lib/gamification";

interface LevelProgressProps {
  xp: number;
  level: number;
  className?: string;
}

/**
 * Visual level progress bar with XP counter.
 */
export function LevelProgress({ xp, level, className }: LevelProgressProps) {
  const levelInfo = xpToNextLevel(xp);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-full bg-[#478CBF]/10 border border-[#478CBF]/30">
            <TrendingUp className="size-4 text-[#478CBF]" />
          </div>
          <div>
            <p className="font-bold text-sm">Уровень {level}</p>
            <p className="text-xs text-muted-foreground">
              {levelInfo.current} / {levelInfo.needed} XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-[#478CBF]">
          <Zap className="size-4" />
          <span className="tabular-nums">{xp}</span>
          <span className="text-muted-foreground font-normal text-xs">XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#478CBF] to-[#45B853] transition-all duration-500"
          style={{ width: `${levelInfo.progress * 100}%` }}
        />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
      </div>

      <p className="mt-1 text-[10px] text-muted-foreground text-right">
        До уровня {level + 1}: {levelInfo.needed - levelInfo.current} XP
      </p>
    </div>
  );
}
