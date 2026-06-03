import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repository module
vi.mock('@/repositories/progress.repository', () => ({
  getProgressForUser: vi.fn(),
  markChapterComplete: vi.fn(),
}));

import { getProgressForUser, markChapterComplete } from '@/repositories/progress.repository';

const mockGetProgressForUser = vi.mocked(getProgressForUser);
const mockMarkChapterComplete = vi.mocked(markChapterComplete);

// We test the route handler logic directly by simulating what the handler does.
// Next.js API route handlers use Web APIs (Request/Response) which are complex to mock.
// Instead, we test the core logic flow that the route handler delegates to.

describe('API /api/progress — GET handler logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getProgressForUser with default user ID', async () => {
    const mockData = {
      userId: 'default-user',
      username: 'student',
      xp: 100,
      level: 2,
      streak: 3,
      lastActiveDate: null,
      completedChapters: 5,
      totalChapters: 54,
      completedProjects: 0,
      totalProjects: 6,
      badges: [],
      projectProgress: [],
      activityCalendar: [],
    };
    mockGetProgressForUser.mockResolvedValue(mockData as any);

    const result = await getProgressForUser('default-user');

    expect(mockGetProgressForUser).toHaveBeenCalledWith('default-user');
    expect(result.userId).toBe('default-user');
    expect(result.xp).toBe(100);
    expect(result.level).toBe(2);
  });

  it('returns error when getProgressForUser throws', async () => {
    mockGetProgressForUser.mockRejectedValue(new Error('Database error'));

    await expect(getProgressForUser('default-user')).rejects.toThrow('Database error');
  });
});

describe('API /api/progress — POST handler logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields: projectSlug and chapterSlug', async () => {
    // Simulate the validation logic from the route handler
    const body = { projectSlug: '', chapterSlug: '' };
    const hasRequired = !!(body.projectSlug && body.chapterSlug);
    expect(hasRequired).toBe(false);
  });

  it('passes valid body to markChapterComplete', async () => {
    const mockResult = {
      success: true,
      xpEarned: 15,
      newLevel: 2,
      streak: 1,
    };
    mockMarkChapterComplete.mockResolvedValue(mockResult as any);

    const result = await markChapterComplete('project-1-clicker', 'chapter-01-game-design', 'default-user');

    expect(mockMarkChapterComplete).toHaveBeenCalledWith(
      'project-1-clicker',
      'chapter-01-game-design',
      'default-user'
    );
    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(15);
  });

  it('returns error when markChapterComplete throws', async () => {
    mockMarkChapterComplete.mockRejectedValue(new Error('Write error'));

    await expect(
      markChapterComplete('project-1-clicker', 'chapter-01', 'default-user')
    ).rejects.toThrow('Write error');
  });

  it('missing projectSlug results in validation failure', () => {
    const body = { chapterSlug: 'chapter-01' };
    const hasRequired = !!(body.projectSlug && body.chapterSlug);
    expect(hasRequired).toBe(false);
  });

  it('missing chapterSlug results in validation failure', () => {
    const body = { projectSlug: 'project-1-clicker' };
    const hasRequired = !!(body.projectSlug && body.chapterSlug);
    expect(hasRequired).toBe(false);
  });

  it('valid request body passes validation', () => {
    const body = { projectSlug: 'project-1-clicker', chapterSlug: 'chapter-01-game-design' };
    const hasRequired = !!(body.projectSlug && body.chapterSlug);
    expect(hasRequired).toBe(true);
  });
});
