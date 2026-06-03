import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getProjectMeta,
  getProjectChapters,
  getAllProjects,
} from '@/lib/content';
import { db } from '@/lib/db';

export function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((p) => ({ project: p.projectSlug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: projectSlug } = await params;

  const projectMeta = getProjectMeta(projectSlug);
  if (!projectMeta) {
    notFound();
  }

  const chapters = getProjectChapters(projectSlug);

  // Get real progress from DB
  const progressEntries = await db.progress.findMany({
    where: {
      userId: 'default-user',
      projectSlug,
      completed: true,
    },
  });
  const completedSlugs = new Set(progressEntries.map((p: { chapterSlug: string }) => p.chapterSlug));
  const completedCount = chapters.filter((ch) =>
    completedSlugs.has(ch.slug),
  ).length;
  const progressPercent =
    chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0;

  // Find previous/next project for navigation
  const allProjects = getAllProjects();
  const projectIndex = allProjects.findIndex(
    (p) => p.projectSlug === projectSlug,
  );
  const prevProject =
    projectIndex > 0 ? allProjects[projectIndex - 1] : null;
  const nextProject =
    projectIndex < allProjects.length - 1
      ? allProjects[projectIndex + 1]
      : null;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-8 max-w-3xl mx-auto">
      {/* Project Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/learn" className="hover:text-foreground transition-colors">
            Обучение
          </Link>
          <span>/</span>
          <span>Проект {projectMeta.order}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {projectMeta.title}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline">{projectMeta.language}</Badge>
          <span className="text-xs text-muted-foreground">
            {projectMeta.difficulty}
          </span>
        </div>
        <p className="mt-3 text-muted-foreground">{projectMeta.description}</p>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Прогресс</span>
          <span className="text-muted-foreground">
            {completedCount} / {chapters.length} глав
          </span>
        </div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#478CBF] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tags / Skills */}
      {projectMeta.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Навыки</h3>
          <div className="flex flex-wrap gap-1.5">
            {projectMeta.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Chapters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Главы</h3>
        <div className="flex flex-col gap-2">
          {chapters.map((chapter, idx) => {
            const isCompleted = completedSlugs.has(chapter.slug);

            return (
              <Link
                key={chapter.slug}
                href={`/learn/${projectSlug}/${chapter.slug}`}
                className="group"
              >
                <Card className="transition-all duration-200 hover:border-[#478CBF]/50 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                          : 'bg-muted text-muted-foreground group-hover:bg-[#478CBF]/10 group-hover:text-[#478CBF]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {chapter.title}
                      </span>
                      {chapter.estimatedTime > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ~{chapter.estimatedTime} мин
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#478CBF] font-medium">
                        +{chapter.xp} XP
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#478CBF] transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sprint section */}
      {projectMeta.sprint && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Финальный спринт</h3>
          <Link
            href={`/learn/${projectSlug}/${projectMeta.sprint.slug}`}
            className="group block"
          >
            <Card className="border-dashed border-amber-400/50 transition-all duration-200 hover:border-amber-400 hover:shadow-sm">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-sm">
                  🏁
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">
                    {projectMeta.sprint.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600 font-medium">
                    +{projectMeta.sprint.xp} XP
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Bridge to next project */}
      {projectMeta.bridge && (
        <Card className="border-dashed border-purple-300 dark:border-purple-700">
          <CardContent className="flex items-start gap-3 pt-6">
            <span className="text-xl">🌉</span>
            <div>
              <h3 className="font-semibold text-sm">Мост к следующему проекту</h3>
              <p className="text-xs text-muted-foreground mt-1">
                После завершения этого проекта переходите к:{' '}
                <Link
                  href={`/learn/${projectMeta.bridge.nextProject}`}
                  className="text-[#478CBF] hover:underline font-medium"
                >
                  {projectMeta.bridge.nextTitle}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation between projects */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {prevProject ? (
          <Link href={`/learn/${prevProject.projectSlug}`}>
            <Button variant="outline" size="sm">
              ← {prevProject.title}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextProject ? (
          <Link href={`/learn/${nextProject.projectSlug}`}>
            <Button variant="outline" size="sm">
              {nextProject.title} →
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
