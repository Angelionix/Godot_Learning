import { cn } from '@/lib/utils';

interface BridgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Bridge({ children, className }: BridgeProps) {
  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-6 dark:border-purple-400 dark:bg-purple-950/30',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-lg font-bold text-purple-700 dark:text-purple-300">
        <span>🌉</span>
        <span>Мост к следующему проекту</span>
      </div>
      <div className="text-sm [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
