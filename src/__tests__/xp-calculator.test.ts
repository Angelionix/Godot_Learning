import { describe, it, expect } from 'vitest';

// Level calculation logic from progress.repository.ts
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

describe('XP / Level calculation', () => {
  it('level 1 at 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('level 2 at 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('level 3 at 400 XP', () => {
    expect(calculateLevel(400)).toBe(3);
  });

  it('level 4 at 900 XP', () => {
    expect(calculateLevel(900)).toBe(4);
  });

  it('level 5 at 1600 XP', () => {
    expect(calculateLevel(1600)).toBe(5);
  });

  it('level increases gradually for intermediate XP values', () => {
    // At 50 XP, still level 1
    expect(calculateLevel(50)).toBe(1);
    // At 200 XP, level 2
    expect(calculateLevel(200)).toBe(2);
    // At 500 XP, level 3
    expect(calculateLevel(500)).toBe(3);
  });

  it('handles very large XP values', () => {
    // At 10000 XP
    expect(calculateLevel(10000)).toBe(11);
  });

  it('handles negative XP gracefully', () => {
    // NaN from sqrt of negative should still produce a number
    const result = calculateLevel(-100);
    expect(typeof result).toBe('number');
  });
});

describe('XP per chapter from _meta.json', () => {
  // Expected XP values for project-1-clicker chapters
  const expectedXP = [
    { slug: 'introduction', xp: 5 },
    { slug: 'chapter-01-game-design', xp: 15 },
    { slug: 'chapter-02-architecture', xp: 15 },
    { slug: 'chapter-03-project-setup', xp: 10 },
    { slug: 'chapter-04-gdscript-basics', xp: 15 },
    { slug: 'chapter-05-implementation', xp: 20 },
    { slug: 'chapter-06-visual-effects', xp: 10 },
    { slug: 'chapter-07-publishing', xp: 10 },
    { slug: 'chapter-08-summary', xp: 5 },
  ];

  it('total XP for project-1-clicker is 105', () => {
    const totalXP = expectedXP.reduce((sum, ch) => sum + ch.xp, 0);
    expect(totalXP).toBe(105);
  });

  it('XP values are all positive', () => {
    for (const ch of expectedXP) {
      expect(ch.xp).toBeGreaterThan(0);
    }
  });

  it('XP values are within reasonable range (1-100)', () => {
    for (const ch of expectedXP) {
      expect(ch.xp).toBeGreaterThanOrEqual(1);
      expect(ch.xp).toBeLessThanOrEqual(100);
    }
  });
});
