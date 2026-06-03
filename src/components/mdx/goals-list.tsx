import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface GoalsListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * GoalsList — визуально выделенный блок для списка целей обучения.
 * Каждый li элемент получает иконку и акцентный фон.
 */
export function GoalsList({ children, className }: GoalsListProps) {
  return (
    <div
      className={cn(
        'my-6 rounded-xl border border-[var(--color-godot-blue)]/20 bg-[var(--color-godot-blue)]/5 dark:bg-[var(--color-godot-blue)]/10 p-4 md:p-5',
        className,
      )}
    >
      <div className="space-y-2.5 [&_ol]:list-none [&_ol]:pl-0 [&_ol]:space-y-2.5 [&_li]:flex [&_li]:items-start [&_li]:gap-3 [&_li]:p-2.5 [&_li]:rounded-lg [&_li]:bg-background/60 [&_li]:dark:bg-background/30 [&_li]:border [&_li]:border-border/50">
        {children}
      </div>
    </div>
  );
}

interface GoalItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * GoalItem — отдельный элемент цели с иконкой-галочкой.
 */
export function GoalItem({ children, className }: GoalItemProps) {
  return (
    <li className={cn('flex items-start gap-3 p-2.5 rounded-lg bg-background/60 dark:bg-background/30 border border-border/50', className)}>
      <CheckCircle2 className="size-5 flex-shrink-0 text-[var(--color-godot-blue)] mt-0.5" />
      <div className="text-sm leading-6">{children}</div>
    </li>
  );
}
