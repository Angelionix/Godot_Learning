'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Lazy-load the interactive challenge (Monaco is heavy)
const InteractiveChallenge = dynamic(
  () => import('@/components/playground/interactive-challenge'),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 rounded-xl border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 p-4">
        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          Загрузка редактора...
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
}: ChallengeProps) {
  const [expanded, setExpanded] = useState(false);

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
