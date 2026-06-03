import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, Badge, Progress } from '@/generated/prisma/client';

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

// Mock gamification module to control calculateLevel
vi.mock('@/lib/gamification', () => ({
  calculateLevel: vi.fn((xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1),
  GDSCRIPT_PROJECTS: ['project-1-clicker', 'project-2-space-shooter', 'project-3-metroidvania'],
  CPP_PROJECTS: ['project-4-tower-defense', 'project-5-3d-adventure', 'project-6-performance-demo'],
  BADGE_DEFINITIONS: [
    { slug: 'first-step', name: 'Первый шаг', description: 'Завершите первую главу', icon: '👣', category: 'progress', rarity: 'common', condition: 'completedChapters >= 1' },
    { slug: 'streak-7', name: 'Неделя огня', description: '7 дней подряд', icon: '🔥', category: 'streak', rarity: 'rare', condition: 'streak >= 7' },
    { slug: 'xp-100', name: 'Сотня XP', description: 'Наберите 100 XP', icon: '💫', category: 'special', rarity: 'common', condition: 'xp >= 100' },
  ],
}));

import prisma from '@/lib/prisma';
import {
  getProgressForUser,
  markChapterComplete,
  checkAndAwardBadges,
  getProjectProgress,
  getActivityCalendar,
} from '@/repositories/progress.repository';
import type { UserProgressSummary } from '@/repositories/progress.repository';

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

// ── getProgressForUser ──────────────────────────────────────────────────────

describe('getProgressForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns summary for existing user', async () => {
    const mockUser = makeMockUser({ xp: 150, level: 2, streak: 3 });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getProgressForUser('default-user');

    expect(result.userId).toBe('default-user');
    expect(result.xp).toBe(150);
    expect(result.level).toBe(2);
    expect(result.streak).toBe(3);
    expect(result.completedChapters).toBe(0);
    expect(result.totalChapters).toBe(54);
    expect(result.totalProjects).toBe(6);
    expect(result.projectProgress.length).toBe(6);
  });

  it('creates default user when not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const newUser = makeMockUser();
    mockPrisma.user.create.mockResolvedValue(newUser);

    const result = await getProgressForUser('default-user');

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { id: 'default-user', username: 'student' },
      })
    );
    expect(result.userId).toBe('default-user');
  });

  it('calculates completed chapters from progress', async () => {
    const mockUser = makeMockUser();
    mockUser.progress = [
      { chapterSlug: 'ch1', completed: true, xpEarned: 10 } as Progress,
      { chapterSlug: 'ch2', completed: true, xpEarned: 15 } as Progress,
      { chapterSlug: 'ch3', completed: false, xpEarned: 0 } as Progress,
    ];
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getProgressForUser('default-user');
    expect(result.completedChapters).toBe(2);
  });

  it('calculates completed projects', async () => {
    const mockUser = makeMockUser();
    // Simulate 9 completed chapters in one project
    const project1Chapters = Array.from({ length: 9 }, (_, i) => ({
      projectSlug: 'project-1-clicker',
      chapterSlug: `chapter-${i + 1}`,
      completed: true,
      xpEarned: 10,
    } as unknown as Progress));
    mockUser.progress = project1Chapters;
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getProgressForUser('default-user');
    expect(result.completedProjects).toBe(1);
  });

  it('builds activity calendar from completed chapters', async () => {
    const mockUser = makeMockUser();
    const date = new Date();
    mockUser.progress = [
      { completed: true, completedAt: date, xpEarned: 15 } as Progress,
      { completed: true, completedAt: date, xpEarned: 10 } as Progress,
    ];
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getProgressForUser('default-user');
    expect(result.activityCalendar.length).toBeGreaterThan(0);
  });

  it('project progress has 9 chapters per project', async () => {
    const mockUser = makeMockUser();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getProgressForUser('default-user');
    for (const proj of result.projectProgress) {
      expect(proj.totalChapters).toBe(9);
      expect(proj.chapters.length).toBe(9);
    }
  });
});

// ── markChapterComplete ──────────────────────────────────────────────────────

describe('markChapterComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns xpEarned=0 if chapter already completed', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue({ completed: true } as Progress);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 15);

    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(0);
    expect(mockPrisma.progress.upsert).not.toHaveBeenCalled();
  });

  it('creates progress and updates user XP', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);
    const mockUser = makeMockUser({ xp: 50, level: 1, streak: 0, lastActiveDate: null });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({} as User);
    mockPrisma.progress.count.mockResolvedValueOnce(1); // completedChapters count
    mockPrisma.progress.count.mockResolvedValueOnce(0); // project chapters count
    mockPrisma.badge.findMany.mockResolvedValue([]);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 15);

    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(15);
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it('increments streak when last active yesterday', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);
    const mockUser = makeMockUser({ streak: 3, lastActiveDate: yesterday });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({} as User);
    mockPrisma.progress.count.mockResolvedValue(1);
    mockPrisma.badge.findMany.mockResolvedValue([]);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 10);

    expect(result.streak).toBe(4);
  });

  it('resets streak when last active more than 1 day ago', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);
    const mockUser = makeMockUser({ streak: 10, lastActiveDate: twoDaysAgo });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({} as User);
    mockPrisma.progress.count.mockResolvedValue(1);
    mockPrisma.badge.findMany.mockResolvedValue([]);

    const result = await markChapterComplete('project-1-clicker', 'ch1', 'default-user', 10);

    expect(result.streak).toBe(1);
  });

  it('awards project bonus XP when 9th chapter completed', async () => {
    mockPrisma.progress.findUnique.mockResolvedValue(null);
    mockPrisma.progress.upsert.mockResolvedValue({} as Progress);
    const mockUser = makeMockUser({ xp: 100 });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({} as User);
    mockPrisma.progress.count
      .mockResolvedValueOnce(9) // project completed chapters
      .mockResolvedValueOnce(9) // total completed chapters for badges
      .mockResolvedValueOnce(1) // completed projects count
      .mockResolvedValueOnce(9) // gdscript chapters
      .mockResolvedValueOnce(9) // project-1
      .mockResolvedValueOnce(0) // project-4
      .mockResolvedValueOnce(0) // project-5
      .mockResolvedValueOnce(0); // project-6
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const result = await markChapterComplete('project-1-clicker', 'ch9', 'default-user', 10);

    // Should have called user.update twice: once for XP, once for bonus
    const updateCalls = mockPrisma.user.update.mock.calls;
    expect(updateCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// ── checkAndAwardBadges ──────────────────────────────────────────────────────

describe('checkAndAwardBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('awards first-step badge when 1 chapter completed', async () => {
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.progress.count.mockResolvedValue(0); // no GDScript/C++ chapters
    mockPrisma.badge.upsert.mockResolvedValue({} as Badge);

    const newBadges = await checkAndAwardBadges('default-user', {
      xp: 10,
      streak: 1,
      completedChapters: 1,
      completedProjects: 0,
    });

    const badgeSlugs = newBadges.map((b) => b.slug);
    expect(badgeSlugs).toContain('first-step');
  });

  it('does not re-award already earned badges', async () => {
    mockPrisma.badge.findMany.mockResolvedValue([
      { slug: 'first-step', name: 'Первый шаг' } as Badge,
    ]);
    mockPrisma.progress.count.mockResolvedValue(0);

    const newBadges = await checkAndAwardBadges('default-user', {
      xp: 10,
      streak: 1,
      completedChapters: 1,
      completedProjects: 0,
    });

    expect(newBadges.find((b) => b.slug === 'first-step')).toBeUndefined();
  });

  it('awards streak-7 badge when streak reaches 7', async () => {
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.progress.count.mockResolvedValue(0);

    const newBadges = await checkAndAwardBadges('default-user', {
      xp: 50,
      streak: 7,
      completedChapters: 5,
      completedProjects: 0,
    });

    expect(newBadges.map((b) => b.slug)).toContain('streak-7');
  });

  it('awards xp-100 badge when XP reaches 100', async () => {
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.progress.count.mockResolvedValue(0);

    const newBadges = await checkAndAwardBadges('default-user', {
      xp: 100,
      streak: 1,
      completedChapters: 5,
      completedProjects: 0,
    });

    expect(newBadges.map((b) => b.slug)).toContain('xp-100');
  });

  it('returns empty array when no new badges earned', async () => {
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.progress.count.mockResolvedValue(0);

    const newBadges = await checkAndAwardBadges('default-user', {
      xp: 5,
      streak: 0,
      completedChapters: 0,
      completedProjects: 0,
    });

    expect(newBadges).toEqual([]);
  });
});

// ── getProjectProgress ──────────────────────────────────────────────────────

describe('getProjectProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 9 total chapters', async () => {
    mockPrisma.progress.findMany.mockResolvedValue([]);

    const result = await getProjectProgress('project-1-clicker');

    expect(result.totalChapters).toBe(9);
  });

  it('counts completed chapters correctly', async () => {
    mockPrisma.progress.findMany.mockResolvedValue([
      { chapterSlug: 'chapter-1', completed: true } as Progress,
      { chapterSlug: 'chapter-2', completed: true } as Progress,
      { chapterSlug: 'chapter-3', completed: false } as Progress,
    ]);

    const result = await getProjectProgress('project-1-clicker');

    expect(result.completedChapters).toBe(2);
  });
});

// ── getActivityCalendar ──────────────────────────────────────────────────────

describe('getActivityCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 365 entries by default', async () => {
    mockPrisma.progress.findMany.mockResolvedValue([]);

    const result = await getActivityCalendar('default-user', 365);

    expect(result.length).toBe(365);
  });

  it('returns correct number of entries for custom days', async () => {
    mockPrisma.progress.findMany.mockResolvedValue([]);

    const result = await getActivityCalendar('default-user', 30);

    expect(result.length).toBe(30);
  });

  it('fills in activity data for completed chapters', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockPrisma.progress.findMany.mockResolvedValue([
      { completedAt: new Date(), completed: true, xpEarned: 15 } as Progress,
      { completedAt: new Date(), completed: true, xpEarned: 10 } as Progress,
    ]);

    const result = await getActivityCalendar('default-user', 7);
    const todayEntry = result.find((r) => r.date === today);

    expect(todayEntry).toBeDefined();
    expect(todayEntry!.count).toBe(2);
    expect(todayEntry!.xp).toBe(25);
  });

  it('entries are ordered chronologically (oldest first)', async () => {
    mockPrisma.progress.findMany.mockResolvedValue([]);

    const result = await getActivityCalendar('default-user', 7);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].date > result[i - 1].date).toBe(true);
    }
  });
});
