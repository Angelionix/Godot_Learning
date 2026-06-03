import { z } from 'zod';

/**
 * Schema for marking a chapter as complete
 */
export const markChapterCompleteSchema = z.object({
  projectSlug: z.string().min(1, 'Slug проекта обязателен'),
  chapterSlug: z.string().min(1, 'Slug главы обязателен'),
});

/**
 * Schema for getting user progress
 */
export const getUserProgressSchema = z.object({
  userId: z.string().min(1, 'ID пользователя обязателен').optional().default('default-user'),
});

/**
 * Schema for getting project progress
 */
export const getProjectProgressSchema = z.object({
  projectSlug: z.string().min(1, 'Slug проекта обязателен'),
  userId: z.string().min(1, 'ID пользователя обязателен').optional().default('default-user'),
});

/**
 * Schema for a challenge attempt
 */
export const challengeAttemptSchema = z.object({
  projectSlug: z.string().min(1, 'Slug проекта обязателен'),
  chapterSlug: z.string().min(1, 'Slug главы обязателен'),
  challengeSlug: z.string().min(1, 'Slug вызова обязателен'),
  code: z.string().min(1, 'Код решения обязателен'),
  passed: z.boolean(),
});

// Inferred types
export type MarkChapterCompleteInput = z.infer<typeof markChapterCompleteSchema>;
export type GetUserProgressInput = z.infer<typeof getUserProgressSchema>;
export type GetProjectProgressInput = z.infer<typeof getProjectProgressSchema>;
export type ChallengeAttemptInput = z.infer<typeof challengeAttemptSchema>;
