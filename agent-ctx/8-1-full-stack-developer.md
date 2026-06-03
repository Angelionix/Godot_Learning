# Task 8-1 Work Record

## Task: TD-002 - Unit Tests & Development Workflow Scripts

### Completed Items

#### 1. Content Tests (`tests/unit/lib/content.test.ts` - 29 tests)
- `getAllProjects()` — validates 6 projects, sorted by order, all ProjectMeta fields present
- `getProjectMeta(slug)` — returns correct metadata, null for invalid/empty slugs
- `getProjectChapters(slug)` — returns sorted chapters with ChapterMeta structure, empty array for invalid slugs
- `getChapterContent(slug, chapter)` — returns MDX content with frontmatter data (title, order, xp, estimatedTime, tags), null for non-existent
- `getChapterNavigation(slug, chapter)` — prev/next for middle/first/last chapters, null for non-existent project
- `getCheatSheet(slug)` — returns content for valid project, null for non-existent

#### 2. Projects Tests (`tests/unit/lib/projects.test.ts` - 19 tests)
- `projects` array — validates 6 projects, ascending difficulty, required fields, unique slugs/ids, correct slug list
- `getProjectBySlug()` — finds correct project with all fields, undefined for non-existent/empty
- `getDifficultyStars()` — correct star strings for 1-5, 5+ for >=6, empty for 0

#### 3. Progress Repository Tests (`tests/unit/repositories/progress.repository.test.ts` - 15 tests)
- Prisma client properly mocked via `vi.mock('@/lib/prisma')`
- `getProgressForUser()` — returns summary, creates default user, counts completed chapters, includes badges
- `markChapterComplete()` — handles already-completed, awards XP, updates user, awards badges
- `getProjectProgress()` — returns chapter details, all incomplete when no progress

#### 4. Validator Tests (`tests/unit/validators/progress.test.ts` - 23 tests)
- `markChapterCompleteSchema` — valid/invalid inputs, edge cases
- `getUserProgressSchema` — with/without userId, default behavior
- `getProjectProgressSchema` — slug validation, optional userId
- `challengeAttemptSchema` — all fields required, type validation

#### 5. MDX Component Tests (`tests/unit/components/mdx-components.test.tsx` - 32 tests)
- Callout (info, warning, danger, tip, default, title/no-title)
- Challenge (easy, medium, hard, legacy green/yellow/red, default, title, expand/collapse)
- Insight (title, children, icon)
- CollapsibleHint (button, hidden/revealed content, XP penalty)
- Sprint (children, title, icon)
- Bridge (children, heading, icon)

#### 6. Development Workflow Scripts
- `scripts/sync-to-preview.sh` — syncs src/, content/, docs/, prisma/ to sandbox
- `scripts/sync-from-preview.sh` — reverse sync from sandbox to git repo

### Test Results
All 123 tests pass across 6 test files.
