import Link from 'next/link';
import { ArrowRight, Lock, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAllProjects, type ProjectMeta } from '@/lib/content';
import { db } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Путь обучения',
  description: 'Интерактивная карта из 6 проектов Godot: от Clicker/Idle на GDScript до 3D Adventure на C++. Проходи проекты по порядку и отслеживай прогресс.',
  openGraph: {
    title: 'Путь обучения — Godot Learning',
    description: '6 проектов Godot от GDScript до C++: кликер, шутер, метроидвания, Tower Defense, 3D Adventure, Performance Demo.',
  },
};

export default async function LearnPage() {
  const projects = getAllProjects();

  // Get progress for all projects
  const progressEntries = await db.progress.findMany({
    where: {
      userId: 'default-user',
      completed: true,
    },
  });

  // Build progress map: projectSlug -> Set of completed chapter slugs
  const progressMap: Record<string, Set<string>> = {};
  for (const entry of progressEntries) {
    if (!progressMap[entry.projectSlug]) {
      progressMap[entry.projectSlug] = new Set();
    }
    progressMap[entry.projectSlug].add(entry.chapterSlug);
  }

  // Calculate total progress
  let totalChapters = 0;
  let totalCompleted = 0;
  for (const project of projects) {
    const projectCompleted =
      progressMap[project.projectSlug]
        ? project.chapters.filter((ch) =>
            progressMap[project.projectSlug].has(ch.slug),
          ).length
        : 0;
    totalChapters += project.chapters.length;
    totalCompleted += projectCompleted;
  }

  const totalProgressPercent =
    totalChapters > 0 ? (totalCompleted / totalChapters) * 100 : 0;
  const completedProjects = projects.filter(
    (p) =>
      progressMap[p.projectSlug] &&
      p.chapters.every((ch) => progressMap[p.projectSlug].has(ch.slug)),
  ).length;

  return (
    <div className="flex flex-col gap-8 px-4 md:px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Путь обучения</h1>
        <p className="mt-2 text-muted-foreground">
          Проходи проекты по порядку — каждый следующий строится на знаниях
          предыдущего.
        </p>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Общий прогресс</span>
          <span className="text-muted-foreground">
            {Math.round(totalProgressPercent)}%
          </span>
        </div>
        <Progress value={totalProgressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Завершено {completedProjects} из {projects.length} проектов ·{' '}
          {totalCompleted} из {totalChapters} глав
        </p>
      </div>

      {/* Visual Map */}
      <div className="relative flex flex-col gap-0">
        {projects.map((project, index) => {
          const isLast = index === projects.length - 1;
          const projectProgress = progressMap[project.projectSlug];
          const completedChaptersCount = projectProgress
            ? project.chapters.filter((ch) => projectProgress.has(ch.slug))
                .length
            : 0;
          const projectPercent =
            project.chapters.length > 0
              ? (completedChaptersCount / project.chapters.length) * 100
              : 0;
          const totalXp = project.chapters.reduce((sum, ch) => sum + ch.xp, 0);
          const totalTime = project.chapters.reduce(
            (sum, ch) => sum + ch.estimatedTime,
            0,
          );

          return (
            <div key={project.projectSlug} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-border z-0" />
              )}

              {/* Project Node */}
              <Link
                href={`/learn/${project.projectSlug}`}
                className="block group"
              >
                <Card className="relative z-10 transition-all duration-200 hover:border-[#478CBF]/50 hover:shadow-md mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      {/* Step indicator */}
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground border-2 border-border group-hover:border-[#478CBF]/50 group-hover:text-[#478CBF] transition-colors">
                        {project.order}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {project.title}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0"
                          >
                            {project.language}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Проект {project.order} · {project.difficulty}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#478CBF] transition-colors" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Meta info */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="size-3" />
                        <span>{project.chapters.length} глав</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>~{Math.round(totalTime / 60)} ч</span>
                      </div>
                      <span className="text-[#478CBF] font-medium">
                        {totalXp} XP
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#478CBF] transition-all"
                          style={{ width: `${projectPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {projectPercent > 0
                          ? `${completedChaptersCount}/${project.chapters.length}`
                          : 'Не начат'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex justify-center -my-1 z-10 relative">
                  <div className="size-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-start gap-4 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#478CBF]/10">
            <Lock className="size-5 text-[#478CBF]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Рекомендуемый порядок</h3>
            <p className="text-sm text-muted-foreground">
              Проекты расположены по возрастанию сложности. Каждый следующий
              проект использует знания из предыдущих. Рекомендуем проходить их по
              порядку, но ты можешь начать с любого.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
