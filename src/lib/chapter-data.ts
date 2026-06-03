/**
 * Static chapter data for all projects.
 * This data mirrors the content from `_meta.json` files
 * and is safe to import in both server and client components.
 *
 * When adding new chapters, update this file AND the corresponding _meta.json.
 */

export interface ChapterInfo {
  slug: string;
  title: string;
}

export interface ProjectChaptersData {
  projectSlug: string;
  chapters: ChapterInfo[];
}

const projectChaptersData: ProjectChaptersData[] = [
  {
    projectSlug: "project-1-clicker",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка проекта" },
      { slug: "chapter-04-gdscript-basics", title: "Глава 4: Основы GDScript" },
      { slug: "chapter-05-implementation", title: "Глава 5: Реализация" },
      { slug: "chapter-06-visual-effects", title: "Глава 6: Визуальные эффекты" },
      { slug: "chapter-07-publishing", title: "Глава 7: Публикация и экспорт" },
      { slug: "chapter-08-summary", title: "Глава 8: Итоги проекта" },
    ],
  },
  {
    projectSlug: "project-2-space-shooter",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка проекта" },
      { slug: "chapter-04-physics-basics", title: "Глава 4: Основы физики" },
      { slug: "chapter-05-implementation", title: "Глава 5: Реализация" },
      { slug: "chapter-06-shaders-vfx", title: "Глава 6: Шейдеры и VFX" },
      { slug: "chapter-07-summary", title: "Итоги проекта" },
    ],
  },
  {
    projectSlug: "project-3-metroidvania",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка проекта" },
      { slug: "chapter-04-managers-and-data", title: "Глава 4: Менеджеры и данные" },
      { slug: "chapter-05-fsm-and-states", title: "Глава 5: Конечный автомат" },
      { slug: "chapter-06-player-and-combat", title: "Глава 6: Игрок и бой" },
      { slug: "chapter-07-summary", title: "Глава 7: Итоги" },
    ],
  },
  {
    projectSlug: "project-4-tower-defense",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка проекта" },
      { slug: "chapter-04-cpp-gdextension", title: "Глава 4: C++ GDExtension" },
      { slug: "chapter-05-gdscript-logic", title: "Глава 5: Менеджеры и данные" },
      { slug: "chapter-06-towers-and-enemies", title: "Глава 6: Башни и враги" },
      { slug: "chapter-07-summary", title: "Глава 7: Итоги" },
    ],
  },
  {
    projectSlug: "project-5-3d-adventure",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка 3D-проекта" },
      { slug: "chapter-04-cpp-core", title: "Глава 4: C++ ядро" },
      { slug: "chapter-05-npc-and-quests", title: "Глава 5: NPC и квесты" },
      { slug: "chapter-06-combat-and-world", title: "Глава 6: Бой и мир" },
      { slug: "chapter-07-summary", title: "Глава 7: Итоги" },
    ],
  },
  {
    projectSlug: "project-6-performance-demo",
    chapters: [
      { slug: "introduction", title: "Введение" },
      { slug: "chapter-01-game-design", title: "Глава 1: Геймдизайн" },
      { slug: "chapter-02-architecture", title: "Глава 2: Архитектура" },
      { slug: "chapter-03-project-setup", title: "Глава 3: Настройка проекта" },
      { slug: "chapter-04-ecs-core", title: "Глава 4: ECS ядро" },
      { slug: "chapter-05-advanced-optimization", title: "Глава 5: Оптимизация" },
      { slug: "chapter-06-benchmarks", title: "Глава 6: Бенчмарки" },
      { slug: "chapter-07-summary", title: "Глава 7: Итоги курса" },
    ],
  },
];

/** Get chapters for a specific project */
export function getChaptersForProject(projectSlug: string): ChapterInfo[] {
  const project = projectChaptersData.find((p) => p.projectSlug === projectSlug);
  return project?.chapters || [];
}

/** Get a map of all project slugs to their chapters */
export function getAllProjectChaptersMap(): Record<string, ChapterInfo[]> {
  const map: Record<string, ChapterInfo[]> = {};
  for (const project of projectChaptersData) {
    map[project.projectSlug] = project.chapters;
  }
  return map;
}

export { projectChaptersData };
