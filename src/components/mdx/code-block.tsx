'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Check, Copy, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  showLineNumbers?: boolean;
  /** The raw code string (for copy functionality) */
  rawCode?: string;
  /** Language label (overrides className-derived label) */
  language?: string;
}

function extractLanguage(className?: string): string {
  if (!className) return '';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : '';
}

function extractCodeFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractCodeFromChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>;
    if (element.props.children) return extractCodeFromChildren(element.props.children);
  }
  return '';
}

export function CodeBlock({
  children,
  className,
  title,
  showLineNumbers = false,
  rawCode,
  language,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const codeToCopy = rawCode || extractCodeFromChildren(children);
  const langLabel = language || extractLanguage(className);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [codeToCopy]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Count lines for line numbers
  const lineCount = codeToCopy ? codeToCopy.split('\n').length : 0;

  return (
    <div className={cn('group relative rounded-lg border border-border overflow-hidden', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {title ? (
            <span className="font-medium">{title}</span>
          ) : (
            <>
              <FileCode className="size-3.5" />
              <span className="uppercase font-medium">{langLabel || 'код'}</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          aria-label="Скопировать код"
        >
          {copied ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Code content with optional line numbers */}
      <div className="relative">
        {showLineNumbers && lineCount > 0 && (
          <div className="pointer-events-none absolute left-0 top-0 flex flex-col border-r border-border bg-muted/20 px-3 py-4 text-right text-xs leading-[1.7] text-muted-foreground/50 select-none">
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i + 1}>{i + 1}</span>
            ))}
          </div>
        )}
        <div className={cn(showLineNumbers && lineCount > 0 && 'pl-12')}>
          {children}
        </div>
      </div>
    </div>
  );
}
