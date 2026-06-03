"use client";

import { useState, useEffect } from "react";
import { Flame, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getActivityCalendarAction } from "@/actions/gamification.action";
import { getStreakStatus } from "@/lib/gamification";

interface StreakCalendarProps {
  streak: number;
  className?: string;
}

/**
 * GitHub-style contribution calendar showing daily learning activity.
 * Green squares = days with activity, darker = more chapters completed.
 */
export function StreakCalendar({ streak, className }: StreakCalendarProps) {
  const [calendarData, setCalendarData] = useState<
    { date: string; count: number; xp: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCalendar() {
      const result = await getActivityCalendarAction("default-user", 365);
      if (result.success && result.data) {
        setCalendarData(result.data);
      }
      setIsLoading(false);
    }
    loadCalendar();
  }, []);

  const streakInfo = getStreakStatus(streak);

  // Group calendar data into weeks (columns) for the grid layout
  const weeks: { date: string; count: number; xp: number }[][] = [];
  let currentWeek: { date: string; count: number; xp: number }[] = [];

  // Pad the first week to start on Monday
  if (calendarData.length > 0) {
    const firstDay = new Date(calendarData[0].date).getDay();
    const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < mondayOffset; i++) {
      currentWeek.push({ date: "", count: -1, xp: 0 });
    }
  }

  for (const day of calendarData) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  function getColor(count: number): string {
    if (count < 0) return "bg-transparent"; // padding
    if (count === 0) return "bg-muted/50";
    if (count === 1) return "bg-[#478CBF]/30";
    if (count === 2) return "bg-[#478CBF]/50";
    if (count === 3) return "bg-[#478CBF]/70";
    return "bg-[#478CBF]";
  }

  const monthLabels = (() => {
    const labels: { label: string; colSpan: number }[] = [];
    let lastMonth = -1;
    for (const week of weeks) {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const month = new Date(firstValidDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: new Date(firstValidDay.date).toLocaleDateString("ru-RU", { month: "short" }),
            colSpan: 1,
          });
          lastMonth = month;
        } else {
          labels[labels.length - 1].colSpan++;
        }
      }
    }
    return labels;
  })();

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-orange-500" />
          <span className="font-semibold">Стрик</span>
        </div>
        <div className="h-24 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Streak header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-orange-500" />
          <span className="font-semibold">Стрик</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={streakInfo.color}>{streakInfo.emoji}</span>
          <span className="font-bold tabular-nums">{streak}</span>
          <span className="text-muted-foreground">
            {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}
          </span>
        </div>
      </div>

      {/* Streak message */}
      <p className={cn("text-sm", streakInfo.color)}>{streakInfo.message}</p>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex gap-0.5 mb-1 ml-0">
          {monthLabels.map((m, i) => (
            <div
              key={i}
              className="text-[9px] text-muted-foreground"
              style={{ width: `${m.colSpan * 11}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-0.5">
              {week.map((day, dayIdx) => (
                <Tooltip key={dayIdx}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "size-[9px] rounded-[2px] transition-colors",
                        getColor(day.count)
                      )}
                    />
                  </TooltipTrigger>
                  {day.date && (
                    <TooltipContent side="top" className="text-xs">
                      <p>
                        {new Date(day.date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {day.count > 0 ? (
                        <p className="text-muted-foreground">
                          {day.count} {day.count === 1 ? "глава" : "главы"} · {day.xp} XP
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Нет активности</p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 text-[9px] text-muted-foreground">
          <span>Меньше</span>
          <div className="size-[9px] rounded-[2px] bg-muted/50" />
          <div className="size-[9px] rounded-[2px] bg-[#478CBF]/30" />
          <div className="size-[9px] rounded-[2px] bg-[#478CBF]/50" />
          <div className="size-[9px] rounded-[2px] bg-[#478CBF]/70" />
          <div className="size-[9px] rounded-[2px] bg-[#478CBF]" />
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
}
