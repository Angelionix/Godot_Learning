import { cn } from '@/lib/utils';

interface InsightProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Insight({ title, children, className }: InsightProps) {
  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:border-blue-400 dark:bg-blue-950/30',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
        <span className="text-lg">💡</span>
        <span>{title}</span>
      </div>
      <div className="text-sm text-blue-900 dark:text-blue-100 [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
