# Task 2 — Auto-Grading API & Prisma Schema Update

## Agent: Fullstack Developer

## Task Summary
Create the auto-grading API for the Godot Learning Platform, including database schema, repository, validator, and API route with mock grading logic.

## Files Created

### 1. `src/validators/grading.ts`
- Zod-схемы для валидации API запросов автогрейдинга
- `submitProjectSchema` — валидация POST-запроса (опциональное поле `testResults`)
- `testResultEntrySchema` — результат одного теста (name, suite, status, duration, message, line_number, script)
- `testSummarySchema` — сводка результатов (total, passed, failed, skipped, duration)
- `testResultsSchema` — полный отчёт о тестировании (summary + tests)
- Экспорт типов: `TestResultEntry`, `TestSummary`, `TestResults`, `SubmitProjectInput`

### 2. `src/repositories/grading.repository.ts`
- Repository для управления отправками проектов на автогрейдинг
- `createSubmission()` — создаёт запись отправки в БД
- `updateSubmissionResults()` — обновляет отправку с результатами
- `getSubmission()` — получает отправку по ID
- `listSubmissions()` — список отправок для проекта
- `getLatestSubmission()` — последняя отправка для проекта
- `countSubmissions()` — подсчёт общего числа отправок
- `hasPassedSubmission()` — проверяет, была ли уже успешная сдача (для бонусного XP)
- `getPassedProjectSlugs()` — получает уникальные projectSlug с успешными отправками
- Все функции используют `DEFAULT_USER_ID = "default-user"`
- Типы: `SubmissionData`, `TestResultEntry`, `SubmissionCreateInput`, `SubmissionUpdateInput`

### 3. `src/app/api/submit/[projectId]/route.ts`
- **GET /api/submit/[projectId]** — получить последнюю отправку проекта
  - Проверяет существование проекта
  - Возвращает последнюю отправку с распарсенным JSON testResults
  - 404 если проект или отправка не найдены

- **POST /api/submit/[projectId]** — отправить проект на автогрейдинг
  - Валидирует тело запроса через `submitProjectSchema`
  - Если указан `testResults` — использует клиентские результаты
  - Если не указан — запускает серверный mock-грейдинг
  - Создаёт запись отправки в БД
  - Начисляет XP при успешной сдаче (база 50 + бонус 25 за первую сдачу)
  - Обновляет уровень и проверяет бейджи
  - Возвращает полный результат с testResults, xpEarned, newLevel, newBadges

- **Mock-грейдинг** (`mockGradeProject`):
  - Парсит GDScript-файлы из S3 на паттерны
  - Проверяет требуемые переменные, функции, сигналы, наследование
  - Правила для всех 6 проектов (3-5 проверок каждый):
    - `project-1-clicker`: score_variable, click_handler, upgrade_system, timer_signal, extends_control
    - `project-2-space-shooter`: player_movement, shooting_mechanic, enemy_spawning, collision_detection, score_system
    - `project-3-metroidvania`: player_platformer, ability_system, map_exploration, enemy_boss, health_system
    - `project-4-tower-defense`: tower_placement, enemy_waves, projectile_system, currency_system, path_logic
    - `project-5-3d-adventure`: character_3d, camera_system, navigation_3d, world_interaction, animation_system
    - `project-6-performance-demo`: entity_system, profiling, optimization, mass_objects

- **Real-грейдинг** (`realGradeProject`):
  - Заглушка с TODO-комментарием для интеграции с headless Godot + GUT

- **XP начисление** (`awardGradingXp`):
  - Базовый XP: 50 за прохождение всех тестов
  - Бонусный XP: 25 за первую сдачу проекта (проверка через `hasPassedSubmission`)
  - Обновляет XP, уровень, стрик пользователя
  - Проверяет и начисляет бейджи через `checkAndAwardBadges`

## Files Modified

### 1. `prisma/schema.prisma`
- Добавлена модель `ProjectSubmission` после `EditorProject`:
  - Поля: id, userId, projectId, projectSlug, status, totalTests, passedTests, failedTests, skippedTests, duration, xpEarned, testResults, errorMessage, createdAt, updatedAt
  - Связь с User через userId (onDelete: Cascade)
  - Индексы: [userId, projectId], [userId, projectSlug]
- Добавлено поле `submissions ProjectSubmission[]` в модель User
- Выполнен `npx prisma db push` — БД обновлена

### 2. `src/repositories/progress.repository.ts`
- Функция `countCompletedProjects` стала экспортируемой (`export async function`)
  - Необходима для расчёта completedProjects при начислении XP в автогрейдинге

## Dependencies Used
- `@/lib/prisma` — Prisma client singleton
- `@/lib/s3` — `isS3Configured()` для проверки доступности S3
- `@/lib/storage` — `listProjectFiles()`, `downloadFile()` для загрузки файлов проекта
- `@/lib/gamification` — `calculateLevel()` для расчёта уровня по XP
- `@/repositories/editor.repository` — `getProject()` для получения проекта
- `@/repositories/progress.repository` — `checkAndAwardBadges()`, `countCompletedProjects()`
- `@/validators/grading` — Zod-схемы для валидации

## XP System Design
- Базовый XP: 50 за прохождение всех тестов автогрейдинга
- Бонусный XP: 25 за первую успешную сдачу проекта (всего 75 XP при первой сдаче)
- XP начисляется только если все тесты пройдены (status === "passed")
- После начисления XP обновляется уровень через `calculateLevel()`
- Проверяются и начисляются бейджи через существующую систему геймификации
