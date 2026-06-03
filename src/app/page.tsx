"use client";

import { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  ArrowRight,
  Code,
  Cpu,
  Layers,
  Zap,
  BookOpen,
  Wrench,
  GitBranch,
  ExternalLink,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Star,
  Trophy,
  Flame,
  Lock,
  Unlock,
  Sparkles,
  Target,
  Brain,
  Gauge,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Data ──────────────────────────────────────────────────────

interface Project {
  id: number;
  slug: string;
  title: string;
  difficulty: number;
  difficultyLabel: string;
  language: string;
  description: string;
  skills: string[];
  icon: string;
  color: string;
  chapters: { title: string; slug: string }[];
  xp: number;
}

const projects: Project[] = [
  {
    id: 1,
    slug: "project-1-clicker",
    title: "Кликер / Idle",
    difficulty: 1,
    difficultyLabel: "Начинающий",
    language: "GDScript",
    description:
      "Создай свою первую игру — кликер с idle-механикой. Изучишь основы Godot: узлы, сцены, сигналы и UI.",
    skills: ["UI", "Сигналы", "Таймеры", "Ресурсы"],
    icon: "👆",
    color: "#478CBF",
    chapters: [
      { title: "Настройка проекта", slug: "chapter-01" },
      { title: "Базовый кликер", slug: "chapter-02" },
      { title: "Система ресурсов", slug: "chapter-03" },
      { title: "Автокликеры", slug: "chapter-04" },
      { title: "Апгрейды", slug: "chapter-05" },
      { title: "Престиж", slug: "chapter-06" },
      { title: "UI и анимации", slug: "chapter-07" },
      { title: "Сохранения", slug: "chapter-08" },
    ],
    xp: 400,
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
    color: "#5BA3D9",
    chapters: [
      { title: "Настройка проекта", slug: "chapter-01" },
      { title: "Игрок и движение", slug: "chapter-02" },
      { title: "Система стрельбы", slug: "chapter-03" },
      { title: "Враги и волны", slug: "chapter-04" },
      { title: "Столкновения", slug: "chapter-05" },
      { title: "Система очков", slug: "chapter-06" },
      { title: "Визуальные эффекты", slug: "chapter-07" },
    ],
    xp: 500,
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
    color: "#45B853",
    chapters: [
      { title: "Введение в метроидванию", slug: "chapter-01" },
      { title: "Геймдизайн", slug: "chapter-02" },
      { title: "Архитектура", slug: "chapter-03" },
    ],
    xp: 600,
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
    color: "#9B59B6",
    chapters: [
      { title: "Введение в Tower Defense", slug: "chapter-01" },
      { title: "Геймдизайн и механики", slug: "chapter-02" },
      { title: "Архитектура с C++", slug: "chapter-03" },
    ],
    xp: 700,
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
    color: "#E67E22",
    chapters: [
      { title: "Введение в 3D", slug: "chapter-01" },
      { title: "Геймдизайн 3D мира", slug: "chapter-02" },
      { title: "Архитектура C++", slug: "chapter-03" },
    ],
    xp: 800,
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
    color: "#F39C12",
    chapters: [
      { title: "Введение в оптимизацию", slug: "chapter-01" },
      { title: "Архитектура ECS", slug: "chapter-02" },
      { title: "Профилирование и C++", slug: "chapter-03" },
    ],
    xp: 1000,
  },
];

const badges = [
  { name: "Первый проект", icon: "🏆", desc: "Завершить первый проект" },
  { name: "Мастер глав", icon: "📚", desc: "Пройти 10 глав" },
  { name: "GDScript Про", icon: "💻", desc: "Освоить GDScript" },
  { name: "C++ Воин", icon: "⚔️", desc: "Начать работать с C++" },
  { name: "7 дней подряд", icon: "🔥", desc: "Заниматься 7 дней подряд" },
];

const technologies = [
  {
    name: "Godot Engine",
    icon: <Gamepad2 className="size-8 text-[#478CBF]" />,
    desc: "Игровой движок",
    detail: "Бесплатный open-source движок для 2D и 3D игр",
  },
  {
    name: "GDScript",
    icon: <Code className="size-8 text-[#45B853]" />,
    desc: "Скриптовый язык",
    detail: "Python-подобный язык, созданный специально для Godot",
  },
  {
    name: "C++ / GDExtension",
    icon: <Wrench className="size-8 text-purple-400" />,
    desc: "Нативная производительность",
    detail: "Подключай C++ модули для критичного по скорости кода",
  },
  {
    name: "Git",
    icon: <Layers className="size-8 text-orange-400" />,
    desc: "Контроль версий",
    detail: "Управляй кодом и сотрудничай с командой",
  },
];

const whyFeatures = [
  {
    icon: <BookOpen className="size-6 text-[#478CBF]" />,
    title: "Anti-Tutorial-Hell",
    description:
      "Никаких копипаст-туториалов. Каждый проект требует самостоятельного решения задач и архитектурных выборов. Ты не повторяешь код — ты его создаёшь.",
  },
  {
    icon: <Cpu className="size-6 text-[#45B853]" />,
    title: "GDScript → C++",
    description:
      "Единственный курс, где ты перейдёшь от GDScript к GDExtension на C++. Реальный путь к профессиональной разработке игр на Godot Engine.",
  },
  {
    icon: <Layers className="size-6 text-purple-400" />,
    title: "Architecture-First",
    description:
      "Сначала архитектура, потом код. Изучишь паттерны: ECS, MVC, Observer — и применишь их в реальных проектах, а не только в теории.",
  },
  {
    icon: <Zap className="size-6 text-yellow-500" />,
    title: "Интерактивная платформа",
    description:
      "Отслеживай прогресс, получай достижения и соревнуйся с другими. Система XP и бейджей мотивирует продолжать обучение каждый день.",
  },
];

const courseStats = [
  { label: "6 проектов", icon: <Gamepad2 className="size-5 text-[#478CBF]" /> },
  { label: "30+ глав", icon: <BookOpen className="size-5 text-[#45B853]" /> },
  { label: "GDScript + C++", icon: <Code className="size-5 text-purple-400" /> },
  { label: "Бесплатно", icon: <Sparkles className="size-5 text-yellow-500" /> },
];

// ─── State for simulated progress ──────────────────────────────

function useProgress() {
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const [currentProject, setCurrentProject] = useState(1);

  const toggleChapter = (projectSlug: string, chapterSlug: string) => {
    setCompletedChapters((prev) => {
      const next = new Set(prev);
      const key = `${projectSlug}/${chapterSlug}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isChapterComplete = (projectSlug: string, chapterSlug: string) =>
    completedChapters.has(`${projectSlug}/${chapterSlug}`);

  const projectProgress = (project: Project) => {
    const completed = project.chapters.filter((ch) =>
      completedChapters.has(`${project.slug}/${ch.slug}`)
    ).length;
    return project.chapters.length > 0 ? Math.round((completed / project.chapters.length) * 100) : 0;
  };

  const totalXP = Array.from(completedChapters).length * 50;
  const level = Math.floor(totalXP / 200) + 1;

  return {
    completedChapters,
    toggleChapter,
    isChapterComplete,
    projectProgress,
    totalXP,
    level,
    currentProject,
    setCurrentProject,
  };
}

// ─── Components ────────────────────────────────────────────────

function Header({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Главная" },
    { id: "learn", label: "Обучение" },
    { id: "dashboard", label: "Дашборд" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        <button
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <Gamepad2 className="size-6 text-[#478CBF]" />
          <span>
            Godot <span className="text-[#478CBF]">Learning</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Angelionix/Godot_Learning"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitBranch className="size-4" />
            GitHub
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "px-4 py-3 rounded-md text-sm font-medium transition-colors text-left",
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function HeroSection({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-background to-[#0d1b2a]" />
        <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-[#478CBF]/10 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 size-64 rounded-full bg-[#45B853]/8 blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 px-4 py-16 md:py-24 text-center max-w-5xl mx-auto">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Gamepad2 className="size-3.5 text-[#478CBF]" />
          Бесплатный курс
        </Badge>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Научись создавать игры на{" "}
          <span className="text-[#478CBF]">Godot Engine</span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
          Единственный русскоязычный курс с переходом от GDScript к C++.
          От кликера до 3D приключения — 6 проектов, один путь.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            size="lg"
            className="gap-2 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white px-6"
            onClick={() => onNavigate("learn")}
          >
            Начать обучение
            <ArrowRight className="size-4" />
          </Button>
          <a href="https://godotengine.org" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2 px-6">
              Узнать о Godot
              <ExternalLink className="size-3.5" />
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-sm text-muted-foreground">
          {courseStats.map((stat) => (
            <span key={stat.label} className="flex items-center gap-1.5">
              {stat.icon}
              {stat.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Проекты курса</h2>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Каждый проект — это полноценная игра. От простого кликера до
          высокопроизводительного C++ демо.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {projects.map((project) => (
          <Card
            key={project.slug}
            className="h-full transition-all duration-200 hover:border-[#478CBF]/50 hover:shadow-lg hover:shadow-[#478CBF]/5 hover:scale-[1.01]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{project.icon}</span>
                <Badge variant="outline" className="text-xs">
                  {project.language}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{project.title}</CardTitle>
              <CardDescription className="text-xs">
                {project.difficultyLabel} · {getDifficultyStars(project.difficulty)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {project.chapters.length} глав · {project.xp} XP
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[#478CBF] hover:text-[#478CBF]/80"
                >
                  Начать
                  <ArrowRight className="size-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function WhyThisCourseSection() {
  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Почему этот курс?</h2>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Мы создали курс, который реально готовит к разработке игр, а не к повторению туториалов.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {whyFeatures.map((feature) => (
          <Card key={feature.title} className="transition-colors hover:border-[#478CBF]/30">
            <CardHeader className="pb-2">
              <div className="mb-2">{feature.icon}</div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function TechStackSection() {
  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Технологии</h2>
        <p className="mt-2 text-muted-foreground">
          Стек, который ты освоишь в процессе обучения
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {technologies.map((tech) => (
          <Card
            key={tech.name}
            className="flex flex-col items-center justify-center py-6 transition-colors hover:border-[#478CBF]/30"
          >
            {tech.icon}
            <h3 className="mt-3 font-semibold text-sm">{tech.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tech.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className="px-4 md:px-6 py-16 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Путь обучения</h2>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Постепенный переход от простых проектов к сложным. GDScript в начале, C++ к концу.
        </p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#478CBF] via-[#45B853] to-[#F39C12] hidden sm:block" />

        <div className="flex flex-col gap-6">
          {projects.map((project, idx) => (
            <div key={project.slug} className="flex gap-4 sm:gap-6 items-start animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Timeline node */}
              <div className="relative z-10 shrink-0 flex items-center justify-center size-12 rounded-full border-2 bg-background" style={{ borderColor: project.color }}>
                <span className="text-lg">{project.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {project.language}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {idx < projects.length - 1 && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <ArrowRight className="size-3" />
                    Переход к следующему проекту
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section className="px-4 md:px-6 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Готов начать?</h2>
        <p className="mt-3 text-muted-foreground">
          Присоединяйся к курсу бесплатно и начни создавать игры уже сегодня.
        </p>
        <Button
          size="lg"
          className="gap-2 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white px-8 mt-6"
          onClick={() => onNavigate("learn")}
        >
          Начать обучение
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}

// ─── Learn Tab ──────────────────────────────────────────────────

function LearnTab({
  progress,
}: {
  progress: ReturnType<typeof useProgress>;
}) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar - project list */}
        <aside className="md:w-72 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Проекты курса</CardTitle>
              <CardDescription>
                {progress.completedChapters.size} из {projects.reduce((sum, p) => sum + p.chapters.length, 0)} глав пройдено
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[60vh]">
                <div className="px-4 pb-4">
                  {projects.map((project) => {
                    const prog = progress.projectProgress(project);
                    const isExpanded = expandedProject === project.slug;

                    return (
                      <div key={project.slug} className="mb-1">
                        <button
                          onClick={() => setExpandedProject(isExpanded ? null : project.slug)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted",
                            isExpanded && "bg-muted"
                          )}
                        >
                          <span className="text-base">{project.icon}</span>
                          <span className="flex-1 truncate text-left text-sm">{project.title}</span>
                          {isExpanded ? (
                            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2 pb-1">
                            {project.chapters.map((chapter) => {
                              const isComplete = progress.isChapterComplete(project.slug, chapter.slug);
                              return (
                                <button
                                  key={chapter.slug}
                                  onClick={() => progress.toggleChapter(project.slug, chapter.slug)}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors text-left w-full",
                                    isComplete
                                      ? "text-[#45B853] hover:bg-[#45B853]/10"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  )}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 className="size-3.5 shrink-0" />
                                  ) : (
                                    <Circle className="size-3.5 shrink-0" />
                                  )}
                                  <span className="truncate">{chapter.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Progress bar for each project */}
                        {prog > 0 && (
                          <div className="px-2 pb-1">
                            <Progress value={prog} className="h-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Main content - project overview */}
        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Карта прогресса</h1>
            <p className="text-muted-foreground mt-1">
              Отслеживай свой путь от начинающего до эксперта в разработке игр на Godot
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const prog = progress.projectProgress(project);
              const completedCount = project.chapters.filter((ch) =>
                progress.isChapterComplete(project.slug, ch.slug)
              ).length;

              return (
                <Card key={project.slug} className="transition-all hover:border-[#478CBF]/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{project.icon}</span>
                        <CardTitle className="text-base">{project.title}</CardTitle>
                      </div>
                      <Badge
                        variant={prog === 100 ? "default" : "outline"}
                        className={cn("text-[10px]", prog === 100 && "bg-[#45B853] text-white")}
                      >
                        {prog === 100 ? "Завершён" : project.language}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{completedCount} / {project.chapters.length} глав</span>
                      <span>{prog}%</span>
                    </div>
                    <Progress value={prog} className="h-1.5" />
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────

function DashboardTab({
  progress,
}: {
  progress: ReturnType<typeof useProgress>;
}) {
  const totalChapters = projects.reduce((sum, p) => sum + p.chapters.length, 0);
  const completedCount = progress.completedChapters.size;
  const overallProgress = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Дашборд</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="size-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Уровень</span>
            </div>
            <p className="text-2xl font-bold">{progress.level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-4 text-[#478CBF]" />
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <p className="text-2xl font-bold">{progress.totalXP}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="size-4 text-[#45B853]" />
              <span className="text-xs text-muted-foreground">Глав пройдено</span>
            </div>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="size-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Серия</span>
            </div>
            <p className="text-2xl font-bold">0 дней</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Общий прогресс</CardTitle>
          <CardDescription>
            {completedCount} из {totalChapters} глав завершено ({overallProgress}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Начинающий</span>
            <span>Средний</span>
            <span>Продвинутый</span>
            <span>Эксперт</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="size-4 text-yellow-500" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {badges.map((badge, idx) => {
                const earned = idx < 1; // Simulate: first badge earned
                return (
                  <div
                    key={badge.name}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md border transition-colors",
                      earned
                        ? "border-[#45B853]/30 bg-[#45B853]/5"
                        : "border-border opacity-60"
                    )}
                  >
                    <span className="text-lg">{badge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.desc}</p>
                    </div>
                    {earned ? (
                      <Unlock className="size-4 text-[#45B853]" />
                    ) : (
                      <Lock className="size-4 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4 text-[#478CBF]" />
              Прогресс по проектам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {projects.map((project) => {
                const prog = progress.projectProgress(project);
                return (
                  <div key={project.slug}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <span>{project.icon}</span>
                        {project.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{prog}%</span>
                    </div>
                    <Progress value={prog} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Radar */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="size-4 text-purple-400" />
            Навыки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: "GDScript", level: 20, icon: <Code className="size-4 text-[#45B853]" /> },
              { name: "C++", level: 5, icon: <Wrench className="size-4 text-purple-400" /> },
              { name: "2D Физика", level: 10, icon: <Gamepad2 className="size-4 text-[#478CBF]" /> },
              { name: "UI/UX", level: 15, icon: <Layers className="size-4 text-orange-400" /> },
              { name: "Архитектура", level: 8, icon: <Brain className="size-4 text-purple-400" /> },
              { name: "Оптимизация", level: 3, icon: <Gauge className="size-4 text-yellow-500" /> },
              { name: "3D", level: 0, icon: <Gamepad2 className="size-4 text-[#5BA3D9]" /> },
              { name: "ECS", level: 0, icon: <Layers className="size-4 text-red-400" /> },
            ].map((skill) => (
              <div key={skill.name} className="p-2 rounded-md border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  {skill.icon}
                  <span className="text-xs font-medium">{skill.name}</span>
                </div>
                <Progress value={skill.level} className="h-1.5" />
                <span className="text-[10px] text-muted-foreground">{skill.level}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function getDifficultyStars(difficulty: number): string {
  if (difficulty >= 6) return "⭐⭐⭐⭐⭐+";
  return "⭐".repeat(difficulty);
}

// ─── Main Page ──────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const progress = useProgress();

  return (
    <div className="flex flex-col min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1">
        {activeTab === "home" && (
          <>
            <HeroSection onNavigate={setActiveTab} />
            <ProjectsSection />
            <WhyThisCourseSection />
            <RoadmapSection />
            <TechStackSection />
            <CTASection onNavigate={setActiveTab} />
          </>
        )}

        {activeTab === "learn" && <LearnTab progress={progress} />}

        {activeTab === "dashboard" && <DashboardTab progress={progress} />}
      </main>

      <footer className="border-t border-border bg-background mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 text-sm text-muted-foreground max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-4 text-[#478CBF]" />
            <span>&copy; 2026 Godot Learning Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Angelionix/Godot_Learning"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <GitBranch className="size-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://godotengine.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>Godot Engine</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-1">
          {[
            { id: "home", label: "Главная", icon: Gamepad2 },
            { id: "learn", label: "Обучение", icon: BookOpen },
            { id: "dashboard", label: "Дашборд", icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
