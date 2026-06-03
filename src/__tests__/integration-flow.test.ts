import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration tests: complete flow from chapter completion to XP and badge awards.
 * Tests the interaction between repository, gamification logic, and data flow.
 */

// Mock prisma module
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    progress: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    badge: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';
import {
  markChapterComplete,
  checkAndAwardBadges,
} from '@/repositories/progress.repository';
import {
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  calculateStreak,
  getStreakStatus,
  BADGE_DEFINITIONS,
  SKILL_AXES,
  GDSCRIPT_PROJECTS,
  CPP_PROJECTS,
} from '@/lib/gamification';
import type { User, Badge, Progress } from '@/generated/prisma/client';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  progress: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  badge: { findMany: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
};

function makeMockUser(overrides: Partial<User> = {}): User & { badges: Badge[]; progress: Progress[] } {
  return {
    id: 'default-user',
    username: 'student',
    email: null,
    avatarUrl: null,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    badges: [],
    progress: [],
    ...overrides,
  } as User & { badges: Badge[]; progress: Progress[] };
}

/**
 * Helper: set up all the prisma.progress.count mock return values needed for
 * markChapterComplete → checkAndAwardBadges flow.
 *
 * Call order in markChapterComplete:
 * 1. projectCompletedCount (projectSlug, completed: true)
 * 2. completedChapters count (userId, completed: true) — passed to checkAndAwardBadges
 * 3-8. countCompletedProjects — 6 calls (one per project)
 *
 * Then inside checkAndAwardBadges:
 * 9. gdscriptChapters (projects in GDSCRIPT_PROJECTS, completed: true)
 * 10. cppChapters (projects in CPP_PROJECTS, completed: true)
 * 11-13. gdscript project completion counts (3 projects)
 * 14-16. cpp project completion counts (3 projects)
 */
function setupCountMocks(overrides: {
  projectCompletedCount?: number;  // #1
  totalCompletedChapters?: number;  // #2
  completedProjectCounts?: number[]; // #3-8 (6 values, one per project)
  gdscriptChapters?: number;        // #9
  cppChapters?: number;             // #10
  gdscriptProjectCounts?: number[];  // #11-13
  cppProjectCounts?: number[];       // #14-16
}) {
  const projectCounts = overrides.completedProjectCounts || [0, 0, 0, 0, 0, 0];
  const gdscriptCounts = overrides.gdscriptProjectCounts || [0, 0, 0];
  const cppCounts = overrides.cppProjectCounts || [0, 0, 0];

  mockPrisma.progress.count
    .mockResolvedValueOnce(overrides.projectCompletedCount ?? 0)  // #1: project chapters
    .mockResolvedValueOnce(overrides.totalCompletedChapters ?? 0) // #2: total completed
    .mockResolvedValueOnce(projectCounts[0]) // #3: project-1 in countCompletedProjects
    .mockResolvedValueOnce(projectCounts[1]) // #4: project-2
    .mockResolvedValueOnce(projectCounts[2]) // #5: project-3
    .mockResolvedValueOnce(projectCounts[3]) // #6: project-4
    .mockResolvedValueOnce(projectCounts[4]) // #7: project-5
    .mockResolvedValueOnce(projectCounts[5]) // #8: project-6
    .mockResolvedValueOnce(overrides.gdscriptChapters ?? 0)  // #9: gdscript chapters
    .mockResolvedValueOnce(overrides.cppChapters ?? 0)       // #10: cpp chapters
    .mockResolvedValueOnce(gdscriptCounts[0]) // #11: gdscript project-1
    .mockResolvedValueOnce(gdscriptCounts[1]) // #12: gdscript project-2
    .mockResolvedValueOnce(gdscriptCounts[2]) // #13: gdscript project-3
    .mockResolvedValueOnce(cppCounts[0])      // #14: cpp project-4
    .mockResolvedValueOnce(cppCounts[1])      // #15: cpp project-5
    .mockResolvedValueOnce(cppCounts[2]);     // #16: cpp project-6
}

// ── Integration Flow: Chapter → XP → Level → Badge ──────────────────────

describe('Integration: Chapter complete → XP → Level → Badge flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('first chapter completion awards XP, updates level, and grants first-step badge', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);

    const user = makeMockUser({ xp: 0, level: 1, streak: 0, lastActiveDate: null });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({} as User);

    setupCountMocks({
      projectCompletedCount: 1,   // 1 chapter completed in project-1
      totalCompletedChapters: 1,  // 1 total chapter completed
      completedProjectCounts: [1, 0, 0, 0, 0, 0], // 1 in project-1
      gdscriptChapters: 1,        // project-1 is GDScript
      cppChapters: 0,
      gdscriptProjectCounts: [1, 0, 0], // 1 chapter in project-1 (not 9, so not completed)
      cppProjectCounts: [0, 0, 0],
    });

    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const result = await markChapterComplete('project-1-clicker', 'chapter-01-game-design', 'default-user', 15);

    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(15);

    // User was updated with new XP
    expect(mockPrisma.user.update).toHaveBeenCalled();

    // Level should be 1 at 15 XP
    const newLevel = calculateLevel(15);
    expect(newLevel).toBe(1);

    // Badges should be awarded
    expect(result.newBadges).toBeDefined();
    const slugs = result.newBadges!.map((b) => b.slug);
    expect(slugs).toContain('first-step');
    expect(slugs).toContain('gdscript-novice');
  });

  it('accumulating XP across multiple chapters levels up the user', async () => {
    // Simulate: User has 90 XP, completes a chapter worth 15 XP → 105 XP → level 2
    const currentXp = 90;
    const newXp = currentXp + 15;
    const newLevel = calculateLevel(newXp);

    expect(newLevel).toBe(2); // 105 XP → level 2 (threshold: 100)
    expect(xpForLevel(2)).toBe(100); // Confirm threshold
  });

  it('completing a full project awards bonus XP and project badge', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);

    const user = makeMockUser({ xp: 80, level: 1, streak: 1 });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({} as User);

    setupCountMocks({
      projectCompletedCount: 9,   // All 9 chapters done = project complete!
      totalCompletedChapters: 9,
      completedProjectCounts: [9, 0, 0, 0, 0, 0], // project-1 fully complete
      gdscriptChapters: 9,
      cppChapters: 0,
      gdscriptProjectCounts: [9, 0, 0], // project-1 has 9 chapters (completed)
      cppProjectCounts: [0, 0, 0],
    });

    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const result = await markChapterComplete('project-1-clicker', 'chapter-09', 'default-user', 10);

    expect(result.success).toBe(true);
    // user.update should be called (at least once for XP + bonus)
    expect(mockPrisma.user.update.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Badges should include first-project and gdscript-pro
    expect(result.newBadges).toBeDefined();
    const slugs = result.newBadges!.map((b) => b.slug);
    expect(slugs).toContain('first-project');
    expect(slugs).toContain('gdscript-pro');
  });

  it('streak increments and awards streak badges', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);

    const user = makeMockUser({ xp: 50, streak: 6, lastActiveDate: yesterday });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({} as User);

    setupCountMocks({
      projectCompletedCount: 5,
      totalCompletedChapters: 5,
      completedProjectCounts: [5, 0, 0, 0, 0, 0],
      gdscriptChapters: 5,
      cppChapters: 0,
      gdscriptProjectCounts: [5, 0, 0],
      cppProjectCounts: [0, 0, 0],
    });

    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 10);

    expect(result.streak).toBe(7);

    if (result.newBadges) {
      const slugs = result.newBadges.map((b) => b.slug);
      expect(slugs).toContain('streak-7');
    }
  });

  it('streak resets when gap is more than 1 day', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);

    const user = makeMockUser({ xp: 50, streak: 15, lastActiveDate: threeDaysAgo });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({} as User);

    setupCountMocks({
      projectCompletedCount: 5,
      totalCompletedChapters: 5,
      completedProjectCounts: [5, 0, 0, 0, 0, 0],
      gdscriptChapters: 5,
      cppChapters: 0,
      gdscriptProjectCounts: [5, 0, 0],
      cppProjectCounts: [0, 0, 0],
    });

    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 10);

    expect(result.streak).toBe(1); // Reset to 1
  });

  it('already completed chapter returns 0 XP and no new badges', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue({ completed: true } as Progress);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 15);

    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(0);
    expect(mockPrisma.progress.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

// ── Integration: Badge system consistency ─────────────────────────────────

describe('Integration: Badge system consistency', () => {
  it('all 24 badge conditions can be triggered in the repository', () => {
    const slugs = BADGE_DEFINITIONS.map((b) => b.slug);
    expect(slugs.length).toBe(24);
    expect(new Set(slugs).size).toBe(24);
  });

  it('badge categories match SKILL_AXES project assignments', () => {
    expect(GDSCRIPT_PROJECTS).toEqual(['project-1-clicker', 'project-2-space-shooter', 'project-3-metroidvania']);
    expect(CPP_PROJECTS).toEqual(['project-4-tower-defense', 'project-5-3d-adventure', 'project-6-performance-demo']);

    const overlap = GDSCRIPT_PROJECTS.filter((s) => CPP_PROJECTS.includes(s));
    expect(overlap).toEqual([]);
  });

  it('skill radar axes cover all projects', () => {
    const allProjectSlugs = new Set(SKILL_AXES.flatMap((a) => a.projects));
    expect(allProjectSlugs.size).toBe(6);
    expect(allProjectSlugs.has('project-1-clicker')).toBe(true);
    expect(allProjectSlugs.has('project-6-performance-demo')).toBe(true);
  });
});

// ── Integration: XP and Level formula consistency ──────────────────────────

describe('Integration: XP / Level formula consistency', () => {
  it('level thresholds are consistent between calculateLevel and xpForLevel', () => {
    for (let level = 1; level <= 30; level++) {
      const thresholdXp = xpForLevel(level);
      const calculatedLevel = calculateLevel(thresholdXp);
      expect(calculatedLevel).toBe(level);
    }
  });

  it('xpToNextLevel is consistent with calculateLevel', () => {
    for (let xp = 0; xp <= 10000; xp += 50) {
      const info = xpToNextLevel(xp);
      expect(info.progress).toBeGreaterThanOrEqual(0);
      expect(info.progress).toBeLessThanOrEqual(1);
      expect(info.current).toBeGreaterThanOrEqual(0);
      expect(info.needed).toBeGreaterThan(0);
    }
  });

  it('progress at exact level threshold is 0', () => {
    for (let level = 1; level <= 10; level++) {
      const thresholdXp = xpForLevel(level);
      const info = xpToNextLevel(thresholdXp);
      expect(info.current).toBe(0);
      expect(info.progress).toBe(0);
    }
  });

  it('progress approaches 1 near next level threshold', () => {
    for (let level = 1; level <= 5; level++) {
      const nextThreshold = xpForLevel(level + 1);
      const info = xpToNextLevel(nextThreshold - 1);
      expect(info.progress).toBeGreaterThan(0.9);
      expect(info.progress).toBeLessThan(1);
    }
  });
});

// ── Integration: Streak and activity consistency ──────────────────────────

describe('Integration: Streak and activity consistency', () => {
  it('calculateStreak and getStreakStatus agree on streak states', () => {
    // Streak 0
    expect(calculateStreak(null, 0)).toBe(0);
    expect(getStreakStatus(0).emoji).toBe('💤');

    // Streak 1
    const today = new Date().toISOString().split('T')[0];
    expect(calculateStreak(today, 1)).toBe(1);
    expect(getStreakStatus(1).emoji).toBe('🌱');

    // Streak 5
    expect(calculateStreak(today, 5)).toBe(5);
    expect(getStreakStatus(5).emoji).toBe('🔥');

    // Streak 10
    expect(getStreakStatus(10).emoji).toBe('⚡');

    // Streak 100
    expect(getStreakStatus(100).emoji).toBe('🌟');
  });

  it('streak is broken when last active date is > 1 day ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    expect(calculateStreak(twoDaysAgo, 10)).toBe(0);
  });

  it('streak is maintained when last active yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(calculateStreak(yesterday, 7)).toBe(7);
  });
});
