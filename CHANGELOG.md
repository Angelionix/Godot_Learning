# CHANGELOG

All notable changes to the Godot Learning Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
