import { describe, it, expect } from 'vitest';
import { getProjectChapters, getAllProjects } from '@/lib/content';

/**
 * Tests for the content system — the single source of truth for chapter data.
 * Previously tested the hardcoded chapter-data.ts; now tests _meta.json loading.
 */
describe('content system (chapters from _meta.json)', () => {
  describe('getProjectChapters', () => {
    it('returns chapters for project-1-clicker', () => {
      const chapters = getProjectChapters('project-1-clicker');
      expect(chapters.length).toBeGreaterThanOrEqual(8);
      expect(chapters[0].slug).toBe('introduction');
      expect(chapters[0].title).toBe('Введение');
      expect(chapters.find((c) => c.slug === 'chapter-01-game-design')).toBeDefined();
    });

    it('returns chapters for project-2-space-shooter', () => {
      const chapters = getProjectChapters('project-2-space-shooter');
      expect(chapters.length).toBeGreaterThanOrEqual(7);
    });

    it('returns chapters for all P2-P6 projects', () => {
      const slugs = [
        'project-3-metroidvania',
        'project-4-tower-defense',
        'project-5-3d-adventure',
        'project-6-performance-demo',
      ];
      for (const slug of slugs) {
        const chapters = getProjectChapters(slug);
        expect(chapters.length).toBeGreaterThanOrEqual(7);
      }
    });

    it('returns empty array for unknown project', () => {
      const chapters = getProjectChapters('nonexistent-project');
      expect(chapters).toEqual([]);
    });

    it('each chapter has slug, title, order, xp, estimatedTime', () => {
      const chapters = getProjectChapters('project-1-clicker');
      for (const chapter of chapters) {
        expect(chapter.slug).toBeTruthy();
        expect(chapter.title).toBeTruthy();
        expect(typeof chapter.slug).toBe('string');
        expect(typeof chapter.title).toBe('string');
        expect(typeof chapter.order).toBe('number');
        expect(typeof chapter.xp).toBe('number');
      }
    });

    it('chapters are sorted by order', () => {
      const chapters = getProjectChapters('project-1-clicker');
      for (let i = 1; i < chapters.length; i++) {
        expect(chapters[i].order).toBeGreaterThanOrEqual(chapters[i - 1].order);
      }
    });
  });

  describe('getAllProjects', () => {
    it('returns all 6 projects', () => {
      const projects = getAllProjects();
      expect(projects.length).toBe(6);
      expect(projects.map((p) => p.projectSlug)).toEqual([
        'project-1-clicker',
        'project-2-space-shooter',
        'project-3-metroidvania',
        'project-4-tower-defense',
        'project-5-3d-adventure',
        'project-6-performance-demo',
      ]);
    });

    it('each project has chapters array', () => {
      const projects = getAllProjects();
      for (const project of projects) {
        expect(Array.isArray(project.chapters)).toBe(true);
        expect(project.chapters.length).toBeGreaterThan(0);
      }
    });
  });
});
