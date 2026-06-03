'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Play, RotateCcw, Lightbulb, Eye, Award, Code, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GDScriptEditor from '@/components/playground/gdscript-editor';
import OutputConsole from '@/components/playground/output-console';
import ChallengeResults from '@/components/playground/challenge-results';
import { executeGDScript, validateCode, type InterpreterResult, type ChallengeValidation, type TestCase } from '@/lib/gdscript-interpreter';

export interface InteractiveChallengeProps {
  /** Unique challenge ID */
  id: string;
  /** Challenge title */
  title?: string;
  /** Difficulty level */
  difficulty?: 'green' | 'yellow' | 'red' | 'easy' | 'medium' | 'hard';
  /** Starter code template */
  starterCode?: string;
  /** Reference solution */
  solutionCode?: string;
  /** Test cases for validation */
  testCases?: TestCase[];
  /** Hints (revealed one at a time) */
  hints?: string[];
  /** XP reward for completing */
  xp?: number;
  /** XP penalty per hint revealed */
  xpPenalty?: number;
  /** Challenge description (Markdown) */
  children?: React.ReactNode;
  /** Whether to run in "execute" mode (run and check output) or "validate" mode (pattern matching) */
  mode?: 'execute' | 'validate';
  /** Additional CSS class */
  className?: string;
  /** Called when challenge is completed */
  onComplete?: (challengeId: string, passed: boolean) => void;
  /** Slug of the project this challenge belongs to */
  projectSlug?: string;
  /** Slug of the chapter this challenge belongs to */
  chapterSlug?: string;
}

const difficultyConfig: Record<string, { label: string; border: string; bg: string; badge: string }> = {
  green: { label: 'Базовый', border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950/30', badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  yellow: { label: 'Продвинутый', border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  red: { label: 'Экспертный', border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950/30', badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  easy: { label: 'Базовый', border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950/30', badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  medium: { label: 'Продвинутый', border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  hard: { label: 'Экспертный', border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950/30', badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
};

const defaultDifficultyConfig = difficultyConfig.medium;

export default function InteractiveChallenge({
  id,
  title,
  difficulty = 'medium',
  starterCode = '# Напишите ваш код здесь\n',
  solutionCode,
  testCases = [],
  hints = [],
  xp = 10,
  xpPenalty = 5,
  children,
  mode = 'validate',
  className = '',
  onComplete,
  projectSlug,
  chapterSlug,
}: InteractiveChallengeProps) {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [executeResult, setExecuteResult] = useState<InterpreterResult | null>(null);
  const [validation, setValidation] = useState<ChallengeValidation | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [serverAttempts, setServerAttempts] = useState<number | null>(null);
  const attemptCountRef = useRef(0);
  const persistingRef = useRef(false);

  const config = difficultyConfig[difficulty] || defaultDifficultyConfig;
  const totalXpPenalty = hintsRevealed * xpPenalty;
  const effectiveXp = Math.max(0, xp - totalXpPenalty);

  const persistAttempt = useCallback(async (passed: boolean, userCode: string) => {
    if (persistingRef.current) return; // Prevent duplicate calls
    if (!projectSlug || !chapterSlug) return; // Cannot persist without slugs

    persistingRef.current = true;
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          chapterSlug,
          challengeSlug: id,
          passed,
          attempts: attemptCountRef.current,
          code: userCode,
          xp: passed ? effectiveXp : 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServerAttempts(data.attempts);
          if (data.xpEarned > 0) {
            toast.success(`Вы заработали ${data.xpEarned} XP за выполнение задания!`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to persist challenge attempt:', err);
    } finally {
      persistingRef.current = false;
    }
  }, [projectSlug, chapterSlug, id, effectiveXp]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setValidation(null);
    attemptCountRef.current += 1;

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 100));

    try {
      if (mode === 'execute' && testCases.some((t) => t.type === 'output')) {
        // Execute mode: run the code and check output
        const result = executeGDScript(code);
        setExecuteResult(result);

        // Also run validation
        if (testCases.length > 0) {
          const val = validateCode(code, testCases);
          setValidation(val);

          if (val.passed && !isCompleted) {
            setIsCompleted(true);
            onComplete?.(id, true);
            persistAttempt(true, code);
          } else if (!val.passed) {
            persistAttempt(false, code);
          }
        }
      } else if (testCases.length > 0) {
        // Validate mode: pattern matching
        const result = executeGDScript(code);
        setExecuteResult(result);

        const val = validateCode(code, testCases);
        setValidation(val);

        if (val.passed && !isCompleted) {
          setIsCompleted(true);
          onComplete?.(id, true);
          persistAttempt(true, code);
        } else if (!val.passed) {
          persistAttempt(false, code);
        }
      } else {
        // No test cases — just execute
        const result = executeGDScript(code);
        setExecuteResult(result);
      }
    } catch (error: any) {
      setExecuteResult({
        success: false,
        output: [],
        errors: [error.message || 'Неизвестная ошибка'],
        duration: 0,
      });
      // Persist failed attempt even on runtime error
      persistAttempt(false, code);
    } finally {
      setIsRunning(false);
      setHasAttempted(true);
    }
  }, [code, mode, testCases, id, isCompleted, onComplete, persistAttempt]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setExecuteResult(null);
    setValidation(null);
    setHasAttempted(false);
    attemptCountRef.current = 0;
    setServerAttempts(null);
  }, [starterCode]);

  const handleRevealHint = useCallback(() => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed((prev) => prev + 1);
    }
  }, [hintsRevealed, hints.length]);

  const handleShowSolution = useCallback(() => {
    setShowSolution(true);
  }, []);

  return (
    <div
      className={cn(
        'my-6 rounded-xl border-l-4 overflow-hidden',
        config.border,
        'bg-gray-950/50 dark:bg-gray-950/80',
        className,
      )}
    >
      {/* Header */}
      <div className={cn('px-4 py-3', config.bg)}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-bold text-sm md:text-base">Микровызов</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', config.badge)}>
              {config.label}
            </span>
            {title && (
              <span className="text-sm text-muted-foreground">· {title}</span>
            )}
            {xp > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Award className="w-3 h-3" />
                {effectiveXp} XP
                {totalXpPenalty > 0 && (
                  <span className="text-red-400/60">(-{totalXpPenalty})</span>
                )}
              </span>
            )}
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <Award className="w-3.5 h-3.5" />
              Пройден!
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {children && (
        <div className="px-4 py-3 text-sm border-b border-gray-800 text-gray-300">
          {children}
        </div>
      )}

      {/* Code Editor */}
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-3 py-2 bg-[#16162a]">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Code className="w-3.5 h-3.5" />
            <span>GDScript</span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            title="Сбросить код"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сброс
          </button>
        </div>
        <GDScriptEditor
          value={code}
          onChange={setCode}
          height="250px"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#12122a] border-b border-gray-800 flex-wrap">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isRunning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[#ff7085] hover:bg-[#ff5a70] text-white shadow-lg shadow-[#ff7085]/20'
          )}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Выполнение...' : 'Запуск'}
        </button>

        {hints.length > 0 && hintsRevealed < hints.length && (
          <button
            onClick={handleRevealHint}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-950/30 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Подсказка
            {xpPenalty > 0 && (
              <span className="text-xs text-red-400/60">(-{xpPenalty} XP)</span>
            )}
          </button>
        )}

        {solutionCode && hasAttempted && !showSolution && (
          <button
            onClick={handleShowSolution}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Решение
          </button>
        )}
      </div>

      {/* Revealed Hints */}
      {hintsRevealed > 0 && (
        <div className="px-4 py-3 space-y-2 bg-amber-950/10 border-b border-gray-800">
          {hints.slice(0, hintsRevealed).map((hint, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Lightbulb className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
              <span className="text-amber-200/80">{hint}</span>
            </div>
          ))}
          {hintsRevealed < hints.length && (
            <button
              onClick={handleRevealHint}
              className="flex items-center gap-1 text-xs text-amber-400/60 hover:text-amber-400 transition-colors mt-1"
            >
              <Lightbulb className="w-3 h-3" />
              Следующая подсказка (-{xpPenalty} XP)
            </button>
          )}
        </div>
      )}

      {/* Solution */}
      {showSolution && solutionCode && (
        <div className="border-b border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#16162a] text-xs text-gray-400">
            <Eye className="w-3.5 h-3.5" />
            <span>Референсное решение</span>
          </div>
          <GDScriptEditor
            value={solutionCode}
            readOnly
            height="200px"
          />
        </div>
      )}

      {/* Output Console */}
      <div className="border-b border-gray-800">
        <OutputConsole result={executeResult} isRunning={isRunning} />
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="px-4 py-3">
          <ChallengeResults
            validation={validation}
            xpAwarded={validation.passed ? effectiveXp : 0}
          />
        </div>
      )}
    </div>
  );
}
