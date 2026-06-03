import { describe, it, expect } from 'vitest';
import {
  markChapterCompleteSchema,
  getUserProgressSchema,
  getProjectProgressSchema,
  challengeAttemptSchema,
} from '@/validators/progress';

describe('markChapterCompleteSchema', () => {
  it('validates correct input with xp', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01-game-design',
      xp: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectSlug).toBe('project-1-clicker');
      expect(result.data.chapterSlug).toBe('chapter-01-game-design');
      expect(result.data.xp).toBe(15);
    }
  });

  it('validates input without xp (defaults to 0)', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-02-architecture',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.xp).toBe(0);
    }
  });

  it('rejects empty projectSlug', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: '',
      chapterSlug: 'chapter-01-game-design',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty chapterSlug', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative xp', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01-game-design',
      xp: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects xp over 1000', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01-game-design',
      xp: 1001,
    });
    expect(result.success).toBe(false);
  });

  it('accepts xp = 0', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01-game-design',
      xp: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts fractional xp as integer', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01-game-design',
      xp: 15.5,
    });
    // int() should reject non-integer
    expect(result.success).toBe(false);
  });
});

describe('getUserProgressSchema', () => {
  it('defaults userId to "default-user" when not provided', () => {
    const result = getUserProgressSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('default-user');
    }
  });

  it('accepts custom userId', () => {
    const result = getUserProgressSchema.safeParse({ userId: 'user-123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('user-123');
    }
  });

  it('rejects empty userId', () => {
    const result = getUserProgressSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });
});

describe('getProjectProgressSchema', () => {
  it('validates correct input', () => {
    const result = getProjectProgressSchema.safeParse({
      projectSlug: 'project-1-clicker',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty projectSlug', () => {
    const result = getProjectProgressSchema.safeParse({
      projectSlug: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('challengeAttemptSchema', () => {
  it('validates correct input', () => {
    const result = challengeAttemptSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-05-implementation',
      challengeSlug: 'critical-hit',
      code: 'func on_click(): pass',
      passed: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty code', () => {
    const result = challengeAttemptSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-05-implementation',
      challengeSlug: 'critical-hit',
      code: '',
      passed: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean passed', () => {
    const result = challengeAttemptSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-05-implementation',
      challengeSlug: 'critical-hit',
      code: 'pass',
      passed: 'yes',
    });
    expect(result.success).toBe(false);
  });
});
