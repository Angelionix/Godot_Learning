import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Zap, CheckCircle2, List } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Insight,
  Callout,
  Challenge,
  Sprint,
  Bridge,
  CollapsibleHint,
  MermaidDiagram,
  CodeBlock,
} from '@/components/mdx';
import { ChapterCompleteButton } from '@/components/chapter-complete-button';
import {
  getChapterContent,
  getChapterNavigation,
  getProjectChapters,
  getProjectMeta,
  getAllProjects,
} from '@/lib/content';
import { extractHeadingsFromContent } from '@/lib/extract-headings';
import { TableOfContentsWrapper } from './toc-wrapper';
import { db } from '@/lib/db';

export function generateStaticParams() {
  const projects = getAllProjects();
  const params: { project: string; chapter: string }[] = [];
  for (const project of projects) {
    for (const chapter of project.chapters) {
      params.push({ project: project.projectSlug, chapter: chapter.slug });
    }
  }
  return params;
}

const mdxComponents = {
  Insight,
  Callout,
  Challenge,
  Sprint,
  Bridge,
  CollapsibleHint,
  MermaidDiagram,
  CodeBlock,
};

const rehypePrettyCodeOptions = {
  theme: 'github-dark',
  keepBackground: true,
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ project: string; chapter: string }>;
}) {
  const { project: projectSlug, chapter: chapterSlug } = await params;

  const projectMeta = getProjectMeta(projectSlug);
  if (!projectMeta) {
    notFound();
  }

  const chapterContent = getChapterContent(projectSlug, chapterSlug);
  if (!chapterContent) {
    notFound();
  }

  const chapters = getProjectChapters(projectSlug);
  const currentIndex = chapters.findIndex((ch) => ch.slug === chapterSlug);
  const navigation = getChapterNavigation(projectSlug, chapterSlug);

  // Check if chapter is completed
  const progressEntry = await db.progress.findUnique({
    where: {
      userId_projectSlug_chapterSlug: {
        userId: 'default-user',
        projectSlug,
        chapterSlug,
      },
    },
  });
  const isCompleted = progressEntry?.completed || false;

  const estimatedMinutes = chapterContent.meta.estimatedTime || 0;

  // Calculate project progress
  const totalChapters = chapters.length;
  const completedCount = await db.progress.count({
    where: {
      userId: 'default-user',
      projectSlug,
      completed: true,
    },
  });
  const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Extract headings for TOC
  const headings = extractHeadingsFromContent(chapterContent.content);

  return (
    <div className="flex w-full">
      {/* Center: MDX Content */}
      <div className="flex-1 min-w-0">
        <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/learn" className="hover:text-foreground transition-colors">
              Обучение
            </Link>
            <span className="text-border">/</span>
            <Link
              href={`/learn/${projectSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {projectMeta.title}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{chapterContent.meta.title}</span>
          </nav>

          {/* Chapter Hero Card */}
          <div className="relative rounded-xl border border-border bg-card p-6 mb-8 overflow-hidden">
            {/* Decorative gradient accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#478CBF] to-[#45B853]" />

            <div className="pl-4">
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="border-[#478CBF]/40 text-[#478CBF] bg-[#478CBF]/10"
                >
                  {currentIndex >= 0 ? `Глава ${currentIndex + 1}` : 'Введение'}
                </Badge>
                <Badge variant="secondary">{projectMeta.title}</Badge>
                {isCompleted && (
                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                    <CheckCircle2 className="size-3 mr-1" />
                    Пройдено
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                {chapterContent.meta.title}
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-4" />
                  <span>
                    {currentIndex >= 0
                      ? `Глава ${currentIndex + 1} из ${totalChapters}`
                      : 'Введение'}
                  </span>
                </div>
                {estimatedMinutes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>~{estimatedMinutes} мин</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#478CBF]">
                  <Zap className="size-4" />
                  <span className="font-semibold">+{chapterContent.meta.xp} XP</span>
                </div>
                {headings.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <List className="size-4" />
                    <span>{headings.length} секций</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {completedCount}/{totalChapters} глав
                </span>
              </div>
            </div>
          </div>

          {/* Mobile TOC (collapsed) */}
          {headings.length > 0 && (
            <div className="xl:hidden mb-6">
              <TableOfContentsWrapper headings={headings} />
            </div>
          )}

          {/* Chapter Content - MDX Rendered */}
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:p-0 prose-pre:bg-transparent">
            <MDXRemote
              source={chapterContent.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
                },
              }}
            />
          </article>

          {/* Complete Button */}
          <div className="mt-8 pt-6 border-t border-border">
            <ChapterCompleteButton
              projectSlug={projectSlug}
              chapterSlug={chapterSlug}
              isCompleted={isCompleted}
              xp={chapterContent.meta.xp}
            />
          </div>

          {/* Chapter Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {navigation.prev ? (
              <Link href={`/learn/${projectSlug}/${navigation.prev.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <ArrowLeft className="size-3.5" />
                  <span className="max-w-[140px] truncate">{navigation.prev.title}</span>
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${projectSlug}`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <ArrowLeft className="size-3.5" />
                  К проекту
                </Button>
              </Link>
            )}
            {navigation.next ? (
              <Link href={`/learn/${projectSlug}/${navigation.next.slug}`}>
                <Button
                  size="sm"
                  className="gap-1.5 h-9 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white"
                >
                  <span className="max-w-[140px] truncate">{navigation.next.title}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${projectSlug}`}>
                <Button
                  size="sm"
                  className="gap-1.5 h-9 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white"
                >
                  Завершить проект
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Right: Table of Contents (desktop only) */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-60 shrink-0 border-l border-border bg-sidebar/30">
          <div className="sticky top-20 p-4">
            <TableOfContentsWrapper headings={headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
