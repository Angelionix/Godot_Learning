import { CheckCircle2, BookOpen, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projects } from "@/lib/projects";

interface ProjectProgressCardProps {
  projectSlug: string;
  completedChapters: number;
  totalChapters: number;
  className?: string;
}

/**
 * Compact progress card for a single project on the dashboard.
 */
export function ProjectProgressCard({
  projectSlug,
  completedChapters,
  totalChapters,
  className,
}: ProjectProgressCardProps) {
  const project = projects.find((p) => p.slug === projectSlug);
  if (!project) return null;

  const percent = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const isComplete = completedChapters >= totalChapters;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card", className)}>
      {/* Project icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
        {project.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{project.title}</span>
          <Badge variant="outline" className="text-[9px] shrink-0">
            {project.language}
          </Badge>
          {isComplete && (
            <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isComplete
                  ? "bg-green-500"
                  : "bg-[#478CBF]"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
            {completedChapters}/{totalChapters}
          </span>
        </div>
      </div>
    </div>
  );
}
