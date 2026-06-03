# Worklog — Task 2: Auto-Grading API & Prisma Schema Update

## Дата выполнения: 2026-03-05

## Задача
Создать API автогрейдинга проектов, обновить Prisma-схему, создать репозиторий, валидатор и API-маршрут с mock-грейдингом.

## Обновлённые файлы

### 1. `prisma/schema.prisma`
- Добавлена модель `ProjectSubmission` — результаты автогрейдинга:
  - Поля: id, userId, projectId, projectSlug, status (pending|running|passed|failed|error), totalTests, passedTests, failedTests, skippedTests, duration, xpEarned, testResults (JSON), errorMessage, createdAt, updatedAt
  - Связь с User (onDelete: Cascade)
  - Индексы: [userId, projectId], [userId, projectSlug]
- Добавлено поле `submissions ProjectSubmission[]` в модель User
- Выполнен `npx prisma db push` — БД обновлена успешно

### 2. `src/repositories/progress.repository.ts`
- Функция `countCompletedProjects` теперь экспортируемая (добавлен `export`)

## Созданные файлы

### 3. `src/validators/grading.ts`
- Zod-схемы валидации: `submitProjectSchema`, `testResultEntrySchema`, `testSummarySchema`, `testResultsSchema`
- Экспорт типов: `TestResultEntry`, `TestSummary`, `TestResults`, `SubmitProjectInput`

### 4. `src/repositories/grading.repository.ts`
- Функции доступа к данным ProjectSubmission:
  - `createSubmission()` — создание отправки
  - `updateSubmissionResults()` — обновление результатов
  - `getSubmission()` — получение по ID
  - `listSubmissions()` — список отправок для проекта
  - `getLatestSubmission()` — последняя отправка
  - `countSubmissions()` — подсчёт отправок
  - `hasPassedSubmission()` — проверка первой сдачи (для бонусного XP)
  - `getPassedProjectSlugs()` — уникальные projectSlug с успешными отправками

### 5. `src/app/api/submit/[projectId]/route.ts`
- **GET** — последняя отправка проекта
- **POST** — отправка на автогрейдинг:
  - Mock-режим: парсинг GDScript на паттерны (6 проектов, 3-5 проверок каждый)
  - Real-режим: заглушка с TODO для headless Godot + GUT
  - XP начисление: 50 базовый + 25 бонус за первую сдачу
  - Обновление уровня, стрика, проверка бейджей
  - Загрузка файлов проекта из S3 через `listProjectFiles()` + `downloadFile()`

**Правила mock-грейдинга:**
- `project-1-clicker`: score_variable, click_handler, upgrade_system, timer_signal, extends_control
- `project-2-space-shooter`: player_movement, shooting_mechanic, enemy_spawning, collision_detection, score_system
- `project-3-metroidvania`: player_platformer, ability_system, map_exploration, enemy_boss, health_system
- `project-4-tower-defense`: tower_placement, enemy_waves, projectile_system, currency_system, path_logic
- `project-5-3d-adventure`: character_3d, camera_system, navigation_3d, world_interaction, animation_system
- `project-6-performance-demo`: entity_system, profiling, optimization, mass_objects

## Проверка качества
- ESLint: 0 ошибок в новых файлах
- Prisma: `db push` выполнен успешно
- Dev server: компиляция без ошибок

---

# Worklog — Task 5: GradingResults & GradingButton Components

## Дата выполнения: 2026-03-05

## Задача
Создать React-компоненты для отображения результатов автопроверки (auto-grading) и кнопку для запуска проверки.

## Созданные файлы

### 1. `/src/components/editor/grading-results.tsx`
Основной компонент для отображения результатов автопроверки тестов.

**Экспортируемые типы:**
- `TestResultEntry` — результат отдельного теста (name, suite, status, duration, message, line_number, script)
- `GradingSubmission` — полная модель отправки (id, status, totalTests, passedTests, failedTests, skippedTests, duration, xpEarned, testResults, errorMessage, createdAt)
- `GradingResultsProps` — пропсы компонента (submission, onRetry?, onClose?)

**Структура UI:**

1. **Status Header** — Большая иконка + текст статуса:
   - `passed` → Зелёная галочка + "Все тесты пройдены!"
   - `failed` → Красный крестик + "Некоторые тесты не пройдены"
   - `error` → Оранжевое предупреждение + "Ошибка при проверке"
   - `running` → Анимированный спиннер + "Проверка..."
   - `pending` → Часы + "Ожидание проверки"

2. **Summary Stats** — 4 карточки в сетке (grid-cols-4):
   - Всего (нейтральный)
   - Пройдено (зелёный)
   - Не пройдено (красный)
   - Пропущено (жёлтый)

3. **Кольцевая диаграмма** — recharts PieChart с donut:
   - Процент прохождения тестов
   - Легенда с цветами (зелёный/красный/жёлтый)
   - Рядом — длительность проверки в секундах

4. **XP Badge** — Анимированный бейдж "+{xp} XP" (жёлтый, с иконкой Zap)

5. **Test Details** — Раскрывающийся список по suite:
   - Группировка по test suite (файлу)
   - Каждый тест: иконка статуса (✓/✗/⊘), имя, длительность
   - Проваленные тесты раскрываются с сообщением об ошибке и номером строки
   - Пропущенные тесты отображаются приглушёнными с зачёркиванием
   - Используется Collapsible для групп и раскрывающихся деталей

6. **Error State** — Красная карточка с сообщением об ошибке и рекомендацией повторить

7. **Action Buttons** — "Повторить проверку" (Godot blue #478CBF) + "Закрыть" (ghost)

**Вспомогательные подкомпоненты:**
- `XPBadge` — анимированный бейдж XP
- `StatCard` — карточка со статистикой
- `TestStatusIcon` — иконка статуса теста
- `TestResultRow` — строка результата теста (с раскрывающейся ошибкой)
- `TestSuiteGroup` — группа тестов по suite (Collapsible)
- `ResultsDonutChart` — кольцевая диаграмма (recharts)

### 2. `/src/components/editor/grading-button.tsx`
Кнопка для запуска автопроверки.

**Экспортируемые типы:**
- `GradingButtonProps` — пропсы (projectId, projectSlug, onResults?, previousSubmission?, disabled?)

**Функциональность:**
- Кнопка "Проверить" с иконкой FlaskConical
- POST-запрос на `/api/submit/${projectId}` при нажатии
- Состояние загрузки с анимированным спиннером ("Проверка...")
- Toast-уведомления (sonner) при успехе/неудаче/ошибке
- Вызов `onResults` callback с данными отправки
- Бейдж на кнопке с результатом предыдущей проверки (✓ зелёный / ✗ красный)
- Мини-статус рядом с кнопкой (пройдено/всего или "Ошибка")

**Используемые зависимости:**
- shadcn/ui: Card, Badge, Button, Collapsible
- lucide-react: CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Zap, ChevronDown, RotateCcw, X, FileCode, MinusCircle, FlaskConical, CheckCheck
- recharts: PieChart, Pie, Cell, ResponsiveContainer
- sonner: toast

## Стилизация
- Godot blue (#478CBF) для акцентов и основной кнопки
- Семантические цвета: emerald (пройдено), red (не пройдено), yellow (пропущено), orange (ошибка)
- Адаптивная сетка (grid-cols-4 для статистики)
- Все тексты на русском языке
- Скроллируемый список деталей (max-h-96 overflow-y-auto)

## Проверка качества
- ESLint: 0 ошибок в новых файлах
- TypeScript: строгая типизация на всех уровнях
- Согласованность с существующими компонентами проекта (project-file-browser.tsx, challenge-results.tsx)
