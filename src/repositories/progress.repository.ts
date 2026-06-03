import prisma from "@/lib/prisma";
import type { User, Badge, Progress } from "@/generated/prisma/client";

const DEFAULT_USER_ID = "default-user";

// XP fallback if not provided by caller
const XP_FALLBACK = 10;
const XP_BONUS_PROJECT_COMPLETE = 200;

// Level thresholds: level = floor(sqrt(xp / 100)) + 1
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

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
  completedChapters: number;
  totalChapters: number;
  completedProjects: number;
  totalProjects: number;
  badges: { slug: string; name: string; description: string }[];
  projectProgress: {
    projectSlug: string;
    completedChapters: number;
    totalChapters: number;
    chapters: { chapterSlug: string; completed: boolean }[];
  }[];
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

  return {
    userId: user.id,
    username: user.username,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    completedChapters,
    totalChapters,
    completedProjects,
    totalProjects,
    badges: user.badges.map((b: Badge) => ({
      slug: b.slug,
      name: b.name,
      description: b.description,
    })),
    projectProgress,
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
  xpReward: number = XP_FALLBACK
): Promise<{ success: boolean; xpEarned: number; newBadge?: { slug: string; name: string; description: string } }> {
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

  // Check for badges
  let newBadge: { slug: string; name: string; description: string } | undefined;

  // Check "first chapter" badge
  const completedCount = await prisma.progress.count({
    where: { userId, completed: true },
  });

  if (completedCount === 1) {
    const badge = await prisma.badge.upsert({
      where: { userId_slug: { userId, slug: "first-project" } },
      update: {},
      create: {
        userId,
        slug: "first-project",
        name: "Первый проект",
        description: "Начни свой первый проект",
      },
    });
    newBadge = { slug: badge.slug, name: badge.name, description: badge.description };
  }

  // Check "chapter master" badge (10 chapters)
  if (completedCount === 10) {
    const badge = await prisma.badge.upsert({
      where: { userId_slug: { userId, slug: "chapter-master" } },
      update: {},
      create: {
        userId,
        slug: "chapter-master",
        name: "Мастер глав",
        description: "Завершите 10 глав",
      },
    });
    newBadge = { slug: badge.slug, name: badge.name, description: badge.description };
  }

  // Check "streak-7" badge
  if (newStreak >= 7) {
    const badge = await prisma.badge.upsert({
      where: { userId_slug: { userId, slug: "streak-7" } },
      update: {},
      create: {
        userId,
        slug: "streak-7",
        name: "Неделя огня",
        description: "7 дней подряд",
      },
    });
    newBadge = { slug: badge.slug, name: badge.name, description: badge.description };
  }

  // Check if project is complete (all 9 chapters)
  const projectCompletedCount = await prisma.progress.count({
    where: { userId, projectSlug, completed: true },
  });

  if (projectCompletedCount === 9) {
    // Award project completion XP bonus
    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp + XP_BONUS_PROJECT_COMPLETE },
    });

    // Check for GDScript/C++ specific badges
    if (["project-1-clicker", "project-2-space-shooter", "project-3-metroidvania"].includes(projectSlug)) {
      const badge = await prisma.badge.upsert({
        where: { userId_slug: { userId, slug: "gdscript-pro" } },
        update: {},
        create: {
          userId,
          slug: "gdscript-pro",
          name: "GDScript Про",
          description: "Завершите проект на GDScript",
        },
      });
      newBadge = { slug: badge.slug, name: badge.name, description: badge.description };
    }

    if (["project-4-tower-defense", "project-5-3d-adventure", "project-6-performance-demo"].includes(projectSlug)) {
      const badge = await prisma.badge.upsert({
        where: { userId_slug: { userId, slug: "cpp-warrior" } },
        update: {},
        create: {
          userId,
          slug: "cpp-warrior",
          name: "C++ Воин",
          description: "Завершите проект с C++",
        },
      });
      newBadge = { slug: badge.slug, name: badge.name, description: badge.description };
    }
  }

  return { success: true, xpEarned: xpReward, newBadge };
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
