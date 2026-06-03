# Godot Learning Platform — Инструкция по локальному развёртыванию

Полное руководство по подготовке системы, установке и запуску платформы
обучения Godot на локальной машине, включая интеграцию с Godot Web Editor.

---

## Содержание

1. [Архитектура системы](#1-архитектура-системы)
2. [Требования к системе](#2-требования-к-системе)
3. [Подготовка системы](#3-подготовка-системы)
4. [Установка и запуск (dev-режим)](#4-установка-и-запуск-dev-режим)
5. [Настройка MinIO (хранилище проектов)](#5-настройка-minio-хранилище-проектов)
6. [Интеграция с Godot Web Editor](#6-интеграция-с-godot-web-editor)
7. [Полный Docker-стек (production)](#7-полный-docker-стек-production)
8. [Структура переменных окружения](#8-структура-переменных-окружения)
9. [Проверка работоспособности](#9-проверка-работоспособности)
10. [Устранение неполадок](#10-устранение-неполадок)

---

## 1. Архитектура системы

Платформа состоит из нескольких компонентов, которые взаимодействуют друг с другом:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Браузер пользователя                       │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Next.js App     │  │  Godot Web Editor │  │  MinIO Console │  │
│  │  :3000/:80       │  │  iframe /editor/  │  │  /minio/       │  │
│  └────────┬─────────┘  └────────┬──────────┘  └───────┬────────┘  │
│           │  PostMessage API     │                     │          │
└───────────┼──────────────────────┼─────────────────────┼──────────┘
            │                      │                     │
┌───────────┼──────────────────────┼─────────────────────┼──────────┐
│           ▼                      ▼                     ▼          │
│  ┌────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  Next.js SSR    │   │  Nginx           │   │  MinIO (S3)    │  │
│  │  :3000          │   │  :80             │   │  :9000/:9001   │  │
│  │  - API routes   │   │  - COOP/COEP     │   │  - user-projects│  │
│  │  - SSR/SSG      │   │  - reverse proxy │   │  - templates   │  │
│  │  - SQLite/Prisma│   │  - WASM caching  │   │                │  │
│  └────────────────┘   └──────────────────┘   └────────────────┘  │
│                           Docker Network: godot-network           │
└──────────────────────────────────────────────────────────────────┘
```

**Компоненты:**

| Компонент | Назначение | Порт |
|-----------|-----------|------|
| **Next.js** | Веб-приложение, API, SSR/SSG | 3000 |
| **Nginx** | Reverse proxy, COOP/COEP, кэш | 80, 443 |
| **MinIO** | S3-хранилище файлов проектов | 9000 (API), 9001 (Console) |
| **Godot Editor** | WASM-редактор в браузере | 8080 |

**Ключевое ограничение:** Godot Web Editor использует `SharedArrayBuffer`,
который требует HTTP-заголовки `Cross-Origin-Opener-Policy: same-origin`
и `Cross-Origin-Embedder-Policy: require-corp`. Без этих заголовков
редактор не запустится. В dev-режиме (Next.js без Nginx) эти заголовки
отсутствуют, поэтому Godot Editor работает только через Nginx или Caddy.

---

## 2. Требования к системе

### Минимальные требования (только платформа, без Godot Editor)

| Параметр | Значение |
|----------|----------|
| ОС | Linux (Ubuntu 22.04+), macOS 13+, Windows 11 + WSL2 |
| CPU | 2 ядра |
| RAM | 4 GB |
| Диск | 2 GB свободного места |
| Интернет | Для установки зависимостей npm |

### Рекомендуемые требования (полный стек с Godot Editor)

| Параметр | Значение |
|----------|----------|
| ОС | Linux (Ubuntu 22.04+) или macOS 14+ |
| CPU | 4 ядра |
| RAM | 8 GB |
| Диск | 10 GB (Docker-образы + Godot WASM ~800 MB) |
| Интернет | Стабильное соединение |

### Программное обеспечение

| Программа | Минимальная версия | Рекомендуемая версия | Обязательность |
|-----------|--------------------|----------------------|----------------|
| **Bun** | 1.3+ | 1.3+ (последняя) | Рекомендуется |
| **Node.js** | 20.x+ | 22.x LTS | Альтернатива Bun |
| **Docker** | 24.0+ | 27.x | Для MinIO и Godot Editor |
| **Docker Compose** | 2.20+ | 2.32+ | Для управления контейнерами |
| **Git** | 2.40+ | 2.45+ | Обязательно |
| **curl** | Любая | — | Для health-check |

> **Примечание:** Bun предпочтительнее Node.js — установка зависимостей
> и запуск dev-сервера работают значительно быстрее. Однако `bun run build`
> для production-сборки может работать нестабильно, поэтому в Dockerfile
> используется `npm run build`.

---

## 3. Подготовка системы

### 3.1. Ubuntu / Debian

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка базовых инструментов
sudo apt install -y curl git build-essential

# --- Bun ---
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Проверка
bun --version

# --- Docker ---
# Добавляем официальный репозиторий Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавление текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version
docker compose version
```

### 3.2. macOS

```bash
# --- Homebrew (если не установлен) ---
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# --- Bun ---
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc

# --- Docker Desktop ---
brew install --cask docker

# Запустите Docker Desktop из Launchpad и дождитесь запуска

# Проверка
bun --version
docker --version
docker compose version
```

### 3.3. Windows + WSL2

```powershell
# 1. Установить WSL2 (в PowerShell от имени администратора)
wsl --install -d Ubuntu-22.04

# 2. Перезагрузить компьютер

# 3. Запустить Ubuntu из меню Пуск

# 4. Внутри WSL2 — следовать инструкции для Ubuntu (пункт 3.1)
```

> **Важно для Windows:** Docker Desktop должен быть установлен в Windows
> и настроен на использование WSL2 backend. Убедитесь, что в Docker Desktop
> Settings → Resources → WSL Integration включена интеграция с вашим дистрибутивом.

### 3.4. Проверка готовности системы

```bash
# Все команды должны отработать без ошибок:
bun --version        # >= 1.3
git --version        # >= 2.40
docker --version     # >= 24.0
docker compose version  # >= 2.20
docker run --rm hello-world  # Docker работает корректно
```

---

## 4. Установка и запуск (dev-режим)

### 4.1. Клонирование репозитория

```bash
git clone https://github.com/Angelionix/Godot_Learning.git
cd Godot_Learning
```

### 4.2. Настройка переменных окружения

```bash
# Копируем шаблон конфигурации
cp .env.example .env
```

Файл `.env` содержит все необходимые переменные с безопасными значениями
по умолчанию для локальной разработки. Подробнее — в
[разделе 8](#8-структура-переменных-окружения).

**Минимальный `.env` для запуска без Docker:**

```env
NODE_ENV=development
DATABASE_URL=file:./db/custom.db
```

Если MinIO не запущен, приложение продолжит работать — API файлового
хранилища будет возвращать ошибку, но остальной функционал (курсы,
геймификация, плейграунд) будет доступен.

### 4.3. Установка зависимостей

```bash
bun install
```

Установка занимает 5–15 секунд в зависимости от скорости интернета.
Результат: ~105 пакетов, файл `bun.lock` обновляется автоматически.

### 4.4. Инициализация базы данных

```bash
bun run db:push
```

Эта команда создаёт файл SQLite `db/custom.db` и синхронизирует его
с Prisma-схемой (`prisma/schema.prisma`). При повторном запуске
Prisma проверяет схему и вносит изменения только при необходимости.

### 4.5. Запуск dev-сервера

```bash
bun run dev
```

Dev-сервер запускается на **http://localhost:3000** с горячей перезагрузкой.

**Доступные страницы:**

| URL | Описание |
|-----|----------|
| http://localhost:3000 | Главная страница |
| http://localhost:3000/dashboard | Дашборд прогресса |
| http://localhost:3000/learn | Список курсов |
| http://localhost:3000/learn/project-1-clicker | Курс Clicker Game |
| http://localhost:3000/playground | GDScript-плейграунд |
| http://localhost:3000/editor | Страница редактора |
| http://localhost:3000/profile | Профиль пользователя |

### 4.6. Альтернатива: запуск через Node.js

Если Bun не установлен, можно использовать Node.js:

```bash
npm install
npx prisma db push
npm run dev
```

> **Примечание:** `npm install` работает дольше (30–60 секунд),
> и в репозитории нет `package-lock.json` (проект использует `bun.lock`).
> Поэтому при использовании npm lockfile будет сгенерирован заново.

---

## 5. Настройка MinIO (хранилище проектов)

MinIO — S3-совместимое хранилище, которое используется для хранения
файлов проектов Godot Web Editor и стартовых шаблонов.

### 5.1. Запуск MinIO через Docker

```bash
docker compose up -d minio minio-init
```

Эта команда запускает два контейнера:
- **minio** — сервер хранилища (порт 9000 — API, 9001 — веб-консоль)
- **minio-init** — одноразовый контейнер, который создаёт бакет `user-projects`

### 5.2. Проверка работы MinIO

```bash
# Проверка S3 API
curl http://localhost:9000/minio/health/live
# Ожидаемый ответ: пустой HTTP 200

# Проверка через веб-консоль
# Откройте в браузере: http://localhost:9001
# Логин: minioadmin
# Пароль: minioadmin
```

### 5.3. Загрузка шаблонов проектов

Стартовые шаблоны проектов Godot находятся в директории
`public/editor/templates/`. Они доступны через API, но для
полной интеграции с Godot Web Editor их нужно загрузить в MinIO:

```bash
# Установка mc (MinIO Client), если не установлен
curl -sL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Настройка подключения
mc alias set local http://localhost:9000 minioadmin minioadmin

# Создание бакета (если не создан minio-init)
mc mb local/user-projects --ignore-existing

# Загрузка шаблонов
for project in project-1-clicker project-2-space-shooter project-3-metroidvania \
               project-4-tower-defense project-5-3d-adventure project-6-performance-demo; do
  mc cp --recursive public/editor/templates/$project/ local/user-projects/templates/$project/
  echo "Загружен шаблон: $project"
done

# Проверка
mc ls local/user-projects/templates/
```

> **Примечание:** На macOS установите mc через Homebrew: `brew install minio/stable/mc`

### 5.4. Обновление переменных окружения

Убедитесь, что в `.env` указаны правильные параметры подключения к MinIO:

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=user-projects
```

После изменения `.env` перезапустите dev-сервер.

---

## 6. Интеграция с Godot Web Editor

Godot Web Editor — это полноценный редактор Godot, скомпилированный
в WebAssembly (WASM) и работающий прямо в браузере. Это центральный
компонент платформы, позволяющий студентам редактировать код и сцены
без установки десктопного Godot.

### 6.1. Как работает интеграция

Интеграция построена на механизме **PostMessage API** — платформа
и iframe Godot Editor обмениваются типизированными сообщениями:

```
┌────────────────────────┐          PostMessage           ┌──────────────────────┐
│   Next.js App          │◄──────────────────────────────►│  Godot Web Editor    │
│   (parent window)      │                                │  (iframe)            │
│                        │                                │                      │
│  useGodotEditor()      │  godot-learning-load-project   │  Загрузка проекта    │
│  - loadProject()       │  godot-learning-save-project   │  Сохранение проекта  │
│  - saveProject()       │  godot-learning-run-tests      │  Запуск GUT-тестов   │
│  - runTests()          │  godot-learning-get-files       │  Список файлов       │
│  - ping()              │  godot-learning-ping            │  Health check        │
│                        │                                │                      │
│                        │  ◄── godot-editor-ready         │  Редактор загружен   │
│                        │  ◄── godot-editor-pong          │  Ответ на ping       │
│                        │  ◄── godot-editor-project-loaded│  Проект загружен     │
│                        │  ◄── godot-editor-project-saved │  Проект сохранён     │
│                        │  ◄── godot-editor-test-results  │  Результаты тестов   │
│                        │  ◄── godot-editor-error         │  Ошибка              │
└────────────────────────┘                                └──────────────────────┘
```

**Хук `useGodotEditor`** (в `src/hooks/use-godot-editor.ts`) предоставляет
типизированный API для обмена сообщениями с iframe редактора.

### 6.2. Критическое требование: COOP/COEP заголовки

Godot Web Editor использует `SharedArrayBuffer` для многопоточности
в WASM. Браузер предоставляет доступ к `SharedArrayBuffer` **только**
если сервер отправляет специальные HTTP-заголовки:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Без этих заголовков Godot Editor не запустится.** В dev-режиме
(`bun run dev`) Next.js не отправляет эти заголовки, поэтому
редактор будет работать в режиме placeholder (с сообщением
«Редактор недоступен»).

Для полноценной работы Godot Editor необходим Nginx или Caddy,
которые добавляют COOP/COEP заголовки к ответам.

### 6.3. Подготовка Godot Editor WASM-файлов

Godot Web Editor не входит в репозиторий из-за большого размера.
Вам нужно экспортировать его самостоятельно из десктопного Godot.

**Шаг 1. Установите Godot 4.3+**

Скачайте с [официального сайта](https://godotengine.org/download):
- Linux: распакуйте и запустите бинарник
- macOS: установите через Homebrew или скачайте .dmg
- Windows: скачайте .zip и распакуйте

**Шаг 2. Установите шаблоны Web-экспорта**

В десктопном Godot Editor:
1. Откройте **Editor → Manage Export Templates**
2. Нажмите **Download and Install** (требуется интернет)
3. Дождитесь завершения загрузки (~800 MB)

**Шаг 3. Экспорт Web-редактора**

Создайте пустой проект Godot 4.3+ и экспортируйте его как Web-приложение:
1. **Project → Export → Add... → Web**
2. В настройках экспорта включите:
   - **Extension: Not Selected** (не нужен для редактора)
   - **Thread Support: Enabled** (обязательно для SharedArrayBuffer)
3. Нажмите **Export Project**
4. Укажите имя: `godot-editor`

Результат — набор файлов:
```
godot-editor.html
godot-editor.js
godot-editor.wasm
godot-editor.pck
godot-editor.data  (может отсутствовать)
```

> **Альтернатива:** Вы можете использовать предсобранный Godot Web Editor
> из [официального репозитория Godot](https://github.com/godotengine/godot/releases).
> Найдите архив `godot-editor-web` в разделе Assets нужной версии.

**Шаг 4. Размещение файлов**

Файлы WASM нужно разместить в Docker volume, который монтируется
в контейнер `godot-editor`. Способ зависит от режима запуска:

**Вариант A: Через Docker volume**

```bash
# Создание volume
docker volume create godot-editor-files

# Копирование файлов в volume через временный контейнер
docker run --rm -v godot-editor-files:/target \
  -v /путь/к/экспортированным/файлам:/source:ro \
  alpine cp /source/godot-editor.* /target/

# Перезапуск контейнера godot-editor
docker compose up -d godot-editor
```

**Вариант B: Через локальную директорию (рекомендуется для разработки)**

Создайте директорию и поместите файлы туда:

```bash
mkdir -p ./godot-wasm
# Скопируйте godot-editor.html, godot-editor.js, godot-editor.wasm, godot-editor.pck
# в директорию ./godot-wasm/
```

Затем измените `docker-compose.yml` — замените volume на bind mount:
```yaml
godot-editor:
  volumes:
    - ./nginx/godot-editor.conf:/etc/nginx/conf.d/default.conf:ro
    - ./godot-wasm:/usr/share/nginx/html:ro  # вместо godot-editor-files
```

### 6.4. Запуск Godot Editor через Nginx

Для полноценной работы Godot Editor (с COOP/COEP заголовками)
запустите Nginx вместе с Godot Editor:

```bash
# Запуск MinIO, Godot Editor и Nginx
docker compose up -d minio minio-init godot-editor nginx
```

Теперь Godot Editor доступен по адресу:
- **http://localhost:8080** — напрямую (для отладки)
- **http://localhost/editor/godot/** — через Nginx (с COOP/COEP)

Приложение Next.js доступно через Nginx:
- **http://localhost/** — через Nginx (с COOP/COEP для /editor/godot/)

> **Важно:** При использовании Nginx доступ к платформе осуществляется
> через порт 80 (http://localhost), а не 3000. Nginx проксирует запросы
> к Next.js, добавляя необходимые заголовки.

### 6.5. Запуск Godot Editor через Caddy (альтернатива)

В репозитории есть `Caddyfile` для запуска через Caddy на порту 81:

```
http://localhost:81 → http://localhost:3000
```

Caddy автоматически добавляет заголовки и поддерживает HTTPS,
но для Godot Editor COOP/COEP нужно настраивать вручную.
Рекомендуется использовать Nginx — конфигурация уже подготовлена.

### 6.6. Проверка интеграции Godot Editor

1. Откройте **http://localhost:3000/editor** (без Nginx — placeholder)
2. Откройте **http://localhost/editor/godot/** (через Nginx — Godot Editor)
3. Откройте DevTools браузера → Console
4. Проверьте наличие заголовков COOP/COEP:
   ```
   curl -I http://localhost/editor/godot/
   # Должны быть:
   # Cross-Origin-Opener-Policy: same-origin
   # Cross-Origin-Embedder-Policy: require-corp
   ```
5. Проверьте PostMessage-соединение:
   - В Console выполните: `window.__godotEditor` (на странице /editor/godot/)
   - Должен вернуться объект с состоянием редактора

### 6.7. Режим placeholder (без WASM)

Если WASM-файлы не размещены, Godot Editor работает в режиме placeholder:
- Отображается страница с информацией о недоступности редактора
- PostMessage API продолжает работать — платформа может обмениваться
  сообщениями со страницей placeholder
- Тесты GUT и автогрейдинг недоступны
- Файловый браузер работает через API (без редактора)

Это нормальный режим для разработки, если вы не работаете над
функционалом Godot Editor.

---

## 7. Полный Docker-стек (production)

Для запуска всех компонентов платформы в Docker-контейнерах:

### 7.1. Сборка и запуск

```bash
# Полный стек (app + MinIO + Nginx + Godot Editor)
docker compose up -d

# Или поэтапно:
docker compose up -d minio minio-init  # Сначала MinIO
docker compose up -d app               # Затем приложение (зависит от MinIO)
docker compose up -d godot-editor nginx # Затем Godot + Nginx
```

### 7.2. Пересборка после изменений кода

```bash
# Пересобрать образ приложения
docker compose build app

# Перезапустить с новым образом
docker compose up -d app
```

### 7.3. Логи и диагностика

```bash
# Логи приложения
docker compose logs -f app

# Логи Nginx
docker compose logs -f nginx

# Логи MinIO
docker compose logs -f minio

# Логи всех сервисов
docker compose logs -f

# Статус контейнеров
docker compose ps
```

### 7.4. Остановка и очистка

```bash
# Остановить все контейнеры
docker compose down

# Остановить и удалить volumes (ВНИМАНИЕ: удаляет данные!)
docker compose down -v
```

### 7.5. Структура Docker-компонентов

**Dockerfile** — multi-stage сборка:
1. `deps` — установка зависимостей через bun, генерация Prisma Client
2. `builder` — сборка Next.js (standalone output)
3. `runner` — минимальный production-образ с Node.js

**Nginx** — reverse proxy с тремя upstream:
- `nextjs_app` → app:3000 (основное приложение)
- `godot_editor` → godot-editor:8080 (WASM-редактор)
- `minio_console` → minio:9001 (веб-консоль S3)

**MinIO** — хранилище с автоматическим созданием бакета:
- Контейнер `minio-init` создаёт бакет `user-projects` при первом запуске
- Данные сохраняются в Docker volume `minio-data`

---

## 8. Структура переменных окружения

Все переменные задаются в файле `.env`. Шаблоны:
- `.env.example` — для локальной разработки (dev-режим)
- `.env.docker` — для Docker-разворачивания (production-режим)

### 8.1. Обязательные переменные

| Переменная | Описание | Dev-значение | Docker-значение |
|------------|----------|--------------|-----------------|
| `NODE_ENV` | Режим окружения | `development` | `production` |
| `DATABASE_URL` | Путь к SQLite БД | `file:./db/custom.db` | `file:/app/db/custom.db` |

### 8.2. S3 / MinIO

| Переменная | Описание | По умолчанию |
|------------|----------|-------------|
| `S3_ENDPOINT` | URL S3-сервера | `http://localhost:9000` |
| `S3_REGION` | Регион S3 | `us-east-1` |
| `S3_ACCESS_KEY` | Ключ доступа | `minioadmin` |
| `S3_SECRET_KEY` | Секретный ключ | `minioadmin` |
| `S3_BUCKET` | Название бакета | `user-projects` |

> В Docker `S3_ENDPOINT` должен быть `http://minio:9000`
> (имя сервиса в docker-compose), а не `localhost`.

### 8.3. Godot Web Editor

| Переменная | Описание | По умолчанию |
|------------|----------|-------------|
| `GODOT_EDITOR_URL` | URL редактора из браузера | `http://localhost:8080` |

> В Docker Godot Editor доступен через Nginx на `http://localhost/editor/godot/`,
> но `GODOT_EDITOR_URL` указывает на прямой URL для iframe.

### 8.4. MinIO Console

| Переменная | Описание | По умолчанию |
|------------|----------|-------------|
| `MINIO_ROOT_USER` | Логин администратора MinIO | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | Пароль администратора MinIO | `minioadmin` |

> **Для production обязательно замените `MINIO_ROOT_USER` и `MINIO_ROOT_PASSWORD`
> на надёжные значения!**

---

## 9. Проверка работоспособности

### 9.1. Минимальная проверка (только Next.js)

```bash
bun run dev
# Откройте http://localhost:3000
# Должна отобразиться главная страница платформы
```

### 9.2. Проверка базы данных

```bash
# Проверка файла БД
ls -la db/custom.db

# Проверка через API
curl http://localhost:3000/api/health
# Ожидаемый ответ: {"status":"ok"}
```

### 9.3. Проверка MinIO

```bash
# Health check
curl http://localhost:9000/minio/health/live

# Веб-консоль
# Откройте http://localhost:9001
# Логин: minioadmin, пароль: minioadmin
```

### 9.4. Проверка Godot Editor

```bash
# COOP/COEP заголовки (только через Nginx)
curl -I http://localhost/editor/godot/ 2>/dev/null | grep -i cross
# Ожидаемый вывод:
# Cross-Origin-Opener-Policy: same-origin
# Cross-Origin-Embedder-Policy: require-corp

# SharedArrayBuffer (в Console браузера на странице /editor/godot/)
# Выполните: new SharedArrayBuffer(1)
# Не должно быть ошибки
```

### 9.5. Проверка PostMessage API

Откройте http://localhost:3000/editor, затем в Console DevTools:

```javascript
// Проверка состояния редактора
document.querySelector('iframe')?.contentWindow?.postMessage(
  { type: 'godot-learning-ping', timestamp: Date.now() }, '*'
)

// Чтение ответа
window.addEventListener('message', (e) => {
  if (e.data?.type === 'godot-editor-pong') {
    console.log('Godot Editor подключен:', e.data.payload)
  }
})
```

### 9.6. Полная проверка (все компоненты)

```bash
# Запуск полного стека
docker compose up -d

# Ожидание запуска (app ждёт MinIO health check)
sleep 30

# Проверка всех сервисов
curl -s http://localhost/api/health      # Next.js через Nginx
curl -s http://localhost:9000/minio/health/live  # MinIO
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080  # Godot Editor
curl -sI http://localhost/editor/godot/ | grep -i cross  # COOP/COEP
```

---

## 10. Устранение неполадок

### 10.1. Ошибка: `SharedArrayBuffer is not defined`

**Причина:** Отсутствуют COOP/COEP заголовки.

**Решение:**
1. Убедитесь, что Nginx запущен: `docker compose ps nginx`
2. Обращайтесь к приложению через порт 80 (Nginx), а не 3000 (Next.js напрямую)
3. Проверьте заголовки: `curl -I http://localhost/editor/godot/ | grep Cross`

### 10.2. Ошибка: `WASM file not found`

**Причина:** Файлы Godot Editor не размещены в Docker volume.

**Решение:**
1. Экспортируйте Godot Editor (см. раздел 6.3)
2. Поместите файлы в volume или bind mount
3. Перезапустите: `docker compose restart godot-editor`

### 10.3. MinIO не запускается

**Причина:** Порт 9000 или 9001 занят другим процессом.

**Решение:**
```bash
# Проверка занятости портов
lsof -i :9000
lsof -i :9001

# Освобождение порта (замените PID)
kill <PID>

# Или изменение портов в docker-compose.yml:
# ports:
#   - "9002:9000"   # S3 API
#   - "9003:9001"   # MinIO Console
```

### 10.4. Ошибка: `Prisma Client could not be generated`

**Причина:** Prisma Client не сгенерирован после установки зависимостей.

**Решение:**
```bash
bun run db:generate  # Генерация Prisma Client
bun run db:push      # Синхронизация схемы с БД
```

### 10.5. Ошибка сборки: `npm run build` падает

**Причина:** TypeScript-ошибки в коде.

**Решение:**
В `next.config.ts` установлен `ignoreBuildErrors: true`, но если
ошибки критические, проверьте:
```bash
# Проверка типов без сборки
npx tsc --noEmit

# Линтинг
bun run lint
```

### 10.6. Nginx возвращает 502 Bad Gateway

**Причина:** Next.js ещё не запустился или упал.

**Решение:**
```bash
# Проверка статуса приложения
docker compose logs app | tail -20

# Проверка health check
curl http://localhost:3000/api/health

# Перезапуск приложения
docker compose restart app
```

### 10.7. Файлы проектов не загружаются в MinIO

**Причина:** Неправильный `S3_ENDPOINT` или бакет не создан.

**Решение:**
```bash
# Проверка подключения к MinIO
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/

# Создание бакета вручную
mc mb local/user-projects --ignore-existing
mc anonymous set download local/user-projects

# Проверка переменных окружения
docker compose exec app env | grep S3
```

### 10.8. Docker-контейнер godot-editor не видит WASM-файлы

**Причина:** Файлы не примонтированы или volume пустой.

**Решение:**
```bash
# Проверка содержимого volume
docker run --rm -v godot-editor-files:/data alpine ls -la /data/

# Если volume пустой — скопируйте файлы (см. раздел 6.3, Шаг 4)

# Альтернатива: используйте bind mount
# В docker-compose.yml замените:
#   - godot-editor-files:/usr/share/nginx/html:ro
# на:
#   - ./godot-wasm:/usr/share/nginx/html:ro
```

---

## Быстрая шпаргалка

```bash
# === Минимальный запуск (только платформа) ===
cp .env.example .env
bun install
bun run db:push
bun run dev
# → http://localhost:3000

# === Запуск с MinIO (файловое хранилище) ===
docker compose up -d minio minio-init
bun run dev
# → http://localhost:3000
# → MinIO Console: http://localhost:9001

# === Полный стек с Godot Editor ===
# (требуются WASM-файлы — см. раздел 6.3)
docker compose up -d
# → http://localhost (через Nginx)
# → Godot Editor: http://localhost/editor/godot/

# === Остановка ===
docker compose down      # Остановить контейнеры
docker compose down -v   # Удалить данные
```
