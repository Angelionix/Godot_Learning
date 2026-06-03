'use client';

import React, { useCallback, useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Award } from 'lucide-react';
import type { ChallengeValidation, TestCase } from '@/lib/gdscript-interpreter';

export interface ChallengeResultsProps {
  validation: ChallengeValidation | null;
  xpAwarded?: number;
  className?: string;
}

export default function ChallengeResults({ validation, xpAwarded, className = '' }: ChallengeResultsProps) {
  const [expanded, setExpanded] = useState(true);

  if (!validation) return null;

  return (
    <div className={`border rounded-lg overflow-hidden ${className} ${
      validation.passed
        ? 'border-emerald-700/50 bg-emerald-950/20'
        : 'border-red-700/50 bg-red-950/20'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {validation.passed ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={`font-medium ${
            validation.passed ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {validation.passed
              ? 'Все тесты пройдены!'
              : `${validation.passedTests}/${validation.totalTests} тестов пройдено`}
          </span>
          {xpAwarded && validation.passed && (
            <span className="flex items-center gap-1 text-amber-400 text-sm ml-2">
              <Award className="w-4 h-4" />
              +{xpAwarded} XP
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Test results */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {validation.results.map((result, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-sm px-3 py-2 rounded ${
                result.passed
                  ? 'bg-emerald-900/20 text-emerald-300'
                  : 'bg-red-900/20 text-red-300'
              }`}
            >
              {result.passed ? (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{result.test.description}</div>
                {!result.passed && (
                  <div className="text-xs mt-1 text-red-400/80 whitespace-pre-wrap">
                    {result.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
