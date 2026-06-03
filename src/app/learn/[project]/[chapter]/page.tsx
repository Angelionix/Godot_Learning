import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  // Extract headings for TOC
  const headings = extractHeadingsFromContent(chapterContent.content);

  return (
    <div className="flex w-full">
      {/* Center: MDX Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-6 px-4 md:px-6 py-8 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/learn" className="hover:text-foreground transition-colors">
              Обучение
            </Link>
            <span>/</span>
            <Link
              href={`/learn/${projectSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {projectMeta.title}
            </Link>
            <span>/</span>
            <span className="text-foreground">{chapterContent.meta.title}</span>
          </div>

          {/* Chapter Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {currentIndex >= 0 ? `Глава ${currentIndex + 1}` : 'Введение'}
              </Badge>
              <Badge variant="secondary">{projectMeta.title}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {chapterContent.meta.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                <span>
                  {currentIndex >= 0
                    ? `Глава ${currentIndex + 1} из ${chapters.length}`
                    : 'Введение'}
                </span>
              </div>
              {estimatedMinutes > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>~{estimatedMinutes} мин</span>
                </div>
              )}
              <span className="text-[#478CBF] font-medium">
                +{chapterContent.meta.xp} XP
              </span>
            </div>
          </div>

          {/* Chapter Content - MDX Rendered */}
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:p-0 prose-pre:bg-transparent">
            <MDXRemote
              source={chapterContent.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
                },
              }}
            />
          </article>

          {/* Complete Button */}
          <div className="pt-2">
            <ChapterCompleteButton
              projectSlug={projectSlug}
              chapterSlug={chapterSlug}
              isCompleted={isCompleted}
              xp={chapterContent.meta.xp}
            />
          </div>

          {/* Chapter Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {navigation.prev ? (
              <Link href={`/learn/${projectSlug}/${navigation.prev.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft className="size-3" />
                  {navigation.prev.title}
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${projectSlug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft className="size-3" />
                  К проекту
                </Button>
              </Link>
            )}
            {navigation.next ? (
              <Link href={`/learn/${projectSlug}/${navigation.next.slug}`}>
                <Button
                  size="sm"
                  className="gap-1 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white"
                >
                  {navigation.next.title}
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${projectSlug}`}>
                <Button
                  size="sm"
                  className="gap-1 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white"
                >
                  Завершить проект
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Right: Table of Contents (desktop only) */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0 border-l border-border bg-sidebar/50">
          <div className="sticky top-20">
            <TableOfContentsWrapper headings={headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
