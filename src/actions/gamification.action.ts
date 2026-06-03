"use server";

import { ZodError } from "zod";
import { z } from "zod";
import {
  getProgressForUser,
  getActivityCalendar,
  checkAndAwardBadges,
} from "@/repositories/progress.repository";

const DEFAULT_USER_ID = "default-user";

// ── Schemas ───────────────────────────────────────────────────────────────────

const getUserGamificationSchema = z.object({
  userId: z.string().min(1),
});

const getActivityCalendarSchema = z.object({
  userId: z.string().min(1),
  days: z.number().min(1).max(730).optional().default(365),
});

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Get full gamification data for a user (XP, level, streak, badges, project progress, calendar)
 */
export async function getUserGamificationAction(userId: string = DEFAULT_USER_ID) {
  try {
    const validated = getUserGamificationSchema.parse({ userId });
    const data = await getProgressForUser(validated.userId);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in getUserGamificationAction:", error);
      return { success: false, error: "Неверные входные данные" };
    }
    console.error("Error in getUserGamificationAction:", error);
    return { success: false, error: "Failed to get gamification data" };
  }
}

/**
 * Get activity calendar data for the streak display
 */
export async function getActivityCalendarAction(
  userId: string = DEFAULT_USER_ID,
  days: number = 365
) {
  try {
    const validated = getActivityCalendarSchema.parse({ userId, days });
    const data = await getActivityCalendar(validated.userId, validated.days);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in getActivityCalendarAction:", error);
      return { success: false, error: "Неверные входные данные" };
    }
    console.error("Error in getActivityCalendarAction:", error);
    return { success: false, error: "Failed to get activity calendar" };
  }
}

/**
 * Manually trigger badge check (e.g., on page load)
 */
export async function refreshBadgesAction(userId: string = DEFAULT_USER_ID) {
  try {
    const userData = await getProgressForUser(userId);
    const newBadges = await checkAndAwardBadges(userId, {
      xp: userData.xp,
      streak: userData.streak,
      completedChapters: userData.completedChapters,
      completedProjects: userData.completedProjects,
    });

    return { success: true, newBadges };
  } catch (error) {
    console.error("Error in refreshBadgesAction:", error);
    return { success: false, error: "Failed to refresh badges" };
  }
}
