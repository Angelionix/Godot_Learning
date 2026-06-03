'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidDiagramProps {
  children?: React.ReactNode;
  chart?: string;
  className?: string;
}

function getChartContent(props: MermaidDiagramProps): string {
  if (props.chart) return props.chart;
  if (typeof props.children === 'string') return props.children;
  return '';
}

export function MermaidDiagram({ children, chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const { resolvedTheme } = useTheme();

  const chartContent = getChartContent({ children, chart, className });

  const renderDiagram = useCallback(async () => {
    if (!chartContent.trim()) {
      setError('Пустая диаграмма');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const mermaid = (await import('mermaid')).default;

      const isDark = resolvedTheme === 'dark';
      const theme = isDark ? 'dark' : 'default';

      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });

      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      const { svg } = await mermaid.render(id, chartContent.trim());
      setSvgHtml(svg);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка рендеринга диаграммы');
    } finally {
      setIsLoading(false);
    }
  }, [chartContent, resolvedTheme]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-sm text-muted-foreground',
          className
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        <span>Загрузка диаграммы...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/30 bg-destructive/5', className)}>
        <div className="flex items-center gap-2 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Ошибка рендеринга диаграммы</span>
        </div>
        <pre className="overflow-x-auto border-t border-destructive/20 bg-muted/30 p-3 text-xs text-muted-foreground">
          <code>{chartContent}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'mermaid-diagram overflow-x-auto rounded-lg border border-border bg-muted/10 p-4 [&>svg]:mx-auto [&>svg]:max-w-full',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
