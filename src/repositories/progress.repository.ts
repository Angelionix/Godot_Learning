import prisma from "@/lib/prisma";
import type { User, Badge, Progress } from "@/generated/prisma/client";
import {
  calculateLevel,
  GDSCRIPT_PROJECTS,
  CPP_PROJECTS,
  BADGE_DEFINITIONS,
  type BadgeDefinition,
} from "@/lib/gamification";

const DEFAULT_USER_ID = "default-user";
const XP_BONUS_PROJECT_COMPLETE = 200;

export interface ProgressData {
  userId: string;
  projectSlug: string;
  chapterSlug: string;
  completed: boolean;
  completedAt: Date | null;
  xpEarned: number;
}

export interface UserProgressSummary {
  userId: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  completedChapters: number;
  totalChapters: number;
  completedProjects: number;
  totalProjects: number;
  badges: { slug: string; name: string; description: string; icon: string; earnedAt: Date }[];
  projectProgress: {
    projectSlug: string;
    completedChapters: number;
    totalChapters: number;
    chapters: { chapterSlug: string; completed: boolean }[];
  }[];
  activityCalendar: { date: string; count: number; xp: number }[];
}

interface UserWithRelations extends User {
  badges: Badge[];
  progress: Progress[];
}

function buildSummary(user: UserWithRelations): UserProgressSummary {
  const totalChapters = 54; // 6 projects × 9 chapters
  const totalProjects = 6;
  const completedChapters = user.progress.filter((p: Progress) => p.completed).length;

  // Count completed projects (all 9 chapters done)
  const projectChapterCounts: Record<string, number> = {};
  for (const p of user.progress.filter((p: Progress) => p.completed)) {
    projectChapterCounts[p.projectSlug] = (projectChapterCounts[p.projectSlug] || 0) + 1;
  }
  const completedProjects = Object.values(projectChapterCounts).filter(
    (count: number) => count >= 9
  ).length;

  // Build project-level progress
  const projectSlugs = [
    "project-1-clicker",
    "project-2-space-shooter",
    "project-3-metroidvania",
    "project-4-tower-defense",
    "project-5-3d-adventure",
    "project-6-performance-demo",
  ];

  const projectProgress = projectSlugs.map((projectSlug: string) => {
    const projectChapters = user.progress.filter(
      (p: Progress) => p.projectSlug === projectSlug
    );
    const completed = projectChapters.filter((p: Progress) => p.completed).length;

    // Generate all 9 chapter entries
    const chapters = Array.from({ length: 9 }, (_, i: number) => {
      const chapterSlug = `chapter-${i + 1}`;
      const progress = projectChapters.find((p: Progress) => p.chapterSlug === chapterSlug);
      return {
        chapterSlug,
        completed: progress?.completed || false,
      };
    });

    return {
      projectSlug,
      completedChapters: completed,
      totalChapters: 9,
      chapters,
    };
  });

  // Build activity calendar from completedAt timestamps
  const activityMap = new Map<string, { count: number; xp: number }>();
  for (const p of user.progress.filter((p: Progress) => p.completed && p.completedAt)) {
    const date = p.completedAt!.toISOString().split("T")[0];
    const existing = activityMap.get(date) || { count: 0, xp: 0 };
    existing.count += 1;
    existing.xp += p.xpEarned;
    activityMap.set(date, existing);
  }
  const activityCalendar = Array.from(activityMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    xp: data.xp,
  }));

  return {
    userId: user.id,
    username: user.username,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    lastActiveDate: user.lastActiveDate,
    completedChapters,
    totalChapters,
    completedProjects,
    totalProjects,
    badges: user.badges.map((b: Badge) => ({
      slug: b.slug,
      name: b.name,
      description: b.description,
      icon: b.iconUrl || "🎖️",
      earnedAt: b.earnedAt,
    })),
    projectProgress,
    activityCalendar,
  };
}

export async function getProgressForUser(
  userId: string = DEFAULT_USER_ID
): Promise<UserProgressSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: true,
      progress: true,
    },
  });

  if (!user) {
    // Create default user if doesn't exist
    const newUser = await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        username: "student",
      },
      include: {
        badges: true,
        progress: true,
      },
    });
    return buildSummary(newUser as UserWithRelations);
  }

  return buildSummary(user as UserWithRelations);
}

export async function markChapterComplete(
  projectSlug: string,
  chapterSlug: string,
  userId: string = DEFAULT_USER_ID,
  xpReward: number = 10
): Promise<{
  success: boolean;
  xpEarned: number;
  newLevel?: number;
  newBadges?: { slug: string; name: string; description: string; icon: string }[];
  streak?: number;
}> {
  // Check if already completed
  const existing = await prisma.progress.findUnique({
    where: {
      userId_projectSlug_chapterSlug: {
        userId,
        projectSlug,
        chapterSlug,
      },
    },
  });

  if (existing?.completed) {
    return { success: true, xpEarned: 0 };
  }

  // Create or update progress
  await prisma.progress.upsert({
    where: {
      userId_projectSlug_chapterSlug: {
        userId,
        projectSlug,
        chapterSlug,
      },
    },
    update: {
      completed: true,
      completedAt: new Date(),
      xpEarned: xpReward,
    },
    create: {
      userId,
      projectSlug,
      chapterSlug,
      completed: true,
      completedAt: new Date(),
      xpEarned: xpReward,
    },
  });

  // Update user XP and level
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newXp = (user?.xp || 0) + xpReward;
  const newLevel = calculateLevel(newXp);

  // Update streak
  const today = new Date().toISOString().split("T")[0];
  const lastActive = user?.lastActiveDate;
  let newStreak = user?.streak || 0;

  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastActive === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  // Check if project is complete — award bonus XP
  const projectCompletedCount = await prisma.progress.count({
    where: { userId, projectSlug, completed: true },
  });

  let bonusXp = 0;
  if (projectCompletedCount === 9) {
    bonusXp = XP_BONUS_PROJECT_COMPLETE;
    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp + XP_BONUS_PROJECT_COMPLETE },
    });
  }

  // Check and award all badges
  const newBadges = await checkAndAwardBadges(userId, {
    xp: newXp + bonusXp,
    streak: newStreak,
    completedChapters: await prisma.progress.count({ where: { userId, completed: true } }),
    completedProjects: await countCompletedProjects(userId),
    projectSlug,
    completedAt: new Date(),
  });

  return {
    success: true,
    xpEarned: xpReward,
    newLevel,
    newBadges,
    streak: newStreak,
  };
}

/**
 * Count how many projects the user has fully completed.
 */
async function countCompletedProjects(userId: string): Promise<number> {
  const projectSlugs = [
    "project-1-clicker",
    "project-2-space-shooter",
    "project-3-metroidvania",
    "project-4-tower-defense",
    "project-5-3d-adventure",
    "project-6-performance-demo",
  ];

  let count = 0;
  for (const slug of projectSlugs) {
    const chaptersCompleted = await prisma.progress.count({
      where: { userId, projectSlug: slug, completed: true },
    });
    if (chaptersCompleted >= 9) count++;
  }
  return count;
}

/**
 * Check all badge conditions and award any new badges.
 * Returns only newly earned badges.
 */
export async function checkAndAwardBadges(
  userId: string,
  context: {
    xp: number;
    streak: number;
    completedChapters: number;
    completedProjects: number;
    projectSlug?: string;
    completedAt?: Date;
  }
): Promise<{ slug: string; name: string; description: string; icon: string }[]> {
  const earnedBadges = await prisma.badge.findMany({ where: { userId } });
  const earnedSlugs = new Set(earnedBadges.map((b) => b.slug));

  // Check for GDScript/C++ specific progress
  const gdscriptChapters = await prisma.progress.count({
    where: {
      userId,
      projectSlug: { in: GDSCRIPT_PROJECTS },
      completed: true,
    },
  });
  const cppChapters = await prisma.progress.count({
    where: {
      userId,
      projectSlug: { in: CPP_PROJECTS },
      completed: true,
    },
  });

  // Count completed projects by language
  let completedGdscriptProjects = 0;
  let completedCppProjects = 0;
  for (const slug of GDSCRIPT_PROJECTS) {
    const count = await prisma.progress.count({
      where: { userId, projectSlug: slug, completed: true },
    });
    if (count >= 9) completedGdscriptProjects++;
  }
  for (const slug of CPP_PROJECTS) {
    const count = await prisma.progress.count({
      where: { userId, projectSlug: slug, completed: true },
    });
    if (count >= 9) completedCppProjects++;
  }

  // Time-based badge checks
  const hour = context.completedAt ? context.completedAt.getHours() : -1;
  const isEarlyBird = hour >= 5 && hour < 9;
  const isNightOwl = hour >= 23 || hour < 4;

  // Evaluate each badge condition
  const shouldEarn = (def: BadgeDefinition): boolean => {
    if (earnedSlugs.has(def.slug)) return false;

    switch (def.slug) {
      // Progress badges
      case "first-step":
        return context.completedChapters >= 1;
      case "getting-started":
        return context.completedChapters >= 5;
      case "chapter-master":
        return context.completedChapters >= 10;
      case "halfway-there":
        return context.completedChapters >= 27;
      case "completionist":
        return context.completedChapters >= 54;
      case "first-project":
        return context.completedProjects >= 1;
      case "project-collector":
        return context.completedProjects >= 3;
      case "game-dev-master":
        return context.completedProjects >= 6;

      // Streak badges
      case "streak-3":
        return context.streak >= 3;
      case "streak-7":
        return context.streak >= 7;
      case "streak-14":
        return context.streak >= 14;
      case "streak-30":
        return context.streak >= 30;
      case "streak-100":
        return context.streak >= 100;

      // Skill badges
      case "gdscript-novice":
        return gdscriptChapters >= 1;
      case "gdscript-pro":
        return completedGdscriptProjects >= 1;
      case "cpp-explorer":
        return cppChapters >= 1;
      case "cpp-warrior":
        return completedCppProjects >= 1;
      case "bilingual":
        return completedGdscriptProjects >= 1 && completedCppProjects >= 1;

      // Special badges
      case "early-bird":
        return isEarlyBird;
      case "night-owl":
        return isNightOwl;
      case "xp-100":
        return context.xp >= 100;
      case "xp-500":
        return context.xp >= 500;
      case "xp-1000":
        return context.xp >= 1000;
      case "xp-5000":
        return context.xp >= 5000;

      default:
        return false;
    }
  };

  const newBadges: { slug: string; name: string; description: string; icon: string }[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (shouldEarn(def)) {
      await prisma.badge.upsert({
        where: { userId_slug: { userId, slug: def.slug } },
        update: {},
        create: {
          userId,
          slug: def.slug,
          name: def.name,
          description: def.description,
          iconUrl: def.icon,
        },
      });
      newBadges.push({
        slug: def.slug,
        name: def.name,
        description: def.description,
        icon: def.icon,
      });
    }
  }

  return newBadges;
}

export async function getProjectProgress(
  projectSlug: string,
  userId: string = DEFAULT_USER_ID
): Promise<{ completedChapters: number; totalChapters: number; chapters: { chapterSlug: string; completed: boolean }[] }> {
  const progress = await prisma.progress.findMany({
    where: { userId, projectSlug },
  });

  const chapters = Array.from({ length: 9 }, (_, i: number) => {
    const chapterSlug = `chapter-${i + 1}`;
    const p = progress.find((pr: Progress) => pr.chapterSlug === chapterSlug);
    return { chapterSlug, completed: p?.completed || false };
  });

  return {
    completedChapters: chapters.filter((c: { chapterSlug: string; completed: boolean }) => c.completed).length,
    totalChapters: 9,
    chapters,
  };
}

/**
 * Get activity data for the streak calendar.
 * Returns an array of { date, count, xp } for the last N days.
 */
export async function getActivityCalendar(
  userId: string = DEFAULT_USER_ID,
  days: number = 365
): Promise<{ date: string; count: number; xp: number }[]> {
  const since = new Date(Date.now() - days * 86400000);

  const progressEntries = await prisma.progress.findMany({
    where: {
      userId,
      completed: true,
      completedAt: { gte: since },
    },
    orderBy: { completedAt: "asc" },
  });

  const activityMap = new Map<string, { count: number; xp: number }>();
  for (const entry of progressEntries) {
    if (!entry.completedAt) continue;
    const date = entry.completedAt.toISOString().split("T")[0];
    const existing = activityMap.get(date) || { count: 0, xp: 0 };
    existing.count += 1;
    existing.xp += entry.xpEarned;
    activityMap.set(date, existing);
  }

  // Fill in all days (even empty ones)
  const result: { date: string; count: number; xp: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    const data = activityMap.get(date) || { count: 0, xp: 0 };
    result.push({ date, count: data.count, xp: data.xp });
  }

  return result;
}
