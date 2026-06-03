'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { InterpreterResult } from '@/lib/gdscript-interpreter';

export interface OutputConsoleProps {
  result: InterpreterResult | null;
  isRunning: boolean;
  className?: string;
}

export default function OutputConsole({ result, isRunning, className = '' }: OutputConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result]);

  return (
    <div className={`bg-[#1a1a2e] border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#16162a] border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Terminal className="w-4 h-4" />
          <span>Вывод</span>
        </div>
        {result && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">{result.duration} мс</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="p-3 font-mono text-sm min-h-[120px] max-h-[300px] overflow-y-auto"
      >
        {isRunning && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span>Выполнение...</span>
          </div>
        )}

        {result && (
          <>
            {/* Output lines */}
            {result.output.map((line, i) => (
              <div key={`out-${i}`} className="text-green-400 whitespace-pre-wrap">
                {line}
              </div>
            ))}

            {/* Errors */}
            {result.errors.map((err, i) => (
              <div key={`err-${i}`} className="flex items-start gap-2 text-red-400 mt-1">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap">{err}</span>
              </div>
            ))}

            {/* Success indicator */}
            {result.success && result.output.length > 0 && (
              <div className="flex items-center gap-2 text-emerald-500 mt-2 pt-2 border-t border-gray-700/50">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Выполнено успешно</span>
              </div>
            )}

            {/* No output */}
            {result.output.length === 0 && result.errors.length === 0 && result.success && (
              <div className="text-gray-500 italic">
                Код выполнен без вывода. Используйте print() для отображения результатов.
              </div>
            )}
          </>
        )}

        {!result && !isRunning && (
          <div className="text-gray-600 italic">
            Нажмите ▶ Запуск для выполнения кода
          </div>
        )}
      </div>
    </div>
  );
}
