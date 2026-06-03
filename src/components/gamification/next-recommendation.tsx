import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserProgressSummary } from "@/repositories/progress.repository";

interface NextRecommendationProps {
  data: UserProgressSummary;
  className?: string;
}

/**
 * Smart recommendation widget: "What should I study next?"
 * Finds the first incomplete chapter and suggests it.
 */
export function NextRecommendation({ data, className }: NextRecommendationProps) {
  // Find the next incomplete chapter
  let nextProjectSlug: string | null = null;
  let nextChapterSlug: string | null = null;
  let nextProjectTitle: string | null = null;
  let nextChapterTitle: string | null = null;

  for (const proj of data.projectProgress) {
    if (proj.completedChapters >= proj.totalChapters) continue;

    const incompleteChapter = proj.chapters.find((ch) => !ch.completed);
    if (incompleteChapter) {
      nextProjectSlug = proj.projectSlug;
      nextChapterSlug = incompleteChapter.chapterSlug;
      nextProjectTitle = proj.projectSlug
        .replace(/project-\d+-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      nextChapterTitle = incompleteChapter.chapterSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      break;
    }
  }

  if (!nextProjectSlug) {
    return (
      <Card className={className}>
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Lightbulb className="size-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Курс пройден!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Поздравляем! Вы завершили все проекты курса. Вы настоящий мастер Godot!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#478CBF]/10">
          <Lightbulb className="size-5 text-[#478CBF]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Что дальше?</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Продолжите с того места, где остановились:
          </p>
          <Link href={`/learn/${nextProjectSlug}/${nextChapterSlug}`} className="mt-2 inline-block">
            <Button size="sm" className="gap-1.5 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white h-8">
              Продолжить обучение
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
