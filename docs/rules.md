# Правила разработки — Godot Learning Platform

> Документ описывает стандарты, конвенции и правила, обязательные для всех участников проекта Godot Learning Platform — веб-приложения для курса разработки игр на Godot.

---

## Содержание

1. [Общие правила разработки](#1-общие-правила-разработки)
2. [Архитектурные правила](#2-архитектурные-правила)
3. [Паттерны проектирования](#3-паттерны-проектирования)
4. [React/Next.js лучшие практики](#4-reactnextjs-лучшие-практики)
5. [UI/UX правила](#5-uiux-правила)
6. [Правила работы с данными](#6-правила-работы-с-данными)
7. [Безопасность](#7-безопасность)
8. [Git правила](#8-git-правила)
9. [Документация](#9-документация)

---

## 1. Общие правила разработки

### TypeScript

- **Strict mode** включён глобально для всего проекта — `strict: true` в `tsconfig.json`.
- Запрещено использование `any`. Исключения требуют отдельного согласования и комментария `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
- Предпочтение `interface` для объектов, `type` для объединений и утилитарных типов.
- Все публичные функции должны иметь явную типизацию аргументов и возвращаемого значения.

```jsonc
// tsconfig.json — обязательные настройки
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Линтинг и форматирование

- **ESLint** + **Prettier** обязательны. Проект не собирается при наличии lint-ошибок.
- Конфигурация Prettier единая для всей команды (`.prettierrc` в корне).
- Хуки pre-commit через `lint-staged` + `husky` проверяют форматирование автоматически.

```jsonc
// .prettierrc — базовая конфигурация
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Коммит-конвенция

Все коммиты следуют [Conventional Commits](https://www.conventionalcommits.org/):

| Тип        | Назначение                          |
|------------|-------------------------------------|
| `feat:`    | Новая функциональность              |
| `fix:`     | Исправление бага                    |
| `docs:`    | Изменения в документации            |
| `refactor:`| Рефакторинг без изменения поведения |
| `chore:`   | Сборка, зависимости, конфиги        |
| `test:`    | Добавление/обновление тестов        |
| `style:`   | Форматирование, пробелы (без логики)|

```bash
# Примеры
feat(course): добавлена страница списка курсов
fix(auth): исправлен редирект после входа
docs(rules): обновлены правила разработки
```

### Код-ревью

- **Код-ревью обязательны** для слияния любой ветки в `main`.
- Минимум 1 аппрув от ревьюера перед merge.
- Автор PR самостоятельно назначает ревьюеров.
- PR должен содержать описание изменений и ссылку на задачу (при наличии).

### Тестирование

- **Минимум 80% test coverage** для бизнес-логики.
- Unit-тесты — Vitest.
- Integration/E2E — Playwright.
- Критические пути (оплата, аутентификация, прогресс курса) покрываются E2E-тестами обязательно.
- Тесты запускаются в CI; падение тестов блокирует merge.

---

## 2. Архитектурные правила

### Next.js 16 App Router

- **Server Components по умолчанию.** Каждый компонент считается серверным, пока не доказана необходимость клиента.
- Директива `'use client'` добавляется **только** когда это действительно необходимо:
  - Использование хуков (`useState`, `useEffect`, `useReducer` и т.д.)
  - Обработчики событий (`onClick`, `onChange` и т.д.)
  - Браузерные API (`window`, `localStorage`, `IntersectionObserver`)

```tsx
// ❌ Плохо — клиентский без необходимости
'use client';

export function CourseTitle({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

// ✅ Хорошо — серверный компонент
export function CourseTitle({ title }: { title: string }) {
  return <h1>{title}</h1>;
}
```

### Разделение ответственности

| Слой                    | Назначение                                         |
|-------------------------|----------------------------------------------------|
| **UI (компоненты)**     | Отображение и только отображение                   |
| **Server Actions**      | Мутации данных (создание, обновление, удаление)    |
| **API Routes**          | Внешние клиенты, вебхуки, интеграции               |
| **Data Access (Prisma)**| Типобезопасный доступ к БД через Repository       |
| **DB**                  | Схема данных, миграции                             |

### Правило: запрет прямой работы с БД из компонентов

```tsx
// ❌ Плохо — прямой вызов Prisma из компонента
import { prisma } from '@/lib/prisma';

export async function CourseList() {
  const courses = await prisma.course.findMany(); // ЗАПРЕЩЕНО
  return <ul>{courses.map(c => <li key={c.id}>{c.title}</li>)}</ul>;
}

// ✅ Хорошо — через Repository
import { courseRepository } from '@/repositories/course.repository';

export async function CourseList() {
  const courses = await courseRepository.findAll();
  return <ul>{courses.map(c => <li key={c.id}>{c.title}</li>)}</ul>;
}
```

### Структура директорий

```
src/
├── app/                  # App Router (маршруты)
│   ├── (auth)/           # Группа маршрутов авторизации
│   ├── courses/          # Страницы курсов
│   └── api/              # API Routes (внешние клиенты)
├── components/           # UI-компоненты
│   ├── ui/               # Базовые shadcn/ui компоненты
│   └── features/         # Фича-компоненты
├── actions/              # Server Actions
├── repositories/         # Repository Pattern (Data Access)
├── services/             # Бизнес-логика (если сложнее action)
├── lib/                  # Утилиты, хелперы
├── stores/               # Zustand stores
├── hooks/                # Кастомные React-хуки
├── types/                # Глобальные TypeScript типы
└── validators/           # Zod-схемы валидации
```

---

## 3. Паттерны проектирования

### Repository Pattern

Каждая сущность данных имеет свой Repository — единственную точку доступа к данным этой сущности.

```ts
// repositories/course.repository.ts
import { prisma } from '@/lib/prisma';
import { type Course, type CourseId } from '@/types';

export const courseRepository = {
  async findAll(): Promise<Course[]> {
    return prisma.course.findMany({ where: { deletedAt: null } });
  },

  async findById(id: CourseId): Promise<Course | null> {
    return prisma.course.findUnique({ where: { id } });
  },

  async create(data: CreateCourseInput): Promise<Course> {
    return prisma.course.create({ data });
  },

  // ... update, softDelete и т.д.
};
```

### Server Actions как Application Layer

Server Actions инкапсулируют бизнес-логику и валидацию. Они — промежуточный слой между UI и репозиторием.

```ts
// actions/course.action.ts
'use server';

import { courseRepository } from '@/repositories/course.repository';
import { createCourseSchema } from '@/validators/course.validator';
import { revalidatePath } from 'next/cache';

export async function createCourse(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const validated = createCourseSchema.parse(raw); // Zod-валидация

  const course = await courseRepository.create(validated);
  revalidatePath('/courses');

  return { success: true, data: course };
}
```

### Zustand для клиентского состояния

Zustand используется для **клиентского** UI-состояния: открытые панели, выбранные элементы интерфейса, локальные настройки.

```ts
// stores/editor-store.ts
import { create } from 'zustand';

interface EditorState {
  activeFile: string | null;
  isSidebarOpen: boolean;
  setActiveFile: (file: string) => void;
  toggleSidebar: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeFile: null,
  isSidebarOpen: true,
  setActiveFile: (file) => set({ activeFile: file }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
```

### TanStack Query для server state caching

Все данные с сервера кэшируются через TanStack Query. Запросы — в Server Components или через `useQuery`, мутации — через Server Actions + `useTransition` / optimistic updates.

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { courseRepository } from '@/repositories/course.repository';

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseRepository.findById(id),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}
```

### Composition over inheritance

UI-компоненты строятся через композицию, а не наследование. Используем `children`, render props и слоты.

```tsx
// ❌ Плохо — наследование
class BaseCard extends Component {}
class CourseCard extends BaseCard {}

// ✅ Хорошо — композиция
function Card({ children, className }: CardProps) {
  return <div className={cn('rounded-lg border p-4', className)}>{children}</div>;
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader title={course.title} />
      <CardProgress value={course.progress} />
    </Card>
  );
}
```

### Фабричные методы для сложных объектов

Для создания объектов с нетривиальной логикой инициализации используем фабричные функции.

```ts
// lib/factories/lesson.factory.ts
import { type Lesson, LessonType } from '@/types';

export function createLesson(type: LessonType, overrides?: Partial<Lesson>): Lesson {
  const defaults: Record<LessonType, Partial<Lesson>> = {
    [LessonType.Video]:    { duration: 0,  hasSubtitles: false },
    [LessonType.Text]:     { content: '',  wordCount: 0 },
    [LessonType.Quiz]:     { questions: [], passingScore: 70 },
    [LessonType.CodeExercise]: { starterCode: '', solutionCode: '', language: 'gdscript' },
  };

  return { ...defaults[type], ...overrides, type } as Lesson;
}
```

---

## 4. React/Next.js лучшие практики

### Server Components по умолчанию

- Каждый новый компонент создаётся как Server Component.
- Данные запрашиваются напрямую в серверном компоненте (через Repository).
- `'use client'` — только при доказанной необходимости (см. раздел 2).

### Suspense boundaries

Все асинхронные серверные компоненты оборачиваются в `<Suspense>` для стриминга и graceful loading.

```tsx
import { Suspense } from 'react';

export default function CoursesPage() {
  return (
    <main>
      <h1>Курсы</h1>
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList />
      </Suspense>
    </main>
  );
}
```

### Error boundaries на уровне маршрутов

Каждый маршрут имеет свой `error.tsx` для обработки ошибок рендеринга.

```tsx
// app/courses/error.tsx
'use client';

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}
```

### Streaming для больших страниц

Длинные страницы разбиваются на секции, каждая оборачивается в свой `<Suspense>`. Это позволяет отдавать пользователю контент по частям, не дожидаясь загрузки всех данных.

```tsx
export default function DashboardPage() {
  return (
    <main>
      <DashboardHeader />                     {/* Быстрый, без Suspense */}
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />                         {/* Может загружаться дольше */}
      </Suspense>
      <Suspense fallback={<ProgressSkeleton />}>
        <CourseProgress />                    {/* Зависит от данных прогресса */}
      </Suspense>
    </main>
  );
}
```

### Оптимистичные обновления для UX

Мутации, влияющие на UX, используют оптимистичные обновления: UI обновляется мгновенно, откат при ошибке.

```tsx
'use client';

import { useTransition } from 'react';
import { completeLesson } from '@/actions/lesson.action';

function LessonCompleteButton({ lessonId }: { lessonId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => completeLesson(lessonId))}
    >
      {isPending ? 'Сохраняем...' : 'Отметить как пройденное'}
    </button>
  );
}
```

### Динамические импорты для тяжёлых компонентов

Монолитные тяжёлые зависимости (Monaco Editor, видео-плееры, 3D-визуализации) загружаются динамически.

```tsx
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('@/components/features/CodeEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const VideoPlayer = dynamic(() => import('@/components/features/VideoPlayer'), {
  loading: () => <VideoSkeleton />,
});
```

---

## 5. UI/UX правила

### Компонентная база — shadcn/ui

- **shadcn/ui** — стандартный набор UI-компонентов проекта.
- Кастомизация через `components.json` и Tailwind-переменные, а не через изменение исходников shadcn.
- Новые компоненты сначала проверяются на наличие в shadcn/ui; если подходят — берутся оттуда.

### Tailwind CSS 4

- Утилитарный подход: стили через классы Tailwind, **никаких кастомных CSS** без острой необходимости.
- Кастомные значения — через CSS-переменные в `globals.css` (токены дизайна), не через инлайн-стили.
- Запрещён `@apply` в CSS-файлах для логики, которую можно выразить утилитами.

```tsx
// ❌ Плохо — кастомный CSS
// styles/card.css
.card { border-radius: 8px; padding: 16px; }

// ✅ Хорошо — Tailwind утилиты
<div className="rounded-lg p-4">...</div>
```

### Мобильный-first адаптив

- Разработка начинается с мобильных экранов, затем масштабируется вверх.
- Контрольные точки: `sm` (640px) → `md` (768px) → `lg` (1024px) → `xl` (1280px).

```tsx
// ✅ Мобильный-first: базовые стили для мобильных, адаптация вверх
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {courses.map(course => <CourseCard key={course.id} course={course} />)}
</div>
```

### Тёмная/светлая тема

- Реализация через `next-themes`.
- Все цвета используют CSS-переменные с вариантами `--background`, `--foreground` и т.д.
- Переключатель темы доступен в навигации.

```tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

### Доступность (Accessibility)

- **ARIA-атрибуты** для интерактивных элементов без семантического HTML.
- **Keyboard navigation**: все интерактивные элементы доступны с клавиатуры (`Tab`, `Enter`, `Escape`).
- **Screen readers**: значимые тексты в `alt`, `aria-label`, `aria-describedby`.
- Фокус-индикаторы видимые и контрастные.
- Проверка через Lighthouse (минимум 90 баллов Accessibility).

```tsx
// ✅ Доступная кнопка закрытия диалога
<button
  type="button"
  aria-label="Закрыть диалог"
  onClick={onClose}
  className="rounded-md p-2 focus-visible:ring-2 focus-visible:ring-ring"
>
  <XIcon className="h-4 w-4" />
</button>
```

### Минимум 44px для touch-целей

Все интерактивные элементы (кнопки, ссылки, чекбоксы) имеют минимальный размер области нажатия **44×44px**.

```tsx
// ❌ Плохо — слишком маленькая кнопка
<button className="p-1">
  <Icon className="h-3 w-3" />
</button>

// ✅ Хорошо — минимальная touch-цель 44px
<button className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
  <Icon className="h-5 w-5" />
</button>
```

---

## 6. Правила работы с данными

### Prisma ORM

- **Все операции с БД** осуществляются исключительно через Prisma.
- Сырые SQL-запросы (`prisma.$queryRaw`) допускаются только при невозможности выразить запрос через Prisma Client и требуют комментария с обоснованием.
- Схема данных — в `prisma/schema.prisma`, изменения — через миграции.

```bash
# Создание миграции
npx prisma migrate dev --name add_course_progress

# Применение миграций в production
npx prisma migrate deploy
```

### SQLite / PostgreSQL

| Окружение   | БД         | Причина                            |
|-------------|------------|-------------------------------------|
| Разработка  | SQLite     | Быстрый старт, нулевая конфигурация |
| Production  | PostgreSQL | Надёжность, масштабируемость, JSONB |

- Конфигурация через переменные окружения `DATABASE_URL`.
- Схема Prisma совместима с обеими БД; специфичные конструкции — через `@@map` и условные блоки.

### Валидация через Zod

**Все входные данные** валидируются через Zod-схемы — на уровне Server Actions, API Routes и форм.

```ts
// validators/course.validator.ts
import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(200, 'Максимум 200 символов'),
  description: z.string().min(10, 'Минимум 10 символов'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()).max(10, 'Максимум 10 тегов').default([]),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
```

### Транзакции для множественных операций

Если бизнес-операция затрагивает несколько записей или таблиц, она выполняется в транзакции.

```ts
// repositories/enrollment.repository.ts
export const enrollmentRepository = {
  async enroll(userId: string, courseId: string) {
    return prisma.$transaction(async (tx) => {
      // Создаём запись о зачислении
      const enrollment = await tx.enrollment.create({
        data: { userId, courseId, status: 'active' },
      });

      // Обновляем счётчик студентов на курсе
      await tx.course.update({
        where: { id: courseId },
        data: { studentCount: { increment: 1 } },
      });

      return enrollment;
    });
  },
};
```

### Soft delete для пользовательских данных

Пользовательские данные (курсы, прогресс, комментарии) не удаляются физически. Используется паттерн soft delete с полем `deletedAt`.

```prisma
model Course {
  id        String    @id @default(cuid())
  title     String
  // ...
  deletedAt DateTime? // Soft delete: null = активный, дата = удалённый
}

@@index([deletedAt]) // Индекс для быстрых запросов активных записей
```

```ts
// В Repository — фильтрация удалённых записей
async findAll() {
  return prisma.course.findMany({
    where: { deletedAt: null },
  });
}

async softDelete(id: string) {
  return prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

---

## 7. Безопасность

### Server Actions с CSRF-защитой

Next.js автоматически добавляет CSRF-токены для Server Actions. Дополнительные меры:

- Проверка `Origin` заголовка для всех мутаций.
- Запрет на вызов Server Actions из других доменов.

```ts
// Пример проверки в Server Action
'use server';

import { headers } from 'next/headers';

export async function deleteCourse(id: string) {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');

  if (origin && !origin.includes(host ?? '')) {
    throw new Error('Недопустимый источник запроса');
  }

  // ... логика удаления
}
```

### Валидация всех входных данных

- **Никогда не доверяем** данным от клиента.
- Каждый Server Action и API Route валидирует входные данные через Zod.
- Ошибка валидации =拒绝 запроса с кодом 400.

```ts
// ❌ Плохо — без валидации
export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string; // НЕБЕЗОПАСНО
}

// ✅ Хорошо — Zod-валидация
export async function updateProfile(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = updateProfileSchema.parse(raw); // Бросит ошибку при невалидных данных
}
```

### Rate limiting для API

Все публичные API-эндпоинты защищены rate limiting'ом.

```ts
// middleware.ts — пример с простым rate limiter
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (record && record.resetTime > now && record.count >= 100) {
      return NextResponse.json({ error: 'Слишком много запросов' }, { status: 429 });
    }

    // Обновляем счётчик
    rateLimitMap.set(ip, {
      count: (record?.count ?? 0) + 1,
      resetTime: record?.resetTime ?? now + 60_000,
    });
  }

  return NextResponse.next();
}
```

### Санитизация пользовательского ввода

- Текстовый ввод, отображаемый как HTML, обязательно санитизируется (библиотека `dompurify` или аналоги).
- Rich-text контент проходит через серверную санитизацию перед сохранением.

```ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
```

### HTTPS обязательно

- Production-окружение работает **только** по HTTPS.
- HSTS-заголовки включены.
- Перенаправление HTTP → HTTPS на уровне инфраструктуры (reverse proxy / CDN).

---

## 8. Git правила

### Стратегия ветвления

```
main ──────────────────────────────────────●──●──●── (стабильный production)
     \                                  /
develop ────────────●──●──●──●───────●●─●── (интеграция)
        \          /    \      \    /
         ●──●──●─●      ●──●──●──●
         feature/auth   feature/editor   feature/quiz
```

| Ветка          | Назначение                                     |
|----------------|------------------------------------------------|
| `main`         | Стабильная, деплоится в production             |
| `develop`      | Интеграционная ветка для тестирования           |
| `feature/*`    | Разработка конкретной фичи                     |
| `hotfix/*`     | Срочные исправления в production               |
| `bugfix/*`     | Несрочные исправления багов                    |

### Правила работы с ветками

- **`main`** — всегда стабильная. Прямые коммиты запрещены.
- **`develop`** — ветка интеграции. Все фичи сливаются сюда.
- **`feature/*`** — создаётся от `develop`, название в kebab-case: `feature/course-editor`, `feature/auth-flow`.
- **`hotfix/*`** — создаётся от `main`, после фикса сливается обратно в `main` **и** `develop`.

### Pull Request правила

- **PR обязателен** для слияния в `main` и `develop`.
- Минимум 1 аппрув.
- CI-пайплайн должен быть зелёным.
- PR включает описание:
  - Что сделано
  - Зачем (ссылка на задачу)
  - Как проверить (шаги тестирования)
  - Скриншоты (для UI-изменений)

### Squash merge

- **Squash merge** для `feature/* → develop` — один чистый коммит.
- **Merge commit** для `develop → main` — сохраняем историю интеграции.

```bash
# Feature → develop: squash
git checkout develop
git merge --squash feature/course-editor
git commit -m "feat(course): добавлен редактор курсов"

# Develop → main: merge commit
git checkout main
git merge --no-ff develop
```

---

## 9. Документация

### Принцип: каждая фича = документ

При добавлении новой функциональности в `docs/` создаётся документ с описанием:

- Цель и контекст фичи
- Архитектурные решения
- Используемые паттерны
- API-контракты
- Известные ограничения

```
docs/
├── rules.md                 # Этот документ
├── architecture.md          # Общая архитектура проекта
├── auth.md                  # Аутентификация и авторизация
├── course-system.md         # Система курсов
├── code-editor.md           # Встроенный редактор кода
├── progress-tracking.md     # Отслеживание прогресса
└── deployment.md            # Процесс деплоя
```

### README.md актуален всегда

- `README.md` содержит актуальные инструкции: запуск, установка, скрипты, переменные окружения.
- Обновляется при каждом изменении процесса настройки проекта.

### JSDoc для публичных функций

Все экспортируемые функции, хуки и утилиты документируются через JSDoc.

```ts
/**
 * Вычисляет прогресс прохождения курса на основе завершённых уроков.
 *
 * @param completedLessons - Количество пройденных уроков
 * @param totalLessons - Общее количество уроков в курсе
 * @returns Прогресс в процентах (0–100), округлённый до целого
 *
 * @example
 * ```ts
 * const progress = calculateProgress(7, 14); // 50
 * ```
 */
export function calculateProgress(completedLessons: number, totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}
```

### API-документация

- При использовании tRPC — документация генерируется автоматически из типов.
- При использовании REST API Routes — OpenAPI/Swagger спецификация.
- Все эндпоинты описаны: путь, метод, тело запроса, ответ, коды ошибок.

```ts
// Пример описания API Route
/**
 * GET /api/courses
 *
 * Возвращает список доступных курсов.
 *
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 20, max: 100)
 *   - difficulty: 'beginner' | 'intermediate' | 'advanced'
 *
 * Response 200:
 *   { courses: Course[], total: number, page: number }
 *
 * Response 400:
 *   { error: string }
 */
```

---

## Чеклист перед PR

Перед созданием Pull Request убедитесь, что:

- [ ] TypeScript компилируется без ошибок (`tsc --noEmit`)
- [ ] ESLint и Prettier не выдают ошибок
- [ ] Тесты проходят (`vitest run`)
- [ ] Test coverage бизнес-логики ≥ 80%
- [ ] Новые функции покрыты JSDoc
- [ ] Документация в `docs/` обновлена (если применимо)
- [ ] Проверена работа в тёмной и светлой теме
- [ ] Проверена мобильная адаптация
- [ ] Доступность: keyboard nav, ARIA, touch-цели ≥ 44px
- [ ] Входные данные валидируются через Zod
- [ ] Нет прямых обращений к БД из компонентов

---

*Документ последний раз обновлён: март 2026*
