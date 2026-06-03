import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content/projects');

export interface ChapterMeta {
  slug: string;
  title: string;
  order: number;
  xp: number;
  estimatedTime: number;
}

export interface ProjectMeta {
  title: string;
  projectSlug: string;
  order: number;
  difficulty: string;
  language: string;
  description: string;
  tags: string[];
  chapters: ChapterMeta[];
  cheatSheet?: string;
  sprint?: { slug: string; title: string; order: number; xp: number };
  bridge?: { nextProject: string; nextTitle: string };
}

export interface ChapterContent {
  meta: ChapterMeta & {
    project: string;
    projectSlug: string;
    tags: string[];
  };
  content: string;
}

/**
 * Get metadata for all projects
 */
export function getAllProjects(): ProjectMeta[] {
  const projects: ProjectMeta[] = [];

  if (!fs.existsSync(CONTENT_DIR)) {
    return projects;
  }

  const projectDirs = fs.readdirSync(CONTENT_DIR).filter((dir) => {
    const metaPath = path.join(CONTENT_DIR, dir, '_meta.json');
    return fs.existsSync(metaPath);
  });

  for (const dir of projectDirs) {
    const metaPath = path.join(CONTENT_DIR, dir, '_meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ProjectMeta;
    projects.push(meta);
  }

  return projects.sort((a, b) => a.order - b.order);
}

/**
 * Get metadata for a specific project
 */
export function getProjectMeta(projectSlug: string): ProjectMeta | null {
  const metaPath = path.join(CONTENT_DIR, projectSlug, '_meta.json');
  if (!fs.existsSync(metaPath)) return null;

  return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ProjectMeta;
}

/**
 * Get all chapters for a project
 */
export function getProjectChapters(projectSlug: string): ChapterMeta[] {
  const meta = getProjectMeta(projectSlug);
  if (!meta) return [];

  return meta.chapters.sort((a, b) => a.order - b.order);
}

/**
 * Get content for a specific chapter
 */
export function getChapterContent(
  projectSlug: string,
  chapterSlug: string,
): ChapterContent | null {
  const chapterPath = path.join(CONTENT_DIR, projectSlug, chapterSlug, 'index.mdx');

  if (!fs.existsSync(chapterPath)) return null;

  const fileContent = fs.readFileSync(chapterPath, 'utf-8');
  const { data, content } = matter(fileContent);

  const projectMeta = getProjectMeta(projectSlug);

  return {
    meta: {
      slug: data.chapter || chapterSlug,
      title: data.title || '',
      order: data.order || 0,
      xp: data.xp || 0,
      estimatedTime: data.estimatedTime || 0,
      project: data.project || projectSlug,
      projectSlug: projectSlug,
      tags: data.tags || [],
    },
    content,
  };
}

/**
 * Get cheat sheet for a project
 */
export function getCheatSheet(projectSlug: string): string | null {
  const cheatSheetPath = path.join(CONTENT_DIR, projectSlug, 'cheat-sheet.mdx');
  if (!fs.existsSync(cheatSheetPath)) return null;

  const fileContent = fs.readFileSync(cheatSheetPath, 'utf-8');
  const { content } = matter(fileContent);
  return content;
}

/**
 * Get navigation info: prev/next chapter
 */
export function getChapterNavigation(
  projectSlug: string,
  chapterSlug: string,
): { prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null } {
  const chapters = getProjectChapters(projectSlug);
  const currentIndex = chapters.findIndex((ch) => ch.slug === chapterSlug);

  return {
    prev: currentIndex > 0 ? chapters[currentIndex - 1] : null,
    next: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
  };
}
