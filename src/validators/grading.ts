/**
 * Zod-схемы для валидации API запросов автогрейдинга проектов.
 */

import { z } from "zod";

/** Результат одного теста в автогрейдинге */
export const testResultEntrySchema = z.object({
  name: z.string().min(1),
  suite: z.string().min(1),
  status: z.enum(["pass", "fail", "skip"]),
  duration: z.number().min(0),
  message: z.string().optional(),
  line_number: z.number().optional(),
  script: z.string().min(1),
});

/** Сводка результатов тестирования */
export const testSummarySchema = z.object({
  total: z.number().min(0),
  passed: z.number().min(0),
  failed: z.number().min(0),
  skipped: z.number().min(0),
  duration: z.number().min(0),
});

/** Полный отчёт о тестировании */
export const testResultsSchema = z.object({
  summary: testSummarySchema,
  tests: z.array(testResultEntrySchema),
});

/** Отправка проекта на автогрейдинг — POST /api/submit/[projectId] */
export const submitProjectSchema = z.object({
  // Если не указан, будет использован mock-режим грейдинга
  testResults: testResultsSchema.optional(),
});

/** Типы из схем */
export type TestResultEntry = z.infer<typeof testResultEntrySchema>;
export type TestSummary = z.infer<typeof testSummarySchema>;
export type TestResults = z.infer<typeof testResultsSchema>;
export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;
