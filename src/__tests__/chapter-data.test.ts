import { describe, it, expect } from 'vitest';
import { getChaptersForProject, getAllProjectChaptersMap } from '@/lib/chapter-data';

describe('chapter-data', () => {
  describe('getChaptersForProject', () => {
    it('returns chapters for project-1-clicker', () => {
      const chapters = getChaptersForProject('project-1-clicker');
      expect(chapters.length).toBe(9);
      expect(chapters[0].slug).toBe('introduction');
      expect(chapters[0].title).toBe('Введение');
      expect(chapters[1].slug).toBe('chapter-01-game-design');
      expect(chapters[1].title).toBe('Глава 1: Геймдизайн');
    });

    it('returns chapters for project-2-space-shooter', () => {
      const chapters = getChaptersForProject('project-2-space-shooter');
      expect(chapters.length).toBe(8);
    });

    it('returns chapters for project-3-metroidvania', () => {
      const chapters = getChaptersForProject('project-3-metroidvania');
      expect(chapters.length).toBe(4);
    });

    it('returns empty array for unknown project', () => {
      const chapters = getChaptersForProject('nonexistent-project');
      expect(chapters).toEqual([]);
    });

    it('each chapter has slug and title', () => {
      const chapters = getChaptersForProject('project-1-clicker');
      for (const chapter of chapters) {
        expect(chapter.slug).toBeTruthy();
        expect(chapter.title).toBeTruthy();
        expect(typeof chapter.slug).toBe('string');
        expect(typeof chapter.title).toBe('string');
      }
    });
  });

  describe('getAllProjectChaptersMap', () => {
    it('returns map with all 6 projects', () => {
      const map = getAllProjectChaptersMap();
      expect(Object.keys(map).length).toBe(6);
      expect(map['project-1-clicker']).toBeDefined();
      expect(map['project-2-space-shooter']).toBeDefined();
      expect(map['project-3-metroidvania']).toBeDefined();
      expect(map['project-4-tower-defense']).toBeDefined();
      expect(map['project-5-3d-adventure']).toBeDefined();
      expect(map['project-6-performance-demo']).toBeDefined();
    });

    it('map values are arrays of ChapterInfo', () => {
      const map = getAllProjectChaptersMap();
      for (const [slug, chapters] of Object.entries(map)) {
        expect(Array.isArray(chapters)).toBe(true);
        expect(chapters.length).toBeGreaterThan(0);
        for (const chapter of chapters) {
          expect(chapter).toHaveProperty('slug');
          expect(chapter).toHaveProperty('title');
        }
      }
    });
  });
});
