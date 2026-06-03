import { describe, it, expect } from 'vitest';
import {
  getAllProjects,
  getProjectMeta,
  getProjectChapters,
  getChapterContent,
  getChapterNavigation,
} from '@/lib/content';

describe('content system', () => {
  describe('getAllProjects', () => {
    it('returns 6 projects', () => {
      const projects = getAllProjects();
      expect(projects.length).toBe(6);
    });

    it('projects have required fields', () => {
      const projects = getAllProjects();
      for (const project of projects) {
        expect(project.projectSlug).toBeTruthy();
        expect(project.title).toBeTruthy();
        expect(project.chapters.length).toBeGreaterThan(0);
      }
    });

    it('projects are ordered correctly', () => {
      const projects = getAllProjects();
      expect(projects[0].projectSlug).toBe('project-1-clicker');
      expect(projects[1].projectSlug).toBe('project-2-space-shooter');
      expect(projects[5].projectSlug).toBe('project-6-performance-demo');
    });
  });

  describe('getProjectMeta', () => {
    it('returns meta for project-1-clicker', () => {
      const meta = getProjectMeta('project-1-clicker');
      expect(meta).not.toBeNull();
      expect(meta!.title).toBe('Кликер / Idle Game');
      expect(meta!.projectSlug).toBe('project-1-clicker');
      expect(meta!.chapters.length).toBe(9);
    });

    it('returns null for unknown project', () => {
      const meta = getProjectMeta('nonexistent');
      expect(meta).toBeNull();
    });

    it('meta includes tags', () => {
      const meta = getProjectMeta('project-1-clicker');
      expect(meta!.tags.length).toBeGreaterThan(0);
      expect(meta!.tags).toContain('gdscript');
    });

    it('meta includes sprint and bridge', () => {
      const meta = getProjectMeta('project-1-clicker');
      expect(meta!.sprint).toBeDefined();
      expect(meta!.bridge).toBeDefined();
    });
  });

  describe('getProjectChapters', () => {
    it('returns chapters for project-1-clicker', () => {
      const chapters = getProjectChapters('project-1-clicker');
      expect(chapters.length).toBe(9);
      expect(chapters[0].slug).toBe('introduction');
    });

    it('chapters have xp and estimatedTime', () => {
      const chapters = getProjectChapters('project-1-clicker');
      for (const chapter of chapters) {
        expect(chapter.xp).toBeGreaterThan(0);
        expect(chapter.estimatedTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getChapterContent', () => {
    it('returns content for a valid chapter', () => {
      const content = getChapterContent('project-1-clicker', 'chapter-01-game-design');
      expect(content).not.toBeNull();
      expect(content!.meta.title).toBe('Глава 1: Геймдизайн');
      expect(content!.content).toBeTruthy();
      expect(content!.content.length).toBeGreaterThan(100);
    });

    it('returns null for invalid chapter', () => {
      const content = getChapterContent('project-1-clicker', 'nonexistent');
      expect(content).toBeNull();
    });

    it('content includes frontmatter data', () => {
      const content = getChapterContent('project-1-clicker', 'chapter-01-game-design');
      expect(content!.meta.xp).toBe(15);
      expect(content!.meta.estimatedTime).toBe(45);
    });
  });

  describe('getChapterNavigation', () => {
    it('returns prev and next for middle chapter', () => {
      const nav = getChapterNavigation('project-1-clicker', 'chapter-02-architecture');
      expect(nav.prev).not.toBeNull();
      expect(nav.prev!.slug).toBe('chapter-01-game-design');
      expect(nav.next).not.toBeNull();
      expect(nav.next!.slug).toBe('chapter-03-project-setup');
    });

    it('returns no prev for first chapter', () => {
      const nav = getChapterNavigation('project-1-clicker', 'introduction');
      expect(nav.prev).toBeNull();
      expect(nav.next).not.toBeNull();
    });

    it('returns no next for last chapter', () => {
      const chapters = getProjectChapters('project-1-clicker');
      const lastChapter = chapters[chapters.length - 1];
      const nav = getChapterNavigation('project-1-clicker', lastChapter.slug);
      expect(nav.next).toBeNull();
      expect(nav.prev).not.toBeNull();
    });
  });
});
