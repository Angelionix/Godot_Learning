"use server";

import { ZodError } from "zod";
import { markChapterComplete, getProgressForUser } from "@/repositories/progress.repository";
import {
  markChapterCompleteSchema,
  getUserProgressSchema,
  challengeAttemptSchema,
} from "@/validators/progress";
import type {
  MarkChapterCompleteInput,
  GetUserProgressInput,
  ChallengeAttemptInput,
} from "@/validators/progress";

const DEFAULT_USER_ID = "default-user";

export async function markChapterCompleteAction(
  projectSlug: string,
  chapterSlug: string,
  xp: number = 10
) {
  try {
    // Validate input with Zod
    const input: MarkChapterCompleteInput = { projectSlug, chapterSlug, xp };
    const validated = markChapterCompleteSchema.parse(input);

    const result = await markChapterComplete(validated.projectSlug, validated.chapterSlug, DEFAULT_USER_ID, validated.xp);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in markChapterCompleteAction:", error);
      return { success: false, xpEarned: 0, error: "Неверные входные данные" };
    }
    console.error("Error in markChapterCompleteAction:", error);
    return { success: false, xpEarned: 0, error: "Failed to mark chapter complete" };
  }
}

export async function getUserProgressAction(userId: string = DEFAULT_USER_ID) {
  try {
    // Validate input with Zod
    const input: GetUserProgressInput = { userId };
    const validated = getUserProgressSchema.parse(input);

    const data = await getProgressForUser(validated.userId);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in getUserProgressAction:", error);
      return { success: false, error: "Неверные входные данные" };
    }
    console.error("Error in getUserProgressAction:", error);
    return { success: false, error: "Failed to get user progress" };
  }
}

export async function challengeAttemptAction(input: ChallengeAttemptInput) {
  try {
    // Validate input with Zod
    const validated = challengeAttemptSchema.parse(input);

    // TODO: Implement challenge attempt logic in repository
    // For now, return a placeholder response
    return {
      success: true,
      passed: validated.passed,
      message: validated.passed ? "Вызов пройден!" : "Попробуйте ещё раз",
    };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in challengeAttemptAction:", error);
      return { success: false, error: "Неверные входные данные" };
    }
    console.error("Error in challengeAttemptAction:", error);
    return { success: false, error: "Failed to process challenge attempt" };
  }
}
