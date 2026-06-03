import { cn } from '@/lib/utils';

interface CalloutProps {
  type?: 'info' | 'warning' | 'danger' | 'tip';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutStyles = {
  info: 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30',
  warning: 'border-yellow-500 bg-yellow-50 dark:border-yellow-400 dark:bg-yellow-950/30',
  danger: 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/30',
  tip: 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950/30',
};

const calloutIcons = {
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🚫',
  tip: '✅',
};

export function Callout({ type = 'info', title, children, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 p-4',
        calloutStyles[type],
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span>{calloutIcons[type]}</span>
        {title && <span>{title}</span>}
      </div>
      <div className="callout-list text-sm [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ol]:my-3 [&>ol]:space-y-2 [&>ol]:pl-5 [&>ol]:list-decimal [&>ul]:my-3 [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc [&_li]:pl-2 [&_li]:leading-6 [&_li::marker]:font-semibold [&_ol_li::marker]:font-bold">{children}</div>
    </div>
  );
}
