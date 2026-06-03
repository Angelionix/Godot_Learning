'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

interface TableOfContentsProps {
  headings: TocHeading[];
  className?: string;
}

export function extractHeadingsFromContent(content: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate an ID the same way MDX/rehype does: lowercase, replace spaces with hyphens, strip special chars
    const id = text
      .toLowerCase()
      .replace(/[^\w\sа-яёА-ЯЁ-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    headings.push({ id, text, level });
  }

  return headings;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(true);

  // Intersection observer for active heading tracking
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading from top
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Use the one closest to the top
          const sortedByTop = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(sortedByTop[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('flex flex-col', className)}>
        <CollapsibleTrigger
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors w-full text-left"
        >
          <List className="size-4 shrink-0" />
          <span className="flex-1">Содержание</span>
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <nav className="flex flex-col gap-0.5 px-3 pb-3">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    heading.level === 3 && 'pl-6',
                    activeId === heading.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span className="truncate">{heading.text}</span>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
