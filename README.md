# Godot Learning Platform

Платформа для изучения разработки игр на Godot 4.3+ (GDScript → C++/GDExtension).

## Технологии

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **База данных**: SQLite (Prisma ORM)
- **Редактор кода**: Monaco Editor с GDScript-токенайзером
- **Контент**: MDX (next-mdx-remote + rehype-pretty-code)
- **Геймификация**: XP, уровни, 24 бейджа, стрик-календарь, радар навыков
- **Инфраструктура**: Docker + Nginx + MinIO (S3)

## Быстрый старт

### Требования

- **Bun** >= 1.3 (рекомендуется) или Node.js >= 20
- **Docker** + Docker Compose (для MinIO и Godot Editor)

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Angelionix/Godot_Learning.git
cd Godot_Learning

# 2. Создать .env из примера
cp .env.example .env

# 3. Установить зависимости
bun install

# 4. Инициализировать базу данных
bun run db:push

# 5. Запустить MinIO (хранилище файлов проектов)
docker compose up -d minio minio-init

# 6. Запустить dev-сервер
bun run dev
```

Приложение будет доступно на **http://localhost:3000**

### MinIO Console

После запуска MinIO консоль доступна на **http://localhost:9001**
- Логин: `minioadmin`
- Пароль: `minioadmin`

### Docker (полный стек)

```bash
# Запустить всё (app + MinIO + Nginx + Godot Editor)
docker compose up -d

# Логи приложения
docker compose logs -f app

# Остановка
docker compose down
```

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (progress, challenges, editor, submit)
│   ├── dashboard/          # Дашборд прогресса
│   ├── editor/             # Godot Web Editor интеграция
│   ├── learn/              # Страницы обучения (проекты + главы)
│   └── playground/         # Код-плейграунд с Monaco
├── components/
│   ├── mdx/                # MDX-компоненты (GoalsList, Callout, Challenge и др.)
│   ├── editor/             # Компоненты редактора
│   ├── gamification/       # XP, бейджи, стрики
│   ├── layout/             # Header, Sidebar, Footer
│   ├── playground/         # GDScript-плейграунд
│   └── ui/                 # shadcn/ui компоненты
├── lib/                    # Утилиты (prisma, s3, content, interpreter)
├── repositories/           # Data access layer
├── store/                  # Zustand stores
├── hooks/                  # Custom React hooks
├── validators/             # Zod-схемы
└── __tests__/              # Vitest тесты

content/                    # MDX-контент курсов
├── projects/
│   ├── project-1-clicker/  # P1: Clicker/Idle Game (8 глав — полный)
│   ├── project-2-space-shooter/   # P2: Space Shooter (7 глав)
│   ├── project-3-metroidvania/    # P3: Metroidvania (7 глав)
│   ├── project-4-tower-defense/   # P4: Tower Defense (7 глав)
│   ├── project-5-3d-adventure/    # P5: 3D Adventure (7 глав)
│   └── project-6-performance-demo/ # P6: Performance Demo (7 глав)

public/editor/templates/    # Godot 4.3+ стартовые шаблоны проектов
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `bun run dev` | Dev-сервер с hot reload |
| `bun run build` | Production-сборка |
| `bun run start` | Запуск production-сервера |
| `bun run lint` | ESLint проверка |
| `bun run test` | Vitest (watch mode) |
| `bun run test:run` | Vitest (одиночный прогон) |
| `bun run test:coverage` | Vitest с покрытием |
| `bun run db:push` | Синхронизировать Prisma-схему с БД |
| `bun run db:generate` | Сгенерировать Prisma Client |
| `bun run db:migrate` | Запустить миграции |
| `bun run db:reset` | Сбросить и пересоздать БД |

## Курсы

| # | Проект | Фокус | Главы |
|---|--------|-------|-------|
| P1 | Clicker/Idle Game | Основы GDScript, UI, таймеры | 8/8 ✅ |
| P2 | Space Shooter | 2D физика, столкновения, VFX | 7/7 |
| P3 | Metroidvania | FSM, стейты, менеджеры, карты | 7/7 |
| P4 | Tower Defense | C++/GDExtension, ECS-паттерн | 7/7 |
| P5 | 3D Adventure | 3D, NavigationAgent3D, квесты | 7/7 |
| P6 | Performance Demo | ECS, профилирование, бенчмарки | 7/7 |

## Версия

Текущая версия: **0.11.0** (см. [CHANGELOG.md](./CHANGELOG.md))
