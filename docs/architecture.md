# Архитектура Godot Learning Platform

> **Версия:** 1.0
> **Дата:** 2026-06-03
> **Стек:** Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma + SQLite
> **Статус:** Актуальный

---

## 1. Обзор архитектуры

Godot Learning Platform — монолитное веб-приложение на базе Next.js 16 с App Router. Приложение следует серверно-ориентированной архитектуре: серверные компоненты используются по умолчанию, клиентские — только при необходимости интерактивности. Данные хранятся в SQLite (разработка) / PostgreSQL (production) через Prisma ORM. Контент курса поставляется в формате MDX и рендерится на сервере.

Архитектура проектируется с учётом двух фаз развития: MVP (базовая платформа с читалкой и челленджами) и Phase 2 (Godot Web Editor, автопроверка, подписки). Фаза 3 (Cloud Workspaces) отложена.

### Ключевые архитектурные принципы

1. **Server Components по умолчанию** — каждый компонент является серверным, пока не доказана необходимость клиента
2. **Repository Pattern** — единственная точка доступа к данным каждой сущности
3. **Server Actions как Application Layer** — мутации данных инкапсулированы в Server Actions с Zod-валидацией
4. **Контент как код** — MDX-файлы хранятся в репозитории, версонируются вместе с кодом
5. **Прогрессивная доставка** — Suspense boundaries для стриминга, динамические импорты для тяжёлых компонентов

---

## 2. Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        Пользователь                             │
│                    (Браузер / PWA)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                     Next.js 16 App Router                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Presentation Layer                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │ Страницы │  │ Server   │  │ API      │  │ MDX    │  │    │
│  │  │ (RSC)    │  │ Actions  │  │ Routes   │  │ Рендер │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                 Application Layer                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ Validators   │  │ Services     │  │ Repositories │   │    │
│  │  │ (Zod)        │  │ (Business)   │  │ (Data Access)│   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   Data Layer                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ Prisma ORM   │  │ SQLite /     │  │ Content      │   │    │
│  │  │ (Client)     │  │ PostgreSQL   │  │ (MDX files)  │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Client State Layer                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ Zustand      │  │ TanStack     │  │ React State  │   │    │
│  │  │ (UI state)   │  │ Query (cache)│  │ (local)      │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Структура директорий

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Группа: лендинг
│   │   └── page.tsx              # Главная страница `/`
│   ├── learn/                    # Группа: обучающие страницы
│   │   ├── page.tsx              # Карта прогресса `/learn`
│   │   └── [project]/            # Динамический маршрут проекта
│   │       ├── page.tsx          # Обзор проекта `/learn/[project]`
│   │       └── [chapter]/        # Динамический маршрут главы
│   │           └── page.tsx      # Читатель урока `/learn/[project]/[chapter]`
│   ├── challenge/                # Челленджи
│   │   └── [id]/page.tsx         # Страница челленджа
│   ├── dashboard/                # Дашборд
│   │   └── page.tsx              # `/dashboard`
│   ├── profile/                  # Профиль
│   │   └── page.tsx              # `/profile`
│   ├── api/                      # API Routes (внешние клиенты, вебхуки)
│   │   └── progress/             # API прогресса
│   ├── layout.tsx                # Root Layout
│   ├── globals.css               # Глобальные стили
│   └── not-found.tsx             # 404 страница
│
├── components/                   # React-компоненты
│   ├── ui/                       # Базовые shadcn/ui компоненты
│   ├── layout/                   # Компоненты разметки (Header, Sidebar, Footer)
│   ├── features/                 # Фича-компоненты (CourseCard, ChapterReader и т.д.)
│   └── mdx/                      # Кастомные MDX-компоненты
│       ├── insight.tsx           # <Insight> — блок «Почему это работает именно так?»
│       ├── challenge.tsx         # <Challenge> — интерактивный челлендж
│       ├── sprint.tsx            # <Sprint> — финальный спринт проекта
│       ├── bridge.tsx            # <Bridge> — мост к следующему проекту
│       ├── code-block.tsx        # <CodeBlock> — блок кода с подсветкой
│       ├── mermaid-diagram.tsx   # <MermaidDiagram> — диаграмма Mermaid
│       ├── callout.tsx           # <Callout> — выноска/предупреждение
│       └── collapsible-hint.tsx  # <CollapsibleHint> — сворачиваемая подсказка
│
├── actions/                      # Server Actions (Application Layer)
│   ├── progress.action.ts        # Действия с прогрессом
│   ├── challenge.action.ts       # Отправка решений челленджей
│   └── xp.action.ts              # Начисление XP
│
├── repositories/                 # Repository Pattern (Data Access Layer)
│   ├── progress.repository.ts
│   ├── challenge.repository.ts
│   └── user.repository.ts
│
├── services/                     # Бизнес-логика (если сложнее action)
│   ├── xp-calculator.service.ts  # Расчёт XP и уровней
│   ├── streak.service.ts         # Расчёт стрика
│   └── badge.service.ts          # Проверка и начисление бейджей
│
├── lib/                          # Утилиты и хелперы
│   ├── prisma.ts                 # Экземпляр Prisma Client
│   ├── utils.ts                  # cn() и прочие утилиты
│   ├── mdx.ts                    # Утилиты для работы с MDX
│   └── constants.ts              # Константы проекта
│
├── stores/                       # Zustand stores (клиентское состояние)
│   ├── sidebar-store.ts          # Состояние сайдбара
│   └── theme-store.ts            # Настройки темы
│
├── hooks/                        # Кастомные React-хуки
│   ├── use-progress.ts           # Хук прогресса (TanStack Query)
│   └── use-challenge.ts          # Хук челленджа
│
├── types/                        # Глобальные TypeScript типы
│   ├── course.ts                 # Типы курса (Project, Chapter, Challenge)
│   ├── progress.ts               # Типы прогресса
│   └── user.ts                   # Типы пользователя
│
└── validators/                   # Zod-схемы валидации
    ├── progress.validator.ts
    └── challenge.validator.ts

content/                          # Контент курса (MDX-файлы)
├── projects/
│   ├── project-1-clicker/
│   │   ├── chapter-01-basics/
│   │   │   └── index.mdx
│   │   ├── chapter-02-signals/
│   │   │   └── index.mdx
│   │   ├── chapter-03-ui/
│   │   │   └── index.mdx
│   │   ├── chapter-04-save-load/
│   │   │   └── index.mdx
│   │   ├── chapter-05-achievements/
│   │   │   └── index.mdx
│   │   ├── chapter-06-advanced/
│   │   │   └── index.mdx
│   │   ├── sprint/
│   │   │   └── index.mdx
│   │   ├── cheat-sheet.mdx
│   │   └── _meta.json            # Метаданные проекта
│   ├── project-2-shooter/
│   │   └── ...
│   ├── project-3-metroidvania/
│   │   └── ...
│   ├── project-4-tower-defense/
│   │   └── ...
│   ├── project-5-3d-adventure/
│   │   └── ...
│   └── project-6-performance/
│       └── ...
└── overview.mdx                  # Обзор курса

tests/                            # Тесты
├── unit/                         # Unit-тесты (Vitest)
│   ├── services/
│   └── repositories/
├── integration/                  # Integration-тесты
│   └── api/
└── e2e/                          # E2E-тесты (Playwright)
    └── learn-flow.spec.ts

prisma/                           # Prisma схема и миграции
├── schema.prisma
├── seed.ts                       # Seed-данные
└── migrations/
```

---

## 4. Слой данных

### 4.1. Модели Prisma

```prisma
// Пользователь
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatar        String?
  xp            Int      @default(0)
  level         Int      @default(1)
  streak        Int      @default(0)
  lastActiveAt  DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  progress      Progress[]
  badges        Badge[]
  challenges    ChallengeAttempt[]
}

// Прогресс прохождения глав
model Progress {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  projectSlug String   // "project-1-clicker"
  chapterSlug String   // "chapter-01-basics"
  completed   Boolean  @default(false)
  completedAt DateTime?
  xpEarned    Int      @default(0)

  @@unique([userId, projectSlug, chapterSlug])
}

// Бейджи
model Badge {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  slug      String   // "first-signal", "cpp-master"
  earnedAt  DateTime @default(now())

  @@unique([userId, slug])
}

// Попытки челленджей
model ChallengeAttempt {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  challengeId  String
  code         String
  passed       Boolean
  testsPassed  Int      @default(0)
  testsTotal   Int      @default(0)
  xpEarned     Int      @default(0)
  attemptedAt  DateTime @default(now())
}
```

### 4.2. Repository Pattern

Каждая сущность данных имеет свой Repository — единственную точку доступа. Компоненты и Server Actions обращаются к данным только через репозитории.

```typescript
// repositories/progress.repository.ts
export const progressRepository = {
  findByUserAndChapter(userId: string, projectSlug: string, chapterSlug: string),
  findByUser(userId: string): Promise<Progress[]>,
  findByProject(userId: string, projectSlug: string): Promise<Progress[]>,
  markComplete(userId: string, projectSlug: string, chapterSlug: string, xpEarned: number),
  getProjectProgress(userId: string, projectSlug: string): Promise<{ completed: number; total: number }>,
  getOverallProgress(userId: string): Promise<{ completed: number; total: number }>,
};
```

### 4.3. Стратегия кэширования

| Тип данных | Стратегия | Время кэша | Инвалидация |
|---|---|---|---|
| Контент MDX | Build-time static generation | Бессрочно | Пересборка при изменении контента |
| Прогресс пользователя | TanStack Query на клиенте | 5 мин | revalidatePath после Server Action |
| Список проектов | Static generation | Бессрочно | Пересборка |
| XP / уровень | TanStack Query + optimistic | 1 мин | revalidatePath после начисления |

---

## 5. Контент-система

### 5.1. Формат MDX-контента

Каждая глава курса — MDX-файл с фронтматтером:

```mdx
---
title: "Сигналы и события"
project: "project-1-clicker"
chapter: "chapter-02-signals"
order: 2
xp: 15
estimatedTime: 25
tags: ["signals", "events", "observer-pattern"]
---

# Сигналы и события

Контент главы с встроенными компонентами:

<Insight title="Почему сигналы слабосвязанные?">
  Сигналы реализуют паттерн Observer: отправитель не знает,
  кто и как обрабатывает его сигнал...
</Insight>

<Challenge id="p1-ch2-signal-connect" difficulty="green">
  Подключите сигнал `pressed` кнопки к функции `_on_button_pressed`...
</Challenge>
```

### 5.2. Кастомные MDX-компоненты

| Компонент | Назначение | Визуальное представление |
|---|---|---|
| `<Insight>` | Блок «Почему это работает именно так?» | Синяя выноска с иконкой 💡 |
| `<Challenge>` | Интерактивный челлендж с Monaco Editor | Карточка с кодом и кнопкой проверки |
| `<Sprint>` | Финальный спринт проекта | Расширенная карточка с требованиями |
| `<Bridge>` | Мост к следующему проекту | Зелёная секция с навыками и превью |
| `<CodeBlock>` | Блок кода с подсветкой | Тёмный фон, подсветка GDScript/C++ |
| `<MermaidDiagram>` | Диаграмма Mermaid | SVG-рендеринг на сервере |
| `<Callout>` | Выноска/предупреждение | Цветная боковая полоска |
| `<CollapsibleHint>` | Сворачиваемая подсказка | Спойлер с штрафом XP |

### 5.3. Пайплайн контента

```
Markdown исходники (docs/course/*.md)
        │
        ▼
Скрипт конвертации (scripts/convert-to-mdx.ts)
        │  - Разбивка на главы
        │  - Добавление фронтматтера
        │  - Замена текстовых блоков на MDX-компоненты
        │  - Конвертация диаграмм в Mermaid
        ▼
MDX-файлы (content/projects/*/chapter-*/index.mdx)
        │
        ▼
Next.js (next-mdx-remote)
        │  - Серверный рендеринг
        │  - Подсветка синтаксиса (rehype-pretty-code)
        │  - Инъекция кастомных компонентов
        ▼
HTML-страница
```

---

## 6. Маршруты приложения

### 6.1. Карта маршрутов MVP

| Маршрут | Тип | Рендеринг | Описание |
|---|---|---|---|
| `/` | Страница | SSG | Лендинг: Hero, 6 проектов, CTA |
| `/learn` | Страница | SSR | Карта прогресса с визуализацией |
| `/learn/[project]` | Страница | SSG | Обзор проекта с главами |
| `/learn/[project]/[chapter]` | Страница | SSR | Читатель урока (MDX) |
| `/challenge/[id]` | Страница | SSR | Челлендж с Monaco Editor |
| `/dashboard` | Страница | SSR | Дашборд: навыки, стрик, бейджи |
| `/profile` | Страница | SSR | Профиль пользователя |
| `/api/progress` | GET/POST | API | REST API прогресса |

### 6.2. Server Actions

| Action | Входные данные | Результат | Побочный эффект |
|---|---|---|---|
| `markChapterComplete` | projectSlug, chapterSlug | { success, xpEarned } | +XP, обновление прогресса, проверка бейджей |
| `submitChallenge` | challengeId, code | { passed, testsPassed, testsTotal, xpEarned } | Запись попытки, +XP при успехе |
| `awardXP` | userId, amount, reason | { newLevel, newXP } | Обновление XP/уровня |
| `checkAndAwardBadges` | userId | { newBadges } | Начисление бейджей |

---

## 7. Клиентское состояние

### 7.1. Разделение ответственности

```
┌─────────────────────────────────────────┐
│          Серверное состояние             │
│  - Данные прогресса (Prisma)           │
│  - Контент MDX (файловая система)      │
│  - XP, уровни, бейджи (Prisma)         │
│  Доступ: Server Components, Actions     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        Кэш серверного состояния          │
│  - TanStack Query на клиенте            │
│  - staleTime: 1-5 мин                   │
│  - Инвалидация: revalidatePath          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Клиентское UI-состояние          │
│  - Открыт/закрыт сайдбар (Zustand)     │
│  - Активная вкладка (Zustand)           │
│  - Текущая тема (next-themes)           │
│  - Локальные формы (useState)           │
└─────────────────────────────────────────┘
```

### 7.2. Zustand Stores

| Store | Состояние | Назначение |
|---|---|---|
| `useSidebarStore` | `isOpen`, `activeSection` | Управление боковой навигацией |
| `useEditorStore` | `activeFile`, `isDirty` | Состояние Monaco Editor |

### 7.3. TanStack Query Keys

| Ключ | Данные | staleTime |
|---|---|---|
| `['progress']` | Общий прогресс пользователя | 1 мин |
| `['progress', projectSlug]` | Прогресс по проекту | 2 мин |
| `['progress', projectSlug, chapterSlug]` | Статус главы | 5 мин |
| `['badges']` | Список бейджей | 5 мин |
| `['xp']` | Текущий XP и уровень | 1 мин |
| `['streak']` | Текущий стрик | 5 мин |

---

## 8. Система геймификации

### 8.1. XP-система

| Действие | XP | Условие |
|---|---|---|
| Чтение главы | +10-15 | Кнопка «Я выполнил» |
| Челлендж 🟢 | +20 | Успешная проверка |
| Челлендж 🟡 | +35 | Успешная проверка |
| Челлендж 🔴 | +50 | Успешная проверка |
| Финальный спринт | +100 | Все требования выполнены |
| Подсказка | -5 | Раскрытие подсказки |

### 8.2. Уровни

Каждые 500 XP = новый уровень. 20 уровней:

| Уровень | Название | XP |
|---|---|---|
| 1-5 | Новичок | 0–2500 |
| 6-10 | Разработчик | 2500–5000 |
| 11-15 | Инженер | 5000–7500 |
| 16-20 | Архитектор | 7500–10000 |

### 8.3. Бейджи (15-20 штук)

| Категория | Примеры |
|---|---|
| Прогресс | «Первый шаг» (P1 Ch1), «Полумесяц» (50% курса) |
| Челленджи | «Все 🟢 P1», «Решатель 🔴» (5 экспертных) |
| Стрик | «7 дней подряд», «30 дней подряд» |
| Проекты | «Кликер-мастер» (P1 завершён), «C++ мастер» (P4+) |
| Специальные | «Ночь совы» (учёба после полуночи), «Скоростной» (челлендж за < 2 мин) |

---

## 9. Система челленджей

### 9.1. Формат JSON-челленджа

```json
{
  "id": "p1-ch2-signal-connect",
  "projectSlug": "project-1-clicker",
  "chapterSlug": "chapter-02-signals",
  "difficulty": "green",
  "title": "Подключение сигнала",
  "description": "Подключите сигнал `pressed` кнопки к обработчику...",
  "starterCode": "extends Control\n\nfunc _ready():\n  # Подключите сигнал кнопки\n  pass\n\nfunc _on_button_pressed():\n  counter += 1",
  "testCases": [
    { "input": {}, "expected": "signal_connected", "description": "Сигнал подключён" },
    { "input": { "presses": 5 }, "expected": { "counter": 5 }, "description": "Счётчик увеличивается" }
  ],
  "hints": [
    { "text": "Используйте .connect()", "xpPenalty": 5 },
    { "text": "$Button.pressed.connect(_on_button_pressed)", "xpPenalty": 10 }
  ],
  "solutionCode": "extends Control\n\nvar counter = 0\n\nfunc _ready():\n  $Button.pressed.connect(_on_button_pressed)\n\nfunc _on_button_pressed():\n  counter += 1",
  "xp": 20
}
```

### 9.2. Архитектура проверки

На этапе MVP используется mock-выполнение (Variant C из program-concept.md): проверка через AST-матчинг и регулярные выражения, а не через полноценный GDScript runtime. Это позволяет валидировать решения без сложной WASM-инфраструктуры.

```
Пользователь нажимает «Проверить»
        │
        ▼
Server Action: submitChallenge(challengeId, code)
        │
        ├── Извлечение testCases из JSON
        ├── Парсинг кода на базовые паттерны
        ├── Проверка наличия ключевых конструкций
        ├── Сравнение с эталонными паттернами
        │
        ▼
Результат: { passed, testsPassed, testsTotal, xpEarned }
```

---

## 10. Производительность

### 10.1. Стратегия загрузки

| Ресурс | Стратегия | Обоснование |
|---|---|---|
| MDX-контент глав | Static Generation | Контент не меняется между деплоями |
| Прогресс пользователя | SSR + TanStack Query | Персонализированные данные |
| Monaco Editor | Dynamic import + SSR: false | Тяжёлый (~2 MB), нужен только на страницах челленджей |
| Mermaid-диаграммы | Server-side рендеринг в SVG | Избежание клиентского JS для диаграмм |
| Изображения | next/image с оптимизацией | Автоматический WebP, ленивая загрузка |

### 10.2. Целевые метрики

| Метрика | Цель | Метод достижения |
|---|---|---|
| First Contentful Paint | < 1.5 сек | SSG лендинга, минимальный JS |
| Largest Contentful Paint | < 2.5 сек | Оптимизация изображений, стриминг |
| Time to Interactive | < 3 сек | Dynamic import для Monaco |
| Lighthouse Performance | > 80 | Все вышеперечисленное |
| Bundle Size (First Load) | < 200 KB | Server Components, code splitting |

---

## 11. Безопасность

| Аспект | Реализация |
|---|---|
| Валидация входных данных | Zod-схемы во всех Server Actions и API Routes |
| CSRF-защита | Автоматическая в Next.js Server Actions |
| Rate Limiting | Middleware для API-эндпоинтов (100 req/min) |
| Санитизация | DOMPurify для пользовательского HTML-ввода |
| SQL Injection | Prisma ORM с параметризованными запросами |
| XSS | React автоматически экранирует, + CSP заголовки |

---

## 12. Фаза 2: Расширения архитектуры

Компоненты, добавляемые в Phase 2 (Godot Web Editor):

```
┌────────────────────────────────────────────────────┐
│  Godot Web Editor (iframe)                         │
│  - Docker + Nginx с COOP/COEP заголовками         │
│  - WASM-файлы Godot Editor                         │
│  - PostMessage API для связи с платформой          │
└───────────────────────┬────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────┐
│  Сервис-слой (Phase 2)                             │
│  - EditorService (управление сессиями)             │
│  - SubmissionService (автопроверка через GUT)      │
│  - S3 / MinIO (файлы проектов .tscn, .gd, .tres)  │
└────────────────────────────────────────────────────┘
```

Данные расширения не влияют на MVP-архитектуру и добавляются как отдельные модули.

---

## Связанные документы

| Документ | Описание |
|---|---|
| [program-concept.md](./program-concept.md) | Концепция платформы (фазы, модели подписок) |
| [program-roadmap.md](./program-roadmap.md) | Роадмап разработки (спринты, задачи) |
| [rules.md](./rules.md) | Правила разработки (конвенции, паттерны) |
| [tech-debt.md](./tech-debt.md) | Реестр технического долга |
| [course-roadmap.md](./course-roadmap.md) | Роадмап контента курса |
