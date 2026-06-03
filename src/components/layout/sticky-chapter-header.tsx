'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StickyChapterHeaderProps {
  title: string;
  chapterLabel: string;
  xp: number;
  estimatedMinutes: number;
}

/**
 * StickyChapterHeader — плавающая шапка с названием главы,
 * появляется при скролле вниз (когда Hero Card уходит из видимости).
 */
export function StickyChapterHeader({
  title,
  chapterLabel,
  xp,
  estimatedMinutes,
}: StickyChapterHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Показывать sticky-хедер после скролла на 250px (когда Hero Card уходит)
      setIsVisible(window.scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-2.5 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            variant="outline"
            className="border-[#478CBF]/40 text-[#478CBF] bg-[#478CBF]/10 shrink-0 text-xs"
          >
            {chapterLabel}
          </Badge>
          <h2 className="text-sm font-semibold truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          {estimatedMinutes > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              ~{estimatedMinutes} мин
            </span>
          )}
          <span className="flex items-center gap-1 text-[#478CBF] font-semibold">
            <Zap className="size-3" />
            +{xp} XP
          </span>
        </div>
      </div>
    </div>
  );
}
