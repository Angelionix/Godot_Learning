/**
 * Gamification System — constants, types, and badge definitions.
 *
 * Level formula:  level = floor(sqrt(xp / 100)) + 1
 * Streak:         consecutive days of activity
 * Badges:         awarded automatically when conditions are met
 */

// ── Level system ──────────────────────────────────────────────────────────────

export const XP_PER_LEVEL_BASE = 100;

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / XP_PER_LEVEL_BASE)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * XP_PER_LEVEL_BASE;
}

export function xpToNextLevel(currentXp: number): { current: number; needed: number; progress: number } {
  const level = calculateLevel(currentXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return {
    current: xpInLevel,
    needed: xpNeeded,
    progress: xpNeeded > 0 ? xpInLevel / xpNeeded : 0,
  };
}

// ── Badge system ──────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: "progress" | "streak" | "skill" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  condition: string; // human-readable condition
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Progress badges ──
  {
    slug: "first-step",
    name: "Первый шаг",
    description: "Завершите первую главу",
    icon: "👣",
    category: "progress",
    rarity: "common",
    condition: "completedChapters >= 1",
  },
  {
    slug: "getting-started",
    name: "Начало пути",
    description: "Завершите 5 глав",
    icon: "🚶",
    category: "progress",
    rarity: "common",
    condition: "completedChapters >= 5",
  },
  {
    slug: "chapter-master",
    name: "Мастер глав",
    description: "Завершите 10 глав",
    icon: "📖",
    category: "progress",
    rarity: "rare",
    condition: "completedChapters >= 10",
  },
  {
    slug: "halfway-there",
    name: "Половина пути",
    description: "Завершите 27 глав (половина курса)",
    icon: "🎯",
    category: "progress",
    rarity: "rare",
    condition: "completedChapters >= 27",
  },
  {
    slug: "completionist",
    name: "Перфекционист",
    description: "Завершите все 54 главы курса",
    icon: "🏆",
    category: "progress",
    rarity: "legendary",
    condition: "completedChapters >= 54",
  },
  {
    slug: "first-project",
    name: "Первый проект",
    description: "Завершите первый проект полностью",
    icon: "🎮",
    category: "progress",
    rarity: "rare",
    condition: "completedProjects >= 1",
  },
  {
    slug: "project-collector",
    name: "Коллекционер",
    description: "Завершите 3 проекта",
    icon: "🏅",
    category: "progress",
    rarity: "epic",
    condition: "completedProjects >= 3",
  },
  {
    slug: "game-dev-master",
    name: "Мастер геймдева",
    description: "Завершите все 6 проектов",
    icon: "👑",
    category: "progress",
    rarity: "legendary",
    condition: "completedProjects >= 6",
  },

  // ── Streak badges ──
  {
    slug: "streak-3",
    name: "Трёхдневный стрик",
    description: "Занимайтесь 3 дня подряд",
    icon: "🔥",
    category: "streak",
    rarity: "common",
    condition: "streak >= 3",
  },
  {
    slug: "streak-7",
    name: "Неделя огня",
    description: "Занимайтесь 7 дней подряд",
    icon: "🔥",
    category: "streak",
    rarity: "rare",
    condition: "streak >= 7",
  },
  {
    slug: "streak-14",
    name: "Две недели",
    description: "Занимайтесь 14 дней подряд",
    icon: "⚡",
    category: "streak",
    rarity: "rare",
    condition: "streak >= 14",
  },
  {
    slug: "streak-30",
    name: "Месяц дисциплины",
    description: "Занимайтесь 30 дней подряд",
    icon: "💎",
    category: "streak",
    rarity: "epic",
    condition: "streak >= 30",
  },
  {
    slug: "streak-100",
    name: "Столетие",
    description: "Занимайтесь 100 дней подряд",
    icon: "🌟",
    category: "streak",
    rarity: "legendary",
    condition: "streak >= 100",
  },

  // ── Skill badges ──
  {
    slug: "gdscript-novice",
    name: "GDScript Новичок",
    description: "Завершите главу в проекте на GDScript",
    icon: "📜",
    category: "skill",
    rarity: "common",
    condition: "anyGdscriptChapter",
  },
  {
    slug: "gdscript-pro",
    name: "GDScript Про",
    description: "Завершите проект на GDScript",
    icon: "🟢",
    category: "skill",
    rarity: "rare",
    condition: "completedGdscriptProject",
  },
  {
    slug: "cpp-explorer",
    name: "C++ Исследователь",
    description: "Завершите главу в проекте с C++",
    icon: "⚙️",
    category: "skill",
    rarity: "rare",
    condition: "anyCppChapter",
  },
  {
    slug: "cpp-warrior",
    name: "C++ Воин",
    description: "Завершите проект с C++",
    icon: "⚔️",
    category: "skill",
    rarity: "epic",
    condition: "completedCppProject",
  },
  {
    slug: "bilingual",
    name: "Билингв",
    description: "Завершите проект на GDScript и проект с C++",
    icon: "🌐",
    category: "skill",
    rarity: "epic",
    condition: "completedGdscriptAndCpp",
  },

  // ── Special badges ──
  {
    slug: "early-bird",
    name: "Ранняя пташка",
    description: "Завершите главу до 9 утра",
    icon: "🌅",
    category: "special",
    rarity: "rare",
    condition: "earlyBird",
  },
  {
    slug: "night-owl",
    name: "Ночная сова",
    description: "Завершите главу после 23:00",
    icon: "🦉",
    category: "special",
    rarity: "rare",
    condition: "nightOwl",
  },
  {
    slug: "xp-100",
    name: "Сотня XP",
    description: "Наберите 100 XP",
    icon: "💫",
    category: "special",
    rarity: "common",
    condition: "xp >= 100",
  },
  {
    slug: "xp-500",
    name: "Полтысячи XP",
    description: "Наберите 500 XP",
    icon: "✨",
    category: "special",
    rarity: "rare",
    condition: "xp >= 500",
  },
  {
    slug: "xp-1000",
    name: "Тысячник",
    description: "Наберите 1000 XP",
    icon: "🌠",
    category: "special",
    rarity: "epic",
    condition: "xp >= 1000",
  },
  {
    slug: "xp-5000",
    name: "Гранмастер",
    description: "Наберите 5000 XP",
    icon: "🔮",
    category: "special",
    rarity: "legendary",
    condition: "xp >= 5000",
  },
];

export const BADGE_MAP = new Map(BADGE_DEFINITIONS.map((b) => [b.slug, b]));

export function getBadgeDefinition(slug: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(slug);
}

export function getRarityColor(rarity: BadgeDefinition["rarity"]): string {
  switch (rarity) {
    case "common":
      return "text-slate-500 border-slate-300 dark:border-slate-600";
    case "rare":
      return "text-blue-500 border-blue-400 dark:border-blue-600";
    case "epic":
      return "text-purple-500 border-purple-400 dark:border-purple-600";
    case "legendary":
      return "text-amber-500 border-amber-400 dark:border-amber-600";
  }
}

export function getRarityBg(rarity: BadgeDefinition["rarity"]): string {
  switch (rarity) {
    case "common":
      return "bg-slate-50 dark:bg-slate-900/30";
    case "rare":
      return "bg-blue-50 dark:bg-blue-950/30";
    case "epic":
      return "bg-purple-50 dark:bg-purple-950/30";
    case "legendary":
      return "bg-amber-50 dark:bg-amber-950/30";
  }
}

export function getRarityLabel(rarity: BadgeDefinition["rarity"]): string {
  switch (rarity) {
    case "common":
      return "Обычный";
    case "rare":
      return "Редкий";
    case "epic":
      return "Эпический";
    case "legendary":
      return "Легендарный";
  }
}

// ── Skill radar axes ──────────────────────────────────────────────────────────

export interface SkillAxis {
  key: string;
  label: string;
  projects: string[]; // project slugs that contribute to this skill
}

export const SKILL_AXES: SkillAxis[] = [
  { key: "ui", label: "UI / Интерфейс", projects: ["project-1-clicker"] },
  { key: "physics", label: "Физика 2D", projects: ["project-2-space-shooter", "project-3-metroidvania"] },
  { key: "architecture", label: "Архитектура", projects: ["project-3-metroidvania", "project-4-tower-defense"] },
  { key: "cpp", label: "C++ / GDExtension", projects: ["project-4-tower-defense", "project-5-3d-adventure", "project-6-performance-demo"] },
  { key: "3d", label: "3D Разработка", projects: ["project-5-3d-adventure"] },
  { key: "performance", label: "Оптимизация", projects: ["project-6-performance-demo"] },
];

// ── GDScript / C++ project classification ─────────────────────────────────────

export const GDSCRIPT_PROJECTS = [
  "project-1-clicker",
  "project-2-space-shooter",
  "project-3-metroidvania",
];

export const CPP_PROJECTS = [
  "project-4-tower-defense",
  "project-5-3d-adventure",
  "project-6-performance-demo",
];

// ── Streak helpers ─────────────────────────────────────────────────────────────

export function calculateStreak(lastActiveDate: string | null, currentStreak: number): number {
  if (!lastActiveDate) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (lastActiveDate === today) return currentStreak;
  if (lastActiveDate === yesterday) return currentStreak;
  return 0;
}

export function getStreakStatus(streak: number): { emoji: string; message: string; color: string } {
  if (streak === 0) return { emoji: "💤", message: "Начните заниматься сегодня!", color: "text-muted-foreground" };
  if (streak < 3) return { emoji: "🌱", message: "Хорошее начало!", color: "text-green-500" };
  if (streak < 7) return { emoji: "🔥", message: "Вы на огне!", color: "text-orange-500" };
  if (streak < 14) return { emoji: "⚡", message: "Невероятная дисциплина!", color: "text-yellow-500" };
  if (streak < 30) return { emoji: "💎", message: "Железная воля!", color: "text-purple-500" };
  return { emoji: "🌟", message: "Легенда дисциплины!", color: "text-amber-500" };
}
