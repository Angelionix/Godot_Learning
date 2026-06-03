"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markChapterCompleteAction } from "@/actions/progress.action";
import { useGamificationStore } from "@/store/gamification-store";

interface ChapterCompleteButtonProps {
  projectSlug: string;
  chapterSlug: string;
  isCompleted: boolean;
  xp: number;
}

export function ChapterCompleteButton({
  projectSlug,
  chapterSlug,
  isCompleted: initialCompleted,
  xp,
}: ChapterCompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<
    { slug: string; name: string; description: string; icon: string }[]
  >([]);
  const addPendingBadge = useGamificationStore((s) => s.addPendingBadge);
  const refresh = useGamificationStore((s) => s.refresh);

  async function handleComplete() {
    setIsLoading(true);
    try {
      const result = await markChapterCompleteAction(projectSlug, chapterSlug, xp);
      if (result.success) {
        setIsCompleted(true);
        setXpEarned(result.xpEarned);

        // Show new badges if any
        if (result.newBadges && result.newBadges.length > 0) {
          setEarnedBadges(result.newBadges);
          for (const badge of result.newBadges) {
            addPendingBadge(badge);
          }
        }

        // Refresh gamification store data
        refresh();
      }
    } catch (error) {
      console.error("Failed to mark chapter complete:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isCompleted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Глава выполнена! {xpEarned > 0 && `+${xpEarned} XP`}
          </span>
        </div>

        {/* Show newly earned badges */}
        {earnedBadges.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
            <div className="flex items-center gap-1.5 text-sm font-medium text-purple-700 dark:text-purple-300">
              <Sparkles className="size-4" />
              Новые достижения!
            </div>
            {earnedBadges.map((badge) => (
              <div key={badge.slug} className="flex items-center gap-2 text-sm">
                <span>{badge.icon}</span>
                <span className="font-medium">{badge.name}</span>
                <span className="text-muted-foreground text-xs">— {badge.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={isLoading}
      className="w-full gap-2 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Сохраняем...
        </>
      ) : (
        <>
          <CheckCircle2 className="size-4" />
          Я выполнил (+{xp} XP)
        </>
      )}
    </Button>
  );
}
