# Инструкция по разработке Godot Learning Platform

## Архитектура рабочего процесса

Проект использует **двухдиректорийную модель** для совместимости с Live Preview:

```
/home/z/godot-learning-app/    ← Git-репозиторий (источник истины)
         ↓ sync-to-preview.sh
/home/z/my-project/            ← Рабочая директория песочницы (Live Preview)
         ↓ sync-from-preview.sh
/home/z/godot-learning-app/    ← Обратно в git-репозиторий
```

### Почему две директории?

Live Preview в песочнице Z.ai работает **только** с `/home/z/my-project/`. Но для git-коммитов нужна отдельная директория с `.git`. Решение — разработка в песочнице с последующей синхронизацией в git-репозиторий.

---

## Настройка окружения (первый запуск)

```bash
# 1. Клонировать git-репозиторий (если ещё не клонирован)
cd /home/z
git clone https://github.com/Angelionix/Godot_Learning.git godot-learning-app

# 2. Скопировать проект в рабочую директорию песочницы
cp -r /home/z/godot-learning-app/ /home/z/my-project/
cd /home/z/my-project

# 3. Установить зависимости
npm install

# 4. Собрать и запустить
npx next build
npx next start -p 3000
```

---

## Ежедневный цикл разработки

### Вариант A: Разработка в песочнице (рекомендуется)

1. **Пишете код** в `/home/z/my-project/` — Live Preview обновляется автоматически
2. **Запускаете тесты**: `npx vitest run`
3. **Синхронизируете** изменения обратно в git-репозиторий:
   ```bash
   bash /home/z/godot-learning-app/scripts/sync-from-preview.sh
   ```
4. **Коммитите и пушите** из git-репозитория:
   ```bash
   cd /home/z/godot-learning-app
   git add .
   git commit -m "feat: описание изменений"
   git push origin main
   ```

### Вариант B: Разработка в git-репозитории

1. **Пишете код** в `/home/z/godot-learning-app/`
2. **Синхронизируете** в рабочую директорию для проверки:
   ```bash
   bash /home/z/godot-learning-app/scripts/sync-to-preview.sh
   ```
3. **Проверяете** через Live Preview
4. **Коммитите и пушите** из git-репозитория

---

## Скрипты синхронизации

### `scripts/sync-to-preview.sh`
Копирует файлы из git-репозитория в рабочую директорию песочницы. Исключает `node_modules/`, `.next/`, `db/`, `.git/`.

### `scripts/sync-from-preview.sh`
Копирует файлы из рабочей директории песочницы обратно в git-репозиторий. Исключает `node_modules/`, `.next/`, `db/`, `.git/`.

---

## Полезные команды

### Разработка
```bash
# Сборка production-билда
npx next build

# Запуск production-сервера
npx next start -p 3000

# Запуск тестов
npx vitest run

# Запуск тестов в watch-режиме
npx vitest

# Запуск конкретного теста
npx vitest run src/__tests__/validators.test.ts
```

### Git
```bash
cd /home/z/godot-learning-app

# Статус
git status

# Добавить все изменения
git add .

# Коммит
git commit -m "тип: описание"

# Пуш
git push origin main

# Пуш с токеном (если обычный пуш не работает)
git push https://github_pat_ТОКЕН@github.com/Angelionix/Godot_Learning.git main
```

### Prisma
```bash
# Генерация клиента
npx prisma generate

# Миграция БД
npx prisma db push

# Заполнение тестовыми данными
npx prisma db seed
```

---

## Структура проекта

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Главная страница
│   ├── layout.tsx            # Root layout (Header + Sidebar + Footer)
│   ├── learn/
│   │   ├── page.tsx          # Страница обучения (все проекты)
│   │   └── [project]/
│   │       ├── page.tsx      # Страница проекта (список глав)
│   │       └── [chapter]/
│   │           ├── page.tsx  # Страница главы (MDX-рендеринг)
│   │           └── toc-wrapper.tsx
│   ├── dashboard/
│   │   └── page.tsx          # Дашборд прогресса
│   └── api/progress/         # API прогресса
├── components/
│   ├── mdx/                  # MDX-компоненты (Insight, Callout, Challenge, Sprint, Bridge, MermaidDiagram, CodeBlock, TOC)
│   ├── layout/               # Layout-компоненты (Header, Sidebar, Footer, MobileBottomNav)
│   ├── ui/                   # shadcn/ui компоненты
│   └── chapter-complete-button.tsx
├── lib/
│   ├── content.ts            # Загрузка MDX-контента из файловой системы
│   ├── chapter-data.ts       # Статические данные глав (shared server/client)
│   ├── projects.ts           # Определения 6 проектов
│   ├── extract-headings.ts   # Извлечение заголовков для TOC
│   ├── prisma.ts / db.ts     # Prisma-клиент
│   └── utils.ts              # cn() утилита
├── actions/                  # Server Actions
├── repositories/             # Слой работы с БД
├── validators/               # Zod-схемы валидации
├── store/                    # Zustand-сторы
├── providers/                # React-провайдеры (Theme, Query)
└── __tests__/                # Тесты (Vitest)
```

---

## Правила разработки

1. **Язык**: Весь UI и контент на русском языке
2. **Godot**: GDScript → C++/GDExtension, **NO C#**
3. **MDX**: Весь учебный контент в `content/projects/` с `_meta.json`
4. **Компоненты**: Используем shadcn/ui + кастомные MDX-компоненты
5. **Стили**: Tailwind CSS + `@tailwindcss/typography` для prose-контента
6. **Таблицы**: Обязательно `remark-gfm` для GFM-таблиц в MDX
7. **Тесты**: Покрывать критические пути (валидаторы, контент-система, XP-расчёты)
8. **XP**: Использовать значения из `_meta.json`, НЕ хардкодить

---

## Частые проблемы

### Live Preview показывает логотип Z.ai
Убедитесь, что проект находится в `/home/z/my-project/` и запущен `next build` + `next start`.

### Таблицы в MDX не рендерятся
Проверьте, что `remark-gfm` подключён в `mdxOptions.remarkPlugins` на странице главы.

### Стили prose не работают
Проверьте, что `@tailwindcss/typography` подключён в `tailwind.config.ts` и класс `prose` используется в article.

### XP начисляется неправильно
Проверьте, что `markChapterCompleteAction()` получает `xp` из `_meta.json` через `ChapterCompleteButton`.
