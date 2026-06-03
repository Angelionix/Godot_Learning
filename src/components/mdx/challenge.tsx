'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useChapterContext } from './chapter-context';

// Lazy-load the interactive challenge (Monaco is heavy)
const InteractiveChallenge = dynamic(
  () => import('@/components/playground/interactive-challenge'),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 rounded-xl border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-300/40 dark:bg-yellow-500/20 rounded" />
            <div className="h-4 w-24 bg-yellow-300/40 dark:bg-yellow-500/20 rounded" />
            <div className="h-5 w-16 bg-yellow-300/40 dark:bg-yellow-500/20 rounded-full" />
          </div>
        </div>
        {/* Editor skeleton */}
        <div className="border-t border-yellow-400/20">
          <div className="h-[250px] bg-gray-950/50 dark:bg-gray-950/70 p-3 space-y-2">
            <div className="flex gap-2">
              <div className="h-3 w-20 bg-gray-700/50 rounded" />
              <div className="h-3 w-32 bg-gray-700/50 rounded" />
            </div>
            <div className="h-3 w-3/4 bg-gray-700/40 rounded" />
            <div className="h-3 w-1/2 bg-gray-700/40 rounded" />
            <div className="h-3 w-2/3 bg-gray-700/40 rounded" />
            <div className="h-3 w-1/3 bg-gray-700/40 rounded" />
          </div>
        </div>
        {/* Button skeleton */}
        <div className="px-4 py-3 flex gap-2">
          <div className="h-9 w-24 bg-pink-400/20 rounded-lg" />
          <div className="h-9 w-28 bg-amber-400/20 rounded-lg" />
        </div>
        {/* Loading text */}
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          Загрузка редактора кода...
        </div>
      </div>
    ),
  }
);

interface ChallengeProps {
  id?: string;
  title?: string;
  difficulty?: 'green' | 'yellow' | 'red' | 'easy' | 'medium' | 'hard';
  /** Starter code for the interactive editor */
  starterCode?: string;
  /** Reference solution code */
  solutionCode?: string;
  /** JSON string of test cases (TestCase[]) */
  testCases?: string;
  /** JSON string of hints (string[]) */
  hints?: string;
  /** XP reward */
  xp?: number;
  /** XP penalty per hint */
  xpPenalty?: number;
  /** Interactive mode: "editor" for Monaco editor, "text" for plain text (legacy) */
  mode?: 'editor' | 'text';
  /** Slug of the project this challenge belongs to */
  projectSlug?: string;
  /** Slug of the chapter this challenge belongs to */
  chapterSlug?: string;
  children: React.ReactNode;
  className?: string;
}

const difficultyConfig: Record<string, { label: string; border: string; bg: string }> = {
  green: { label: '🟢 Базовый', border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  yellow: { label: '🟡 Продвинутый', border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  red: { label: '🔴 Экспертный', border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  easy: { label: '🟢 Базовый', border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  medium: { label: '🟡 Продвинутый', border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  hard: { label: '🔴 Экспертный', border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
};

const defaultConfig = { label: '🎯 Микровызов', border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' };

export function Challenge({
  id,
  title,
  difficulty,
  starterCode,
  solutionCode,
  testCases,
  hints,
  xp,
  xpPenalty,
  mode,
  children,
  className,
  projectSlug: projectSlugProp,
  chapterSlug: chapterSlugProp,
}: ChallengeProps) {
  const [expanded, setExpanded] = useState(false);
  const chapterContext = useChapterContext();
  const projectSlug = projectSlugProp || chapterContext.projectSlug;
  const chapterSlug = chapterSlugProp || chapterContext.chapterSlug;

  // If mode is 'editor' or we have starterCode/testCases, use interactive mode
  const isInteractive = mode === 'editor' || !!starterCode || !!testCases;

  if (isInteractive) {
    // Parse test cases and hints from JSON strings
    let parsedTestCases: any[] = [];
    let parsedHints: string[] = [];

    try {
      if (testCases) parsedTestCases = JSON.parse(testCases);
    } catch {
      console.warn('Failed to parse test cases for challenge', id);
    }

    try {
      if (hints) parsedHints = JSON.parse(hints);
    } catch {
      console.warn('Failed to parse hints for challenge', id);
    }

    return (
      <InteractiveChallenge
        id={id || `challenge-${Math.random().toString(36).slice(2, 8)}`}
        title={title}
        difficulty={difficulty}
        starterCode={starterCode}
        solutionCode={solutionCode}
        testCases={parsedTestCases}
        hints={parsedHints}
        xp={xp}
        xpPenalty={xpPenalty}
        mode="validate"
        projectSlug={projectSlug}
        chapterSlug={chapterSlug}
      >
        {children}
      </InteractiveChallenge>
    );
  }

  // Legacy text-only mode
  const config = (difficulty && difficultyConfig[difficulty]) || defaultConfig;

  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 p-4',
        config.border,
        config.bg,
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span>🎯 Микровызов</span>
          <span className="text-sm">{config.label}</span>
          {title && <span className="text-sm">· {title}</span>}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
        >
          {expanded ? 'Свернуть ▲' : 'Развернуть ▼'}
        </button>
      </div>
      <div className={cn('text-sm', !expanded && 'line-clamp-3')}>{children}</div>
    </div>
  );
}
