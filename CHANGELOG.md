# CHANGELOG

All notable changes to the Godot Learning Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-06-03

### Sprint 7 — Godot Web Editor (Docker + Nginx + S3) — Enhanced

### Added

- **Health Check API** (`/api/health`) — Docker healthcheck endpoint with database and S3 connectivity checks, returns status, version, uptime
- **Godot Web Editor Loader** — Replaced placeholder HTML with full-featured loader (1176 lines):
  - WASM availability detection (HEAD requests for .js/.wasm/.data files)
  - Professional loading screen with progress bar and Russian status messages
  - Bidirectional PostMessage API (platform ↔ editor communication)
  - SharedArrayBuffer support detection with visual status badge
  - Fallback mode with Docker setup instructions when WASM not available
  - Project file sync functions (load/save via API)
  - Auto-reconnect on editor crash with retry button
  - `window.__godotEditor` debug API
- **Starter Templates** — Godot 4.3+ project templates for all 6 course projects:
  - `project-1-clicker` (2D, gl_compatibility, 60fps physics)
  - `project-2-space-shooter` (2D, gl_compatibility)
  - `project-3-metroidvania` (2D, gl_compatibility)
  - `project-4-tower-defense` (2D, gl_compatibility)
  - `project-5-3d-adventure` (3D, forward_plus, Camera3D)
  - `project-6-performance-demo` (3D, forward_plus, Camera3D)
  - Each includes: project.godot, icon.svg, scenes/main.tscn, README.md
- **Project File Browser** component (`ProjectFileBrowser`):
  - File list with extension-aware icons (.gd, .tscn, .tres, .godot, images)
  - Upload via presigned URL flow with progress bar
  - Delete individual files with confirmation dialog
  - Storage info with color-coded quota progress bar (50MB limit)
  - Empty state and S3-unavailable fallback
- **File Download/Delete API** (`/api/editor/files`):
  - GET with `?key=` param for downloading files from S3
  - DELETE with `{ key }` body for removing files from S3
  - Auto-updates project storage metadata after deletion
- **File Browser tab** in Editor page — "Файлы" tab with project file management
- **`.env.docker`** — Example Docker environment configuration with Russian comments
- File browser button on each project card in editor

### Changed

- Editor project cards now show "Открыть в редакторе" + "Файлы проекта" side by side
- Version bumped from 0.8.0 to 0.9.0

## [0.8.0] - 2026-06-03

### Sprint 7 — Godot Web Editor (Docker + Nginx + S3) — Base Infrastructure

### Added

- Docker Compose with 5 services: app, minio, minio-init, nginx, godot-editor
- Multi-stage Dockerfile (deps → build → production standalone)
- Nginx reverse proxy with COOP/COEP headers for SharedArrayBuffer
- Nginx godot-editor.conf placeholder server with WASM MIME types
- S3/MinIO client (`src/lib/s3.ts`) — singleton S3Client with path-style URLs
- Storage service (`src/lib/storage.ts`) — upload, download, list, delete, presigned URLs, quotas, template copying
- Editor API routes: sessions CRUD, projects CRUD, file operations
- Editor repository with Prisma (EditorSession, EditorProject models)
- Zod validators for all editor API inputs
- Editor page (`/editor`) with EditorClient component
- Session management with 2-hour timeout, heartbeat, auto-close stale sessions

## [0.3.0] - 2026-06-03

### Changed

- **Content formatting overhaul**: Converted wall-of-text paragraphs into properly formatted lists (ordered and unordered) across all Project 1 chapters
- **Visual highlights**: Added `<Callout>` (info/tip/warning/danger) and `<Insight>` components to highlight key points, warnings, and important architectural decisions across all chapters
- **Chapter numbering fixed**: "Публикация и экспорт" is now "Глава 7", "Итоги проекта" is now "Глава 8" (previously lacked proper numbering)
- **Code block overflow fixed**: Added `overflow-x-auto` to `<pre>` blocks so code no longer overflows horizontally
- **App name**: Changed package name from `nextjs_tailwind_shadcn_ts` to `godot-learning-platform`

### Added

- CSS styles for highlighted text: `<mark>`, `.key-point`, `.warning-note`, `.important-note`
- TD-033 in tech debt: Flag for reviewing course logic/sequence across all 6 projects
- This CHANGELOG file
- VERSION file at project root
- Versioning rules document (`docs/versioning.md`)
- Version display in sidebar footer

## [0.2.0] - 2026-06-03

### Added

- MDX lesson reader with `next-mdx-remote` + `rehype-pretty-code` + `remark-gfm`
- Custom MDX components: Insight, Callout, Challenge, Sprint, Bridge, CollapsibleHint, MermaidDiagram, CodeBlock
- Table of Contents (TOC) sidebar for chapter pages
- "I completed this" button with XP reward
- Chapter navigation (prev/next)
- Project overview page with chapter listing
- Learning path landing page with all 6 projects
- Prisma schema and SQLite database for progress tracking

## [0.1.0] - 2026-03-04

### Added

- Initial Next.js project setup
- Tailwind CSS 4 + shadcn/ui + Zustand + TanStack Query
- Prisma ORM with SQLite
- Basic project structure and configuration
