'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleHintProps {
  xpPenalty?: number;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleHint({ xpPenalty = 5, children, className }: CollapsibleHintProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('my-4', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80"
      >
        <span>{isOpen ? '🔽' : '▶️'}</span>
        <span>Подсказка</span>
        {xpPenalty > 0 && (
          <span className="text-xs text-muted-foreground">(-{xpPenalty} XP)</span>
        )}
      </button>
      {isOpen && (
        <div className="mt-2 rounded-md border bg-muted/50 p-4 text-sm">{children}</div>
      )}
    </div>
  );
}
