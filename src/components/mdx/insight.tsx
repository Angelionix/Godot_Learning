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
      <div className="callout-list text-sm text-blue-900 dark:text-blue-100 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ol]:my-3 [&>ol]:space-y-2 [&>ol]:pl-5 [&>ol]:list-decimal [&>ul]:my-3 [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc [&_li]:pl-2 [&_li]:leading-6 [&_li::marker]:font-semibold [&_ol_li::marker]:font-bold">
        {children}
      </div>
    </div>
  );
}
