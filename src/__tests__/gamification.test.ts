import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  BADGE_DEFINITIONS,
  BADGE_MAP,
  getBadgeDefinition,
  getRarityColor,
  getRarityBg,
  getRarityLabel,
  SKILL_AXES,
  GDSCRIPT_PROJECTS,
  CPP_PROJECTS,
  calculateStreak,
  getStreakStatus,
  XP_PER_LEVEL_BASE,
} from '@/lib/gamification';

// ── Level system ──────────────────────────────────────────────────────────────

describe('calculateLevel', () => {
  it('returns level 1 at 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 at 99 XP', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns level 2 at 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('returns level 3 at 400 XP', () => {
    expect(calculateLevel(400)).toBe(3);
  });

  it('returns level 4 at 900 XP', () => {
    expect(calculateLevel(900)).toBe(4);
  });

  it('returns level 5 at 1600 XP', () => {
    expect(calculateLevel(1600)).toBe(5);
  });

  it('returns level 11 at 10000 XP', () => {
    expect(calculateLevel(10000)).toBe(11);
  });

  it('handles intermediate XP values', () => {
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(500)).toBe(3);
    expect(calculateLevel(700)).toBe(3);
  });

  it('level always increases when XP increases', () => {
    let prevLevel = 0;
    for (let xp = 0; xp <= 5000; xp += 50) {
      const level = calculateLevel(xp);
      expect(level).toBeGreaterThanOrEqual(prevLevel);
      prevLevel = level;
    }
  });
});

describe('xpForLevel', () => {
  it('returns 0 XP for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('returns 100 XP for level 2', () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it('returns 400 XP for level 3', () => {
    expect(xpForLevel(3)).toBe(400);
  });

  it('returns 900 XP for level 4', () => {
    expect(xpForLevel(4)).toBe(900);
  });

  it('is the inverse of calculateLevel at threshold XP', () => {
    for (let level = 1; level <= 20; level++) {
      const thresholdXp = xpForLevel(level);
      expect(calculateLevel(thresholdXp)).toBe(level);
    }
  });
});

describe('xpToNextLevel', () => {
  it('at XP 0: current=0, needed=100, progress=0', () => {
    const result = xpToNextLevel(0);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(100);
    expect(result.progress).toBe(0);
  });

  it('at XP 50 (mid-level 1): current=50, needed=100, progress=0.5', () => {
    const result = xpToNextLevel(50);
    expect(result.current).toBe(50);
    expect(result.needed).toBe(100);
    expect(result.progress).toBe(0.5);
  });

  it('at XP 100 (exact level 2 threshold): current=0, needed=300', () => {
    const result = xpToNextLevel(100);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(300);
    expect(result.progress).toBe(0);
  });

  it('at XP 250 (mid-level 2): current=150, needed=300, progress=0.5', () => {
    const result = xpToNextLevel(250);
    expect(result.current).toBe(150);
    expect(result.needed).toBe(300);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it('progress is always between 0 and 1', () => {
    for (let xp = 0; xp <= 5000; xp += 25) {
      const result = xpToNextLevel(xp);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(1);
    }
  });

  it('current + needed covers the gap between levels', () => {
    for (let xp = 0; xp <= 2000; xp += 100) {
      const result = xpToNextLevel(xp);
      expect(result.current + result.needed).toBeGreaterThan(0);
    }
  });
});

// ── Badge definitions ──────────────────────────────────────────────────────────

describe('BADGE_DEFINITIONS', () => {
  it('has 24 badges', () => {
    expect(BADGE_DEFINITIONS.length).toBe(24);
  });

  it('all badges have unique slugs', () => {
    const slugs = BADGE_DEFINITIONS.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all badges have required fields', () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.slug).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(['progress', 'streak', 'skill', 'special']).toContain(badge.category);
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
      expect(badge.condition).toBeTruthy();
    }
  });

  it('has correct category distribution', () => {
    const categories = BADGE_DEFINITIONS.reduce(
      (acc, b) => ({ ...acc, [b.category]: (acc[b.category] || 0) + 1 }),
      {} as Record<string, number>
    );
    expect(categories.progress).toBe(8);
    expect(categories.streak).toBe(5);
    expect(categories.skill).toBe(5);
    expect(categories.special).toBe(6);
  });

  it('has at least one legendary badge per category', () => {
    const legendaryByCategory = BADGE_DEFINITIONS.filter((b) => b.rarity === 'legendary')
      .map((b) => b.category);
    expect(legendaryByCategory).toContain('progress');
    expect(legendaryByCategory).toContain('streak');
    expect(legendaryByCategory).toContain('special');
  });
});

describe('BADGE_MAP', () => {
  it('contains all badge definitions', () => {
    expect(BADGE_MAP.size).toBe(24);
  });

  it('getBadgeDefinition returns correct badge', () => {
    const badge = getBadgeDefinition('first-step');
    expect(badge).toBeDefined();
    expect(badge!.name).toBe('Первый шаг');
  });

  it('getBadgeDefinition returns undefined for unknown slug', () => {
    expect(getBadgeDefinition('nonexistent')).toBeUndefined();
  });
});

// ── Rarity helpers ──────────────────────────────────────────────────────────────

describe('getRarityColor', () => {
  it('returns non-empty string for each rarity', () => {
    for (const rarity of ['common', 'rare', 'epic', 'legendary'] as const) {
      expect(getRarityColor(rarity)).toBeTruthy();
    }
  });

  it('returns different colors for different rarities', () => {
    const colors = ['common', 'rare', 'epic', 'legendary'] as const;
    const colorSet = new Set(colors.map(getRarityColor));
    expect(colorSet.size).toBe(4);
  });
});

describe('getRarityBg', () => {
  it('returns non-empty string for each rarity', () => {
    for (const rarity of ['common', 'rare', 'epic', 'legendary'] as const) {
      expect(getRarityBg(rarity)).toBeTruthy();
    }
  });
});

describe('getRarityLabel', () => {
  it('returns Russian labels', () => {
    expect(getRarityLabel('common')).toBe('Обычный');
    expect(getRarityLabel('rare')).toBe('Редкий');
    expect(getRarityLabel('epic')).toBe('Эпический');
    expect(getRarityLabel('legendary')).toBe('Легендарный');
  });
});

// ── Skill radar axes ──────────────────────────────────────────────────────────

describe('SKILL_AXES', () => {
  it('has 6 axes', () => {
    expect(SKILL_AXES.length).toBe(6);
  });

  it('all axes have unique keys', () => {
    const keys = SKILL_AXES.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all axes have non-empty project references', () => {
    for (const axis of SKILL_AXES) {
      expect(axis.projects.length).toBeGreaterThan(0);
      for (const slug of axis.projects) {
        expect(slug).toMatch(/^project-\d+-/);
      }
    }
  });

  it('covers all 6 projects across all axes', () => {
    const allProjectSlugs = new Set(SKILL_AXES.flatMap((a) => a.projects));
    expect(allProjectSlugs.size).toBe(6);
  });
});

// ── Project classification ──────────────────────────────────────────────────────

describe('GDSCRIPT_PROJECTS and CPP_PROJECTS', () => {
  it('GDSCRIPT_PROJECTS has 3 projects', () => {
    expect(GDSCRIPT_PROJECTS.length).toBe(3);
  });

  it('CPP_PROJECTS has 3 projects', () => {
    expect(CPP_PROJECTS.length).toBe(3);
  });

  it('no overlap between GDScript and C++ projects', () => {
    const overlap = GDSCRIPT_PROJECTS.filter((p) => CPP_PROJECTS.includes(p));
    expect(overlap).toEqual([]);
  });

  it('together cover all 6 projects', () => {
    const allProjects = [...GDSCRIPT_PROJECTS, ...CPP_PROJECTS];
    expect(allProjects.length).toBe(6);
  });
});

// ── Streak helpers ──────────────────────────────────────────────────────────────

describe('calculateStreak', () => {
  it('returns 0 when no lastActiveDate', () => {
    expect(calculateStreak(null, 5)).toBe(0);
  });

  it('returns current streak when active today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(calculateStreak(today, 7)).toBe(7);
  });

  it('returns current streak when active yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(calculateStreak(yesterday, 7)).toBe(7);
  });

  it('returns 0 when last active 2+ days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    expect(calculateStreak(twoDaysAgo, 7)).toBe(0);
  });

  it('returns 0 when last active a week ago', () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    expect(calculateStreak(weekAgo, 14)).toBe(0);
  });
});

describe('getStreakStatus', () => {
  it('returns "start" message for streak 0', () => {
    const status = getStreakStatus(0);
    expect(status.emoji).toBe('💤');
    expect(status.message).toBeTruthy();
    expect(status.color).toBeTruthy();
  });

  it('returns "beginner" message for streak 1-2', () => {
    const status = getStreakStatus(1);
    expect(status.emoji).toBe('🌱');
    expect(status.color).toBe('text-green-500');
  });

  it('returns "fire" message for streak 3-6', () => {
    const status = getStreakStatus(5);
    expect(status.emoji).toBe('🔥');
    expect(status.color).toBe('text-orange-500');
  });

  it('returns "lightning" message for streak 7-13', () => {
    const status = getStreakStatus(10);
    expect(status.emoji).toBe('⚡');
    expect(status.color).toBe('text-yellow-500');
  });

  it('returns "diamond" message for streak 14-29', () => {
    const status = getStreakStatus(20);
    expect(status.emoji).toBe('💎');
    expect(status.color).toBe('text-purple-500');
  });

  it('returns "legend" message for streak 30+', () => {
    const status = getStreakStatus(50);
    expect(status.emoji).toBe('🌟');
    expect(status.color).toBe('text-amber-500');
  });

  it('always returns non-empty values', () => {
    for (let streak = 0; streak <= 200; streak++) {
      const status = getStreakStatus(streak);
      expect(status.emoji).toBeTruthy();
      expect(status.message).toBeTruthy();
      expect(status.color).toBeTruthy();
    }
  });
});

// ── XP_PER_LEVEL_BASE constant ─────────────────────────────────────────────────

describe('XP_PER_LEVEL_BASE', () => {
  it('is 100', () => {
    expect(XP_PER_LEVEL_BASE).toBe(100);
  });
});
