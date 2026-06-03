export interface Project {
  id: number;
  slug: string;
  title: string;
  difficulty: number;
  difficultyLabel: string;
  language: string;
  description: string;
  skills: string[];
  icon: string;
}

export const projects: Project[] = [
  {
    id: 1,
    slug: "project-1-clicker",
    title: "Кликер/Idle",
    difficulty: 1,
    difficultyLabel: "Начинающий",
    language: "GDScript",
    description:
      "Создай свою первую игру — кликер с idle-механикой. Изучишь основы Godot: узлы, сцены, сигналы и UI.",
    skills: ["UI", "Сигналы", "Таймеры", "Ресурсы"],
    icon: "👆",
  },
  {
    id: 2,
    slug: "project-2-space-shooter",
    title: "Космический шутер",
    difficulty: 2,
    difficultyLabel: "Продвинутый новичок",
    language: "GDScript",
    description:
      "Построй космический шутер с врагами, снарядами и системой подсчёта очков. Изучишь физику 2D и столкновения.",
    skills: ["Физика 2D", "Столкновения", "Пули", "Враги"],
    icon: "🚀",
  },
  {
    id: 3,
    slug: "project-3-metroidvania",
    title: "Метроидвания",
    difficulty: 3,
    difficultyLabel: "Средний",
    language: "GDScript",
    description:
      "Разработай 2D метроидванию с исследованием, способностями и боссами. Платформер со свободой перемещения.",
    skills: ["Платформер", "Карта", "Способности", "Боссы"],
    icon: "🗺️",
  },
  {
    id: 4,
    slug: "project-4-tower-defense",
    title: "Tower Defense",
    difficulty: 4,
    difficultyLabel: "Продвинутый",
    language: "GDScript + C++",
    description:
      "Создай Tower Defense с волнами врагов и системой башен. Первый проект с GDExtension и C++.",
    skills: ["GDExtension", "C++", "Волны", "Стратегия"],
    icon: "🏰",
  },
  {
    id: 5,
    slug: "project-5-3d-adventure",
    title: "3D Приключение",
    difficulty: 5,
    difficultyLabel: "Сложный",
    language: "C++ + GDScript",
    description:
      "Построй 3D приключение с персонажем, камерой и миром. Основы 3D в Godot с C++ для производительности.",
    skills: ["3D", "Камера", "Навигация", "Анимации"],
    icon: "🎮",
  },
  {
    id: 6,
    slug: "project-6-performance-demo",
    title: "Демо производительности",
    difficulty: 6,
    difficultyLabel: "Экспертный",
    language: "C++",
    description:
      "Создай технодемо с тысячами объектов. Чистый C++ для максимальной производительности в Godot.",
    skills: ["ECS", "Профилирование", "Оптимизация", "Многопоточность"],
    icon: "⚡",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getDifficultyStars(difficulty: number): string {
  if (difficulty >= 6) return "⭐⭐⭐⭐⭐+";
  return "⭐".repeat(difficulty);
}
