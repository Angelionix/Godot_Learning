import { cn } from '@/lib/utils';

interface SprintProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sprint({ title, children, className }: SprintProps) {
  return (
    <div
      className={cn(
        'my-6 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 p-6 dark:border-amber-400 dark:bg-amber-950/30',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-300">
        <span>🏁</span>
        <span>Финальный спринт{title ? `: ${title}` : ''}</span>
      </div>
      <div className="text-sm [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
