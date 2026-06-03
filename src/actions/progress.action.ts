"use server";

import { ZodError } from "zod";
import { markChapterComplete, getProgressForUser, recordChallengeAttempt, getChallengeAttempts } from "@/repositories/progress.repository";
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

export async function challengeAttemptAction(
  input: ChallengeAttemptInput & { xp?: number }
) {
  try {
    // Validate input with Zod
    const validated = challengeAttemptSchema.parse(input);
    const xpReward = input.xp ?? 10;

    const result = await recordChallengeAttempt(
      DEFAULT_USER_ID,
      validated.projectSlug,
      validated.chapterSlug,
      validated.challengeSlug,
      validated.code,
      validated.passed,
      xpReward
    );

    return {
      success: result.success,
      passed: result.passed,
      attempts: result.attempts,
      xpEarned: result.xpEarned,
      newBadges: result.newBadges,
      message: result.passed
        ? result.xpEarned > 0
          ? `Вызов пройден! +${result.xpEarned} XP`
          : "Вызов пройден!"
        : "Попробуйте ещё раз",
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

export async function getChallengeAttemptsAction(
  projectSlug?: string,
  chapterSlug?: string
) {
  try {
    const data = await getChallengeAttempts(DEFAULT_USER_ID, projectSlug, chapterSlug);
    return { success: true, data };
  } catch (error) {
    console.error("Error in getChallengeAttemptsAction:", error);
    return { success: false, error: "Failed to get challenge attempts" };
  }
}
