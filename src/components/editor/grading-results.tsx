"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
  ChevronDown,
  RotateCcw,
  X,
  FileCode,
  MinusCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// === Типы ===

export interface TestResultEntry {
  name: string;
  suite: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  message?: string;
  line_number?: number;
  script: string;
}

export interface GradingSubmission {
  id: string;
  status: "pending" | "running" | "passed" | "failed" | "error";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  xpEarned: number;
  testResults?: TestResultEntry[];
  errorMessage?: string;
  createdAt: string | Date;
}

export interface GradingResultsProps {
  submission: GradingSubmission;
  onRetry?: () => void;
  onClose?: () => void;
}

// === Константы ===

const GODOT_BLUE = "#478CBF";

const STATUS_CONFIG = {
  passed: {
    icon: CheckCircle2,
    label: "Все тесты пройдены!",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    ringColor: "ring-emerald-500/20",
  },
  failed: {
    icon: XCircle,
    label: "Некоторые тесты не пройдены",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    ringColor: "ring-red-500/20",
  },
  error: {
    icon: AlertCircle,
    label: "Ошибка при проверке",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    ringColor: "ring-orange-500/20",
  },
  running: {
    icon: Loader2,
    label: "Проверка...",
    color: "text-[#478CBF]",
    bgColor: "bg-[#478CBF]/10",
    ringColor: "ring-[#478CBF]/20",
  },
  pending: {
    icon: Clock,
    label: "Ожидание проверки",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    ringColor: "ring-muted-foreground/20",
  },
} as const;

// === Вспомогательные компоненты ===

/** Анимированный бейдж XP */
function XPBadge({ xp }: { xp: number }) {
  if (xp <= 0) return null;

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
          "bg-amber-500/10 ring-1 ring-amber-500/30",
          "animate-in fade-in zoom-in duration-500"
        )}
      >
        <Zap className="size-5 text-amber-500 fill-amber-500" />
        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
          +{xp} XP
        </span>
      </div>
    </div>
  );
}

/** Карточка со статистикой */
function StatCard({
  label,
  value,
  colorClass,
  bgColorClass,
}: {
  label: string;
  value: number;
  colorClass?: string;
  bgColorClass?: string;
}) {
  return (
    <Card size="sm" className={cn("text-center", bgColorClass)}>
      <CardContent className="py-3">
        <div className={cn("text-2xl font-bold tabular-nums", colorClass)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}

/** Иконка статуса теста */
function TestStatusIcon({ status }: { status: "pass" | "fail" | "skip" }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
    case "fail":
      return <XCircle className="size-4 text-red-500 shrink-0" />;
    case "skip":
      return <MinusCircle className="size-4 text-yellow-500 shrink-0" />;
  }
}

/** Строка результата теста */
function TestResultRow({ test }: { test: TestResultEntry }) {
  const [expanded, setExpanded] = useState(test.status === "fail");

  const isFailed = test.status === "fail";
  const isSkipped = test.status === "skip";
  const durationSec = (test.duration / 1000).toFixed(2);

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        isFailed && "bg-red-500/5",
        isSkipped && "opacity-60"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          isFailed && "cursor-pointer"
        )}
        onClick={() => isFailed && setExpanded(!expanded)}
      >
        <TestStatusIcon status={test.status} />
        <span
          className={cn(
            "flex-1 text-sm min-w-0 truncate",
            isSkipped && "line-through text-muted-foreground"
          )}
        >
          {test.name}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {durationSec}с
        </span>
        {isFailed && (
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        )}
      </div>

      {/* Подробности ошибки */}
      {isFailed && expanded && test.message && (
        <div className="px-3 pb-2 pl-9">
          <div className="text-xs bg-red-500/10 border border-red-500/20 rounded-md p-2.5 space-y-1.5">
            {test.message && (
              <p className="text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">
                {test.message}
              </p>
            )}
            {(test.line_number || test.script) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCode className="size-3 shrink-0" />
                <span className="font-mono text-[11px]">
                  {test.script}
                  {test.line_number ? `:${test.line_number}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Группа тестов по suite */
function TestSuiteGroup({
  suite,
  tests,
}: {
  suite: string;
  tests: TestResultEntry[];
}) {
  const [open, setOpen] = useState(true);

  const passed = tests.filter((t) => t.status === "pass").length;
  const failed = tests.filter((t) => t.status === "fail").length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
          <FileCode className="size-4 text-[#478CBF] shrink-0" />
          <span className="text-sm font-medium flex-1 min-w-0 truncate">
            {suite}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {passed > 0 && (
              <Badge
                variant="ghost"
                className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-500/10"
              >
                ✓{passed}
              </Badge>
            )}
            {failed > 0 && (
              <Badge
                variant="ghost"
                className="text-[10px] px-1.5 py-0 text-red-600 bg-red-500/10"
              >
                ✗{failed}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {(totalDuration / 1000).toFixed(1)}с
            </span>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 pl-2 mb-1">
          {tests.map((test, idx) => (
            <TestResultRow key={`${suite}-${idx}`} test={test} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Кольцевая диаграмма результатов */
function ResultsDonutChart({
  passed,
  failed,
  skipped,
}: {
  passed: number;
  failed: number;
  skipped: number;
}) {
  const total = passed + failed + skipped;
  if (total === 0) return null;

  const data = [
    { name: "Пройдено", value: passed, color: "#22c55e" },
    { name: "Не пройдено", value: failed, color: "#ef4444" },
    { name: "Пропущено", value: skipped, color: "#eab308" },
  ].filter((d) => d.value > 0);

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="size-[100px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={45}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        <div className="text-2xl font-bold tabular-nums">{passRate}%</div>
        <div className="text-xs text-muted-foreground">тестов пройдено</div>
        <div className="flex items-center gap-3 pt-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[11px] text-muted-foreground">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Основной компонент ===

export function GradingResults({
  submission,
  onRetry,
  onClose,
}: GradingResultsProps) {
  const {
    status,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    duration,
    xpEarned,
    testResults,
    errorMessage,
  } = submission;

  // Группировка тестов по suite
  const groupedTests = useMemo(() => {
    if (!testResults || testResults.length === 0) return {};

    const groups: Record<string, TestResultEntry[]> = {};
    for (const test of testResults) {
      const suite = test.suite || test.script || "Другие";
      if (!groups[suite]) {
        groups[suite] = [];
      }
      groups[suite].push(test);
    }

    // Сортируем: сначала с ошибками, потом пропущенные, потом пройденные
    const statusOrder: Record<string, number> = {
      fail: 0,
      skip: 1,
      pass: 2,
    };
    for (const suite of Object.keys(groups)) {
      groups[suite].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status]
      );
    }

    return groups;
  }, [testResults]);

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const durationSec = (duration / 1000).toFixed(1);
  const isRunning = status === "running";
  const isPending = status === "pending";
  const isError = status === "error";

  return (
    <div className="space-y-4">
      {/* === Заголовок статуса === */}
      <div
        className={cn(
          "flex flex-col items-center gap-3 py-6 px-4 rounded-xl",
          "ring-1",
          config.bgColor,
          config.ringColor
        )}
      >
        <StatusIcon
          className={cn(
            "size-12",
            config.color,
            isRunning && "animate-spin"
          )}
        />
        <h3 className={cn("text-lg font-semibold", config.color)}>
          {config.label}
        </h3>
        {xpEarned > 0 && (status === "passed" || status === "failed") && (
          <XPBadge xp={xpEarned} />
        )}
      </div>

      {/* === Статистика === */}
      {!isPending && !isRunning && (
        <>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <StatCard
              label="Всего"
              value={totalTests}
              colorClass="text-foreground"
            />
            <StatCard
              label="Пройдено"
              value={passedTests}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgColorClass="bg-emerald-500/5"
            />
            <StatCard
              label="Не пройдено"
              value={failedTests}
              colorClass="text-red-600 dark:text-red-400"
              bgColorClass="bg-red-500/5"
            />
            <StatCard
              label="Пропущено"
              value={skippedTests}
              colorClass="text-yellow-600 dark:text-yellow-400"
              bgColorClass="bg-yellow-500/5"
            />
          </div>

          {/* Диаграмма + длительность */}
          <Card size="sm">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <ResultsDonutChart
                  passed={passedTests}
                  failed={failedTests}
                  skipped={skippedTests}
                />
                <div className="text-sm text-muted-foreground text-right">
                  <p>
                    Проверка заняла{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {durationSec}
                    </span>{" "}
                    секунд
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* === Состояние ошибки === */}
      {isError && errorMessage && (
        <Card size="sm" className="ring-1 ring-red-500/30 bg-red-500/5">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Ошибка при проверке
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 whitespace-pre-wrap font-mono">
                  {errorMessage}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Попробуйте повторить проверку или обратитесь к преподавателю.
            </p>
          </CardContent>
        </Card>
      )}

      {/* === Подробности тестов === */}
      {testResults && testResults.length > 0 && !isPending && !isRunning && (
        <Card size="sm">
          <CardContent className="py-3">
            <h4 className="text-sm font-medium mb-2">Подробности тестов</h4>
            <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
              {Object.entries(groupedTests).map(([suite, tests]) => (
                <TestSuiteGroup key={suite} suite={suite} tests={tests} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Кнопки действий === */}
      <div className="flex items-center gap-2 justify-end">
        {onRetry && !isRunning && (
          <Button
            onClick={onRetry}
            className="gap-1.5"
            style={{ backgroundColor: GODOT_BLUE }}
          >
            <RotateCcw className="size-4" />
            Повторить проверку
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <X className="size-4" />
            Закрыть
          </Button>
        )}
      </div>
    </div>
  );
}
