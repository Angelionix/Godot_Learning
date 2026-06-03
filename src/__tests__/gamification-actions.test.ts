import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server actions module — they're "use server" so we test validation logic only
// by calling the schemas directly

import { z } from 'zod';

// Replicate the schemas from gamification.action.ts (since "use server" functions
// can't be imported in test environment, we test the schema validation logic)

const getUserGamificationSchema = z.object({
  userId: z.string().min(1),
});

const getActivityCalendarSchema = z.object({
  userId: z.string().min(1),
  days: z.number().min(1).max(730).optional().default(365),
});

describe('getUserGamificationSchema', () => {
  it('accepts valid userId', () => {
    const result = getUserGamificationSchema.safeParse({ userId: 'default-user' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('default-user');
    }
  });

  it('rejects empty userId', () => {
    const result = getUserGamificationSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing userId', () => {
    const result = getUserGamificationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects numeric userId', () => {
    const result = getUserGamificationSchema.safeParse({ userId: 123 });
    expect(result.success).toBe(false);
  });
});

describe('getActivityCalendarSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 90 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('user-1');
      expect(result.data.days).toBe(90);
    }
  });

  it('defaults days to 365 when not provided', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(365);
    }
  });

  it('rejects empty userId', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: '', days: 30 });
    expect(result.success).toBe(false);
  });

  it('rejects days = 0', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects days > 730', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 1000 });
    expect(result.success).toBe(false);
  });

  it('rejects negative days', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: -10 });
    expect(result.success).toBe(false);
  });

  it('accepts fractional days (z.number() without .int() allows them)', () => {
    // Note: schema uses z.number() without .int(), so fractional values pass
    // This is acceptable since days parameter is typically an integer from UI
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 30.5 });
    expect(result.success).toBe(true);
  });

  it('accepts days = 1 (minimum)', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts days = 730 (maximum)', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 730 });
    expect(result.success).toBe(true);
  });

  it('rejects non-number days', () => {
    const result = getActivityCalendarSchema.safeParse({ userId: 'user-1', days: 'thirty' });
    expect(result.success).toBe(false);
  });
});

// ── Progress action schemas (existing) ──────────────────────────────────────

import {
  markChapterCompleteSchema,
  getUserProgressSchema,
} from '@/validators/progress';

describe('markChapterCompleteSchema (gamification integration)', () => {
  it('accepts XP values matching _meta.json range (5-20)', () => {
    for (const xp of [5, 10, 15, 20]) {
      const result = markChapterCompleteSchema.safeParse({
        projectSlug: 'project-1-clicker',
        chapterSlug: 'chapter-01-game-design',
        xp,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts XP value of 0 (chapter not worth XP)', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'introduction',
      xp: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts project completion bonus XP (200)', () => {
    // Bonus XP is awarded internally, but the schema should accept up to 1000
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'final-chapter',
      xp: 200,
    });
    expect(result.success).toBe(true);
  });

  it('rejects XP > 1000', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01',
      xp: 1001,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative XP', () => {
    const result = markChapterCompleteSchema.safeParse({
      projectSlug: 'project-1-clicker',
      chapterSlug: 'chapter-01',
      xp: -5,
    });
    expect(result.success).toBe(false);
  });
});
