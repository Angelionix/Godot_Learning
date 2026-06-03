/**
 * Repository для управления отправками проектов на автогрейдинг.
 *
 * Инкапсулирует доступ к данным ProjectSubmission через Prisma.
 * Все текстовые комментарии и сообщения на русском языке.
 */

import prisma from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

// === Типы ===

export interface SubmissionData {
  id: string;
  userId: string;
  projectId: string;
  projectSlug: string;
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  xpEarned: number;
  testResults: string; // JSON-строка с детальными результатами
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResultEntry {
  name: string;
  suite: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  message?: string;
  line_number?: number;
  script: string;
}

export interface SubmissionCreateInput {
  userId: string;
  projectId: string;
  projectSlug: string;
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  xpEarned: number;
  testResults: string;
  errorMessage?: string | null;
}

export interface SubmissionUpdateInput {
  status?: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  skippedTests?: number;
  duration?: number;
  xpEarned?: number;
  testResults?: string;
  errorMessage?: string | null;
}

// === Функции доступа к данным ===

/**
 * Создаёт новую отправку проекта на автогрейдинг (статус: pending).
 */
export async function createSubmission(
  input: SubmissionCreateInput
): Promise<SubmissionData> {
  return prisma.projectSubmission.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      projectSlug: input.projectSlug,
      status: input.status,
      totalTests: input.totalTests,
      passedTests: input.passedTests,
      failedTests: input.failedTests,
      skippedTests: input.skippedTests,
      duration: input.duration,
      xpEarned: input.xpEarned,
      testResults: input.testResults,
      errorMessage: input.errorMessage || null,
    },
  });
}

/**
 * Обновляет отправку с результатами тестирования.
 */
export async function updateSubmissionResults(
  submissionId: string,
  input: SubmissionUpdateInput
): Promise<SubmissionData | null> {
  const submission = await prisma.projectSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) return null;

  return prisma.projectSubmission.update({
    where: { id: submissionId },
    data: input,
  });
}

/**
 * Получает отправку по ID.
 */
export async function getSubmission(
  submissionId: string
): Promise<SubmissionData | null> {
  return prisma.projectSubmission.findUnique({
    where: { id: submissionId },
  });
}

/**
 * Получает список отправок для проекта.
 * Опционально фильтрует по пользователю.
 */
export async function listSubmissions(
  projectId: string,
  userId: string = DEFAULT_USER_ID
): Promise<SubmissionData[]> {
  return prisma.projectSubmission.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Получает последнюю отправку для проекта.
 */
export async function getLatestSubmission(
  projectId: string,
  userId: string = DEFAULT_USER_ID
): Promise<SubmissionData | null> {
  return prisma.projectSubmission.findFirst({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Подсчитывает общее количество отправок пользователя.
 */
export async function countSubmissions(
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  return prisma.projectSubmission.count({
    where: { userId },
  });
}

/**
 * Проверяет, была ли уже успешная отправка для данного проекта.
 * Используется для расчёта бонусного XP (первая сдача).
 */
export async function hasPassedSubmission(
  projectId: string,
  userId: string = DEFAULT_USER_ID
): Promise<boolean> {
  const count = await prisma.projectSubmission.count({
    where: {
      projectId,
      userId,
      status: "passed",
    },
  });
  return count > 0;
}

/**
 * Получает все успешные отправки пользователя (для подсчёта completed projects).
 */
export async function getPassedProjectSlugs(
  userId: string = DEFAULT_USER_ID
): Promise<string[]> {
  // Ищем уникальные projectSlug, по которым есть хотя бы одна успешная отправка
  const results = await prisma.projectSubmission.findMany({
    where: { userId, status: "passed" },
    select: { projectSlug: true },
    distinct: ["projectSlug"],
  });
  return results.map((r) => r.projectSlug);
}
