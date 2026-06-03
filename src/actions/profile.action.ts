"use server";

import { ZodError } from "zod";
import { db } from "@/lib/db";
import { getProgressForUser } from "@/repositories/progress.repository";
import { updateProfileSchema } from "@/validators/profile";
import type { UpdateProfileInput } from "@/validators/profile";
import { BADGE_DEFINITIONS } from "@/lib/gamification";

const DEFAULT_USER_ID = "default-user";

export interface UserProfileData {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }[];
  progressStats: {
    completedChapters: number;
    totalChapters: number;
    completedProjects: number;
    totalProjects: number;
    projectProgress: {
      projectSlug: string;
      completedChapters: number;
      totalChapters: number;
    }[];
  };
  challengeStats: {
    totalAttempts: number;
    passedChallenges: number;
    totalChallenges: number;
  };
  totalBadges: number;
}

/**
 * Get full user profile data with badges, progress stats, and challenge stats
 */
export async function getUserProfileAction(
  userId: string = DEFAULT_USER_ID
): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        badges: true,
        progress: true,
        challengeAttempts: true,
      },
    });

    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    // Get progress summary from existing repository
    const progressSummary = await getProgressForUser(userId);

    // Calculate challenge stats
    const totalAttempts = user.challengeAttempts.reduce(
      (sum, a) => sum + a.attempts,
      0
    );
    const passedChallenges = user.challengeAttempts.filter(
      (a) => a.passed
    ).length;
    const totalChallenges = BADGE_DEFINITIONS.length; // approximate total challenges

    const data: UserProfileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      badges: user.badges.map((b) => ({
        slug: b.slug,
        name: b.name,
        description: b.description,
        icon: b.iconUrl || "🎖️",
        earnedAt: b.earnedAt,
      })),
      progressStats: {
        completedChapters: progressSummary.completedChapters,
        totalChapters: progressSummary.totalChapters,
        completedProjects: progressSummary.completedProjects,
        totalProjects: progressSummary.totalProjects,
        projectProgress: progressSummary.projectProgress.map((p) => ({
          projectSlug: p.projectSlug,
          completedChapters: p.completedChapters,
          totalChapters: p.totalChapters,
        })),
      },
      challengeStats: {
        totalAttempts,
        passedChallenges,
        totalChallenges,
      },
      totalBadges: BADGE_DEFINITIONS.length,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error in getUserProfileAction:", error);
    return { success: false, error: "Не удалось загрузить профиль" };
  }
}

/**
 * Update user profile (username, email, avatarUrl)
 */
export async function updateUserProfileAction(
  input: UpdateProfileInput
): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
  try {
    const validated = updateProfileSchema.parse(input);

    const updateData: {
      username: string;
      email?: string | null;
      avatarUrl?: string | null;
    } = {
      username: validated.username,
    };

    if (validated.email !== undefined) {
      updateData.email = validated.email || null;
    }
    if (validated.avatarUrl !== undefined) {
      updateData.avatarUrl = validated.avatarUrl || null;
    }

    const user = await db.user.update({
      where: { id: DEFAULT_USER_ID },
      data: updateData,
      include: {
        badges: true,
        progress: true,
        challengeAttempts: true,
      },
    });

    // Rebuild profile data
    const progressSummary = await getProgressForUser(DEFAULT_USER_ID);
    const totalAttempts = user.challengeAttempts.reduce(
      (sum, a) => sum + a.attempts,
      0
    );
    const passedChallenges = user.challengeAttempts.filter(
      (a) => a.passed
    ).length;

    const data: UserProfileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      badges: user.badges.map((b) => ({
        slug: b.slug,
        name: b.name,
        description: b.description,
        icon: b.iconUrl || "🎖️",
        earnedAt: b.earnedAt,
      })),
      progressStats: {
        completedChapters: progressSummary.completedChapters,
        totalChapters: progressSummary.totalChapters,
        completedProjects: progressSummary.completedProjects,
        totalProjects: progressSummary.totalProjects,
        projectProgress: progressSummary.projectProgress.map((p) => ({
          projectSlug: p.projectSlug,
          completedChapters: p.completedChapters,
          totalChapters: p.totalChapters,
        })),
      },
      challengeStats: {
        totalAttempts,
        passedChallenges,
        totalChallenges: BADGE_DEFINITIONS.length,
      },
      totalBadges: BADGE_DEFINITIONS.length,
    };

    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error in updateUserProfileAction:", error);
      return { success: false, error: "Неверные входные данные" };
    }
    console.error("Error in updateUserProfileAction:", error);
    return { success: false, error: "Не удалось обновить профиль" };
  }
}
