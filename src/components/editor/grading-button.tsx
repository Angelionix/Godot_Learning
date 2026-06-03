"use client";

import { useState, useCallback, useMemo } from "react";
import { FlaskConical, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { GradingSubmission } from "@/components/editor/grading-results";

// === Типы ===

export interface GradingButtonProps {
  projectId: string;
  projectSlug: string;
  onResults?: (results: GradingSubmission) => void;
  previousSubmission?: GradingSubmission | null;
  disabled?: boolean;
}

// === Константы ===

const GODOT_BLUE = "#478CBF";

// === Компонент ===

export function GradingButton({
  projectId,
  projectSlug,
  onResults,
  previousSubmission,
  disabled = false,
}: GradingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<GradingSubmission | null>(
    previousSubmission ?? null
  );

  const handleSubmit = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/submit/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || `Ошибка сервера (${res.status})`
        );
      }

      const data = await res.json();
      const submission: GradingSubmission = data.submission || data;

      setLastSubmission(submission);

      // Уведомления
      if (submission.status === "passed") {
        toast.success("Все тесты пройдены!", {
          description: submission.xpEarned
            ? `+${submission.xpEarned} XP заработано`
            : undefined,
        });
      } else if (submission.status === "failed") {
        toast.error("Некоторые тесты не пройдены", {
          description: `${submission.passedTests}/${submission.totalTests} тестов пройдено`,
        });
      } else if (submission.status === "error") {
        toast.error("Ошибка при проверке", {
          description: submission.errorMessage || "Попробуйте ещё раз",
        });
      }

      onResults?.(submission);
    } catch (err: any) {
      toast.error("Не удалось запустить проверку", {
        description: err.message || "Проверьте подключение и попробуйте снова",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, projectSlug, onResults]);

  // Определяем бейдж предыдущей отправки
  const previousBadge = useMemo(() => {
    if (!lastSubmission) return null;

    switch (lastSubmission.status) {
      case "passed":
        return (
          <Badge
            variant="ghost"
            className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-500/10 ml-1"
          >
            ✓
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="ghost"
            className="text-[10px] px-1.5 py-0 text-red-600 bg-red-500/10 ml-1"
          >
            ✗
          </Badge>
        );
      default:
        return null;
    }
  }, [lastSubmission]);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSubmit}
        disabled={loading || disabled}
        className="gap-1.5 relative"
        style={{ backgroundColor: GODOT_BLUE }}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Проверка...
          </>
        ) : (
          <>
            <FlaskConical className="size-4" />
            Проверить
            {previousBadge}
          </>
        )}
      </Button>

      {/* Мини-статус последней проверки */}
      {lastSubmission && !loading && lastSubmission.status !== "pending" && lastSubmission.status !== "running" && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {lastSubmission.status === "passed" && (
            <span className="text-emerald-600 dark:text-emerald-400">
              <CheckCheck className="size-3 inline mr-0.5" />
              {lastSubmission.passedTests}/{lastSubmission.totalTests}
            </span>
          )}
          {lastSubmission.status === "failed" && (
            <span className="text-red-600 dark:text-red-400">
              {lastSubmission.passedTests}/{lastSubmission.totalTests}
            </span>
          )}
          {lastSubmission.status === "error" && (
            <span className="text-orange-600 dark:text-orange-400">
              Ошибка
            </span>
          )}
        </span>
      )}
    </div>
  );
}

