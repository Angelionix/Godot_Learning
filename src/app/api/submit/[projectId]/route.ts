/**
 * POST /api/submit/[projectId] — отправить проект на автогрейдинг
 * GET /api/submit/[projectId] — получить последнюю отправку проекта
 *
 * Логика грейдинга работает в двух режимах:
 * 1. Mock-режим (headless Godot недоступен) — парсинг GDScript на паттерны
 * 2. Real-режим (headless Godot доступен) — запуск GUT-тестов (пока заглушка)
 *
 * Все текстовые комментарии и сообщения на русском языке.
 */

import { NextRequest, NextResponse } from "next/server";
import { submitProjectSchema } from "@/validators/grading";
import type { TestResultEntry } from "@/validators/grading";
import {
  createSubmission,
  getLatestSubmission,
  hasPassedSubmission,
} from "@/repositories/grading.repository";
import { getProject } from "@/repositories/editor.repository";
import { checkAndAwardBadges, countCompletedProjects } from "@/repositories/progress.repository";
import { isS3Configured } from "@/lib/s3";
import { listProjectFiles, downloadFile } from "@/lib/storage";
import { calculateLevel } from "@/lib/gamification";
import prisma from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

// ── Константы XP для автогрейдинга ──────────────────────────────────────────

/** Базовый XP за прохождение всех тестов */
const XP_GRADING_BASE = 50;
/** Бонусный XP за первую сдачу проекта */
const XP_GRADING_FIRST_SUBMISSION = 25;

// ── Интерфейсы грейдинга ────────────────────────────────────────────────────

interface GradingCheck {
  name: string;
  description: string;
  check: (files: Map<string, string>) => { passed: boolean; message: string };
}

interface GradingResult {
  status: "passed" | "failed" | "error";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  testResults: TestResultEntry[];
  errorMessage?: string;
}

// ── Вспомогательные функции для парсинга скриптов ───────────────────────────

/**
 * Ищет скрипт в коллекции файлов по ключевым словам в имени.
 * Возвращает содержимое первого найденного файла.
 */
function findScript(
  files: Map<string, string>,
  keywords: string[]
): string | null {
  for (const [path, content] of files) {
    const lowerPath = path.toLowerCase();
    if (keywords.some((kw) => lowerPath.includes(kw))) {
      return content;
    }
  }
  return null;
}

/**
 * Собирает все GDScript-файлы из коллекции в карту имя→содержимое.
 */
function collectGdScripts(files: Map<string, string>): Map<string, string> {
  const scripts = new Map<string, string>();
  for (const [path, content] of files) {
    if (path.endsWith(".gd")) {
      const name = path.split("/").pop() || path;
      scripts.set(name, content);
    }
  }
  return scripts;
}

// ── Правила грейдинга для каждого проекта ───────────────────────────────────

const PROJECT_GRADING_CHECKS: Record<string, GradingCheck[]> = {
  "project-1-clicker": [
    {
      name: "score_variable",
      description: "Переменная score существует",
      check: (files) => {
        const mainScript = findScript(files, ["main", "game_manager", "clicker"]);
        if (!mainScript) return { passed: false, message: "Скрипт не найден" };
        const hasScore = /var\s+score\s*[:=]/.test(mainScript);
        return { passed: hasScore, message: hasScore ? "OK" : "Нет переменной score" };
      },
    },
    {
      name: "click_handler",
      description: "Обработчик клика по кнопке",
      check: (files) => {
        const mainScript = findScript(files, ["main", "game_manager", "clicker"]);
        if (!mainScript) return { passed: false, message: "Скрипт не найден" };
        const hasClickHandler =
          /_on.*pressed|_on.*click|func\s+.*click|func\s+.*tap/.test(mainScript);
        return {
          passed: hasClickHandler,
          message: hasClickHandler ? "OK" : "Нет обработчика клика",
        };
      },
    },
    {
      name: "upgrade_system",
      description: "Система улучшений (переменная или функция)",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasUpgrade =
          /upgrade|improvement|power.?up|click.?power|click.?value/.test(allContent);
        return {
          passed: hasUpgrade,
          message: hasUpgrade ? "OK" : "Нет системы улучшений",
        };
      },
    },
    {
      name: "timer_signal",
      description: "Таймер и сигнал для idle-механики",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasTimer = /Timer|timer|timeout|_on.*timeout/.test(allContent);
        return {
          passed: hasTimer,
          message: hasTimer ? "OK" : "Нет таймера для idle-механики",
        };
      },
    },
    {
      name: "extends_control",
      description: "Скрипт наследует Control или Node",
      check: (files) => {
        const mainScript = findScript(files, ["main", "game_manager", "clicker"]);
        if (!mainScript) return { passed: false, message: "Скрипт не найден" };
        const hasExtends = /extends\s+(Control|Node|Node2D|CanvasItem|Window)/.test(mainScript);
        return {
          passed: hasExtends,
          message: hasExtends ? "OK" : "Нет наследования от Control/Node",
        };
      },
    },
  ],

  "project-2-space-shooter": [
    {
      name: "player_movement",
      description: "Движение игрока реализовано",
      check: (files) => {
        const playerScript = findScript(files, ["player", "ship"]);
        if (!playerScript) return { passed: false, message: "Скрипт игрока не найден" };
        const hasMovement =
          /velocity|speed|move_and_slide|move_and_collide|position\s*[+\-]=/.test(playerScript);
        return {
          passed: hasMovement,
          message: hasMovement ? "OK" : "Нет движения игрока",
        };
      },
    },
    {
      name: "shooting_mechanic",
      description: "Механика стрельбы",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasShooting =
          /shoot|fire|bullet|projectile|_on.*shoot|_on.*fire|spawn.*bullet/.test(allContent);
        return {
          passed: hasShooting,
          message: hasShooting ? "OK" : "Нет механики стрельбы",
        };
      },
    },
    {
      name: "enemy_spawning",
      description: "Спавн врагов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasEnemies =
          /enemy|spawn|wave|instan|preload.*enemy/.test(allContent);
        return {
          passed: hasEnemies,
          message: hasEnemies ? "OK" : "Нет спавна врагов",
        };
      },
    },
    {
      name: "collision_detection",
      description: "Обнаружение столкновений",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasCollision =
          /_on.*body_entered|_on.*area_entered|collision|overlap|hit/.test(allContent);
        return {
          passed: hasCollision,
          message: hasCollision ? "OK" : "Нет обнаружения столкновений",
        };
      },
    },
    {
      name: "score_system",
      description: "Система подсчёта очков",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasScore =
          /score|points|high.?score|destroyed|kill.?count/.test(allContent);
        return {
          passed: hasScore,
          message: hasScore ? "OK" : "Нет системы очков",
        };
      },
    },
  ],

  "project-3-metroidvania": [
    {
      name: "player_platformer",
      description: "Платформерное движение игрока",
      check: (files) => {
        const playerScript = findScript(files, ["player", "character"]);
        if (!playerScript) return { passed: false, message: "Скрипт игрока не найден" };
        const hasPlatformer =
          /jump|gravity|velocity\.y|move_and_slide|is_on_floor|floor/.test(playerScript);
        return {
          passed: hasPlatformer,
          message: hasPlatformer ? "OK" : "Нет платформерного движения",
        };
      },
    },
    {
      name: "ability_system",
      description: "Система способностей",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasAbilities =
          /ability|skill|unlock|power.?up|double.?jump|dash|wall.?jump/.test(allContent);
        return {
          passed: hasAbilities,
          message: hasAbilities ? "OK" : "Нет системы способностей",
        };
      },
    },
    {
      name: "map_exploration",
      description: "Механика исследования карты",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasMap =
          /map|room|area|zone|door|teleport|transition|checkpoint/.test(allContent);
        return {
          passed: hasMap,
          message: hasMap ? "OK" : "Нет механики исследования карты",
        };
      },
    },
    {
      name: "enemy_boss",
      description: "Враги или босс",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasEnemy =
          /enemy|boss|enemy.*health|boss.*phase|attack.*pattern|damage.*player/.test(allContent);
        return {
          passed: hasEnemy,
          message: hasEnemy ? "OK" : "Нет врагов или босса",
        };
      },
    },
    {
      name: "health_system",
      description: "Система здоровья",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasHealth =
          /health|hp|hit.?point|damage|die|death|hurt/.test(allContent);
        return {
          passed: hasHealth,
          message: hasHealth ? "OK" : "Нет системы здоровья",
        };
      },
    },
  ],

  "project-4-tower-defense": [
    {
      name: "tower_placement",
      description: "Размещение башен",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasTower =
          /tower|place|build|turret|position.*tower|spawn.*tower/.test(allContent);
        return {
          passed: hasTower,
          message: hasTower ? "OK" : "Нет размещения башен",
        };
      },
    },
    {
      name: "enemy_waves",
      description: "Волны врагов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasWaves =
          /wave|round|spawn.*enemy|enemy.*path|creep/.test(allContent);
        return {
          passed: hasWaves,
          message: hasWaves ? "OK" : "Нет волн врагов",
        };
      },
    },
    {
      name: "projectile_system",
      description: "Система снарядов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasProjectile =
          /projectile|bullet|missile|shoot|fire.*tower|attack/.test(allContent);
        return {
          passed: hasProjectile,
          message: hasProjectile ? "OK" : "Нет системы снарядов",
        };
      },
    },
    {
      name: "currency_system",
      description: "Система валюты/ресурсов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasCurrency =
          /gold|money|currency|resource|cost|price|coin|budget/.test(allContent);
        return {
          passed: hasCurrency,
          message: hasCurrency ? "OK" : "Нет системы валюты",
        };
      },
    },
    {
      name: "path_logic",
      description: "Путь следования врагов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasPath =
          /path|waypoint|follow|navigation|direction|path2d|path_follow/.test(allContent);
        return {
          passed: hasPath,
          message: hasPath ? "OK" : "Нет логики пути врагов",
        };
      },
    },
  ],

  "project-5-3d-adventure": [
    {
      name: "character_3d",
      description: "3D-персонаж",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const has3DCharacter =
          /CharacterBody3D|Node3D|extends.*3D|MeshInstance3D|Skeleton3D|character.*3d/i.test(allContent);
        return {
          passed: has3DCharacter,
          message: has3DCharacter ? "OK" : "Нет 3D-персонажа",
        };
      },
    },
    {
      name: "camera_system",
      description: "Система камеры",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasCamera =
          /Camera3D|camera|look_at|springarm|spring_arm|follow.*camera/i.test(allContent);
        return {
          passed: hasCamera,
          message: hasCamera ? "OK" : "Нет системы камеры",
        };
      },
    },
    {
      name: "navigation_3d",
      description: "3D-навигация",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasNavigation =
          /NavigationRegion3D|NavigationAgent3D|navigation|nav_mesh|astar|pathfind/i.test(allContent);
        return {
          passed: hasNavigation,
          message: hasNavigation ? "OK" : "Нет 3D-навигации",
        };
      },
    },
    {
      name: "world_interaction",
      description: "Взаимодействие с миром",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasInteraction =
          /interact|pickup|collect|item|door|trigger|area.*enter|raycast/i.test(allContent);
        return {
          passed: hasInteraction,
          message: hasInteraction ? "OK" : "Нет взаимодействия с миром",
        };
      },
    },
    {
      name: "animation_system",
      description: "Система анимаций",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasAnimation =
          /AnimationPlayer|AnimationTree|animation|anim|play.*anim|transition/i.test(allContent);
        return {
          passed: hasAnimation,
          message: hasAnimation ? "OK" : "Нет системы анимаций",
        };
      },
    },
  ],

  "project-6-performance-demo": [
    {
      name: "entity_system",
      description: "Система сущностей (ECS или подобная)",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasECS =
          /entity|component|system|ecs|registry|sparse.?set|archetype/i.test(allContent);
        return {
          passed: hasECS,
          message: hasECS ? "OK" : "Нет системы сущностей",
        };
      },
    },
    {
      name: "profiling",
      description: "Профилирование производительности",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasProfiling =
          /profile|benchmark|perf|fps|frame.?time|timer|stopwatch|measure/i.test(allContent);
        return {
          passed: hasProfiling,
          message: hasProfiling ? "OK" : "Нет профилирования",
        };
      },
    },
    {
      name: "optimization",
      description: "Оптимизация (объектный пул, LOD и т.д.)",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasOptimization =
          /pool|object.?pool|reuse|recycle|lod|cull|batch|instance|MultiMesh/i.test(allContent);
        return {
          passed: hasOptimization,
          message: hasOptimization ? "OK" : "Нет оптимизации",
        };
      },
    },
    {
      name: "mass_objects",
      description: "Массовое создание объектов",
      check: (files) => {
        const allContent = Array.from(files.values()).join("\n");
        const hasMassObjects =
          /thousand|1000|mass|bulk|spawn.*many|instance.*multi|MultiMesh|particle/i.test(allContent);
        return {
          passed: hasMassObjects,
          message: hasMassObjects ? "OK" : "Нет массового создания объектов",
        };
      },
    },
  ],
};

// ── Mock-режим грейдинга ────────────────────────────────────────────────────

/**
 * Выполняет mock-грейдинг проекта на основе парсинга GDScript-файлов.
 * Проверяет наличие требуемых паттернов: переменных, функций, сигналов, наследования.
 */
async function mockGradeProject(
  projectSlug: string,
  files: Map<string, string>
): Promise<GradingResult> {
  const startTime = Date.now();
  const checks = PROJECT_GRADING_CHECKS[projectSlug];

  if (!checks) {
    return {
      status: "error",
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: Date.now() - startTime,
      testResults: [],
      errorMessage: `Нет правил грейдинга для проекта "${projectSlug}"`,
    };
  }

  const testResults: TestResultEntry[] = checks.map((check) => {
    const result = check.check(files);
    return {
      name: check.name,
      suite: projectSlug,
      status: result.passed ? "pass" : "fail",
      duration: 0,
      message: result.message,
      script: "mock-grader",
    };
  });

  const passedTests = testResults.filter((t) => t.status === "pass").length;
  const failedTests = testResults.filter((t) => t.status === "fail").length;
  const allPassed = failedTests === 0 && passedTests > 0;

  return {
    status: allPassed ? "passed" : "failed",
    totalTests: testResults.length,
    passedTests,
    failedTests,
    skippedTests: 0,
    duration: Date.now() - startTime,
    testResults,
  };
}

// ── Real-режим грейдинга (заглушка) ─────────────────────────────────────────

/**
 * Запускает GUT-тесты через headless Godot.
 *
 * TODO (INFRA): Реализовать запуск headless Godot с GUT-фреймворком.
 *   Требует:
 *   1. Docker-контейнер с Godot headless + GUT addon
 *   2. Сборку проекта из файлов в S3 во временный каталог
 *   3. Запуск: `godot --headless --script res://test_runner.gd`
 *   4. Парсинг XML/JSON вывода GUT (gut_result.xml)
 *   5. Формирование GradingResult
 *
 *   Это инфраструктурная задача — требует отдельного контейнера и оркестрации.
 *   Пока возвращает ошибку — real-режим не реализован.
 */
async function realGradeProject(
  _projectSlug: string,
  _projectId: string
): Promise<GradingResult> {
  // TODO (INFRA): Реализовать интеграцию с headless Godot — см. комментарий к функции выше
  return {
    status: "error",
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    testResults: [],
    errorMessage: "Real-режим грейдинга (GUT) пока не реализован",
  };
}

// ── Загрузка файлов проекта из S3 ──────────────────────────────────────────

/**
 * Загружает все файлы проекта из S3 и возвращает их в виде Map<путь, содержимое>.
 */
async function loadProjectFiles(
  userId: string,
  projectSlug: string,
  projectId: string
): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  if (!isS3Configured()) {
    return files;
  }

  try {
    const storageInfo = await listProjectFiles(userId, projectSlug, projectId);

    for (const file of storageInfo.files) {
      // Загружаем только текстовые файлы (GDScript, JSON и т.д.)
      if (
        file.key.endsWith(".gd") ||
        file.key.endsWith(".tscn") ||
        file.key.endsWith(".tres") ||
        file.key.endsWith(".json") ||
        file.key.endsWith(".cfg") ||
        file.key.endsWith(".cpp") ||
        file.key.endsWith(".h")
      ) {
        try {
          const buffer = await downloadFile(file.key);
          const content = buffer.toString("utf-8");
          files.set(file.key, content);
        } catch (err) {
          console.warn(`[Grading] Не удалось загрузить файл ${file.key}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("[Grading] Ошибка при загрузке файлов проекта:", err);
  }

  return files;
}

// ── Начисление XP за автогрейдинг ──────────────────────────────────────────

/**
 * Начисляет XP пользователю за успешную сдачу проекта.
 * Базовый XP: 50 за прохождение всех тестов.
 * Бонусный XP: 25 если это первая сдача проекта.
 * Обновляет уровень и проверяет бейджи.
 */
async function awardGradingXp(
  userId: string,
  projectSlug: string,
  projectId: string
): Promise<{ xpEarned: number; newLevel: number; newBadges: { slug: string; name: string; description: string; icon: string }[] }> {
  let xpEarned = XP_GRADING_BASE;

  // Проверяем, была ли уже успешная отправка для этого проекта
  const alreadyPassed = await hasPassedSubmission(projectId, userId);
  if (!alreadyPassed) {
    xpEarned += XP_GRADING_FIRST_SUBMISSION;
  }

  // Обновляем XP пользователя
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { xpEarned: 0, newLevel: 1, newBadges: [] };
  }

  const newXp = user.xp + xpEarned;
  const newLevel = calculateLevel(newXp);

  // Обновляем стрик
  const today = new Date().toISOString().split("T")[0];
  const lastActive = user.lastActiveDate;
  let newStreak = user.streak;

  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastActive === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  // Проверяем и начисляем бейджи
  const completedProjects = await countCompletedProjects(userId);
  const newBadges = await checkAndAwardBadges(userId, {
    xp: newXp,
    streak: newStreak,
    completedChapters: await prisma.progress.count({ where: { userId, completed: true } }),
    completedProjects,
    projectSlug,
    completedAt: new Date(),
  });

  return { xpEarned, newLevel, newBadges };
}

// ── API-обработчики ─────────────────────────────────────────────────────────

/**
 * GET /api/submit/[projectId] — получить последнюю отправку проекта.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Проверяем существование проекта
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    // Получаем последнюю отправку
    const submission = await getLatestSubmission(projectId, DEFAULT_USER_ID);

    if (!submission) {
      return NextResponse.json(
        { error: "Отправки не найдены" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: submission.id,
      userId: submission.userId,
      projectId: submission.projectId,
      projectSlug: submission.projectSlug,
      status: submission.status,
      totalTests: submission.totalTests,
      passedTests: submission.passedTests,
      failedTests: submission.failedTests,
      skippedTests: submission.skippedTests,
      duration: submission.duration,
      xpEarned: submission.xpEarned,
      testResults: JSON.parse(submission.testResults),
      errorMessage: submission.errorMessage,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error: any) {
    console.error("[Submit] GET error:", error);
    return NextResponse.json(
      { error: "Не удалось получить результаты автогрейдинга" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submit/[projectId] — отправить проект на автогрейдинг.
 *
 * Тело запроса (опционально):
 *   testResults — если указан, используется как результат (клиентский грейдинг)
 *   Если не указан — запускается mock-грейдинг на сервере
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Проверяем существование проекта
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    // Парсим и валидируем тело запроса
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Пустое тело — допустимо (будет использован mock-режим)
    }

    const parsed = submitProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let gradingResult: GradingResult;

    if (parsed.data.testResults) {
      // Клиент предоставил результаты тестирования — используем их
      const { summary, tests } = parsed.data.testResults;
      const allPassed = summary.failed === 0 && summary.passed > 0;
      gradingResult = {
        status: allPassed ? "passed" : "failed",
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        skippedTests: summary.skipped,
        duration: summary.duration,
        testResults: tests,
      };
    } else {
      // Запускаем серверный mock-грейдинг
      const files = await loadProjectFiles(
        DEFAULT_USER_ID,
        project.projectSlug,
        project.id
      );

      if (files.size === 0) {
        // Нет файлов в S3 — пробуем real-режим или возвращаем ошибку
        // Пока возвращаем mock-результат с пустыми файлами
        gradingResult = await mockGradeProject(project.projectSlug, files);
        if (gradingResult.status === "error" && !gradingResult.errorMessage) {
          gradingResult.errorMessage =
            "Файлы проекта не найдены. Убедитесь, что проект сохранён в редакторе.";
        }
      } else {
        gradingResult = await mockGradeProject(project.projectSlug, files);
      }
    }

    // Начисляем XP, если все тесты пройдены
    let xpEarned = 0;
    let newLevel: number | undefined;
    let newBadges: { slug: string; name: string; description: string; icon: string }[] | undefined;

    if (gradingResult.status === "passed") {
      const xpResult = await awardGradingXp(
        DEFAULT_USER_ID,
        project.projectSlug,
        project.id
      );
      xpEarned = xpResult.xpEarned;
      newLevel = xpResult.newLevel;
      newBadges = xpResult.newBadges;
    }

    // Создаём запись отправки в БД
    const submission = await createSubmission({
      userId: DEFAULT_USER_ID,
      projectId: project.id,
      projectSlug: project.projectSlug,
      status: gradingResult.status,
      totalTests: gradingResult.totalTests,
      passedTests: gradingResult.passedTests,
      failedTests: gradingResult.failedTests,
      skippedTests: gradingResult.skippedTests,
      duration: gradingResult.duration,
      xpEarned,
      testResults: JSON.stringify(gradingResult.testResults),
      errorMessage: gradingResult.errorMessage || null,
    });

    return NextResponse.json({
      id: submission.id,
      userId: submission.userId,
      projectId: submission.projectId,
      projectSlug: submission.projectSlug,
      status: submission.status,
      totalTests: submission.totalTests,
      passedTests: submission.passedTests,
      failedTests: submission.failedTests,
      skippedTests: submission.skippedTests,
      duration: submission.duration,
      xpEarned: submission.xpEarned,
      testResults: gradingResult.testResults,
      errorMessage: submission.errorMessage,
      newLevel,
      newBadges: newBadges && newBadges.length > 0 ? newBadges : undefined,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error: any) {
    console.error("[Submit] POST error:", error);
    return NextResponse.json(
      { error: "Не удалось выполнить автогрейдинг проекта" },
      { status: 500 }
    );
  }
}
