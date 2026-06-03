"use client";

import { useEffect } from "react";
import { Zap, Flame, TrendingUp } from "lucide-react";
import { useGamificationStore } from "@/store/gamification-store";
import { xpToNextLevel } from "@/lib/gamification";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact XP/Level/Streak widget for the Header.
 * Shows: level number, XP bar, streak flame.
 */
export function XpLevelBadge() {
  const { data, fetchGamificationData } = useGamificationStore();

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  if (!data) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground animate-pulse">
        <Zap className="size-3.5" />
        <span>Загрузка...</span>
      </div>
    );
  }

  const levelInfo = xpToNextLevel(data.xp);
  const streakStatus = data.streak > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Level badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#478CBF]/10 border border-[#478CBF]/20 text-xs font-medium">
            <TrendingUp className="size-3.5 text-[#478CBF]" />
            <span className="text-[#478CBF]">Ур. {data.level}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Уровень {data.level}</p>
          <p className="text-muted-foreground">
            {levelInfo.current} / {levelInfo.needed} XP до уровня {data.level + 1}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* XP mini-bar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 text-xs">
            <Zap className="size-3.5 text-yellow-500" />
            <span className="font-medium tabular-nums">{data.xp} XP</span>
            <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#478CBF] transition-all"
                style={{ width: `${levelInfo.progress * 100}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{data.xp} XP всего</p>
          <p className="text-muted-foreground">
            До следующего уровня: {levelInfo.needed - levelInfo.current} XP
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Streak flame */}
      {streakStatus && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-medium">
              <Flame className="size-3.5 text-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">{data.streak}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>Стрик: {data.streak} {data.streak === 1 ? "день" : data.streak < 5 ? "дня" : "дней"}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
