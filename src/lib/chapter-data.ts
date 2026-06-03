/**
 * @deprecated Use `getProjectChapters()` and `getAllProjects()` from `@/lib/content` instead.
 * Chapter data is now loaded dynamically from `_meta.json` files.
 * This module is kept only for backwards compatibility and will be removed in a future version.
 *
 * The sidebar now receives chapter data as props from the server layout,
 * eliminating the need for this hardcoded duplication.
 */

import { getProjectChapters, getAllProjects } from '@/lib/content';

export interface ChapterInfo {
  slug: string;
  title: string;
}

export interface ProjectChaptersData {
  projectSlug: string;
  chapters: ChapterInfo[];
}

/** @deprecated Use getProjectChapters from @/lib/content */
export function getChaptersForProject(projectSlug: string): ChapterInfo[] {
  const chapters = getProjectChapters(projectSlug);
  return chapters.map((ch) => ({ slug: ch.slug, title: ch.title }));
}

/** @deprecated Use getAllProjects from @/lib/content */
export function getAllProjectChaptersMap(): Record<string, ChapterInfo[]> {
  const projects = getAllProjects();
  const map: Record<string, ChapterInfo[]> = {};
  for (const project of projects) {
    map[project.projectSlug] = project.chapters.map((ch) => ({
      slug: ch.slug,
      title: ch.title,
    }));
  }
  return map;
}

/** @deprecated Build from getAllProjects() instead */
export const projectChaptersData: ProjectChaptersData[] = (() => {
  const projects = getAllProjects();
  return projects.map((p) => ({
    projectSlug: p.projectSlug,
    chapters: p.chapters.map((ch) => ({ slug: ch.slug, title: ch.title })),
  }));
})();
