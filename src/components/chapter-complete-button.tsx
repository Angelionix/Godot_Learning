'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markChapterCompleteAction } from '@/actions/progress.action';

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

  async function handleComplete() {
    setIsLoading(true);
    try {
      const result = await markChapterCompleteAction(projectSlug, chapterSlug, xp);
      if (result.success) {
        setIsCompleted(true);
        setXpEarned(result.xpEarned);
      }
    } catch (error) {
      console.error('Failed to mark chapter complete:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Глава выполнена! {xpEarned > 0 && `+${xpEarned} XP`}
        </span>
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
