'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChallengeProps {
  id?: string;
  title?: string;
  difficulty?: 'green' | 'yellow' | 'red' | 'easy' | 'medium' | 'hard';
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

export function Challenge({ id, title, difficulty, children, className }: ChallengeProps) {
  const [expanded, setExpanded] = useState(false);
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
