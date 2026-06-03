import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BadgeCard } from '@/components/gamification/badge-card';
import { LevelProgress } from '@/components/gamification/level-progress';
import { NextRecommendation } from '@/components/gamification/next-recommendation';
import { ProjectProgressCard } from '@/components/gamification/project-progress-card';
import type { UserProgressSummary } from '@/repositories/progress.repository';

// ── BadgeCard ──────────────────────────────────────────────────────────────────

describe('BadgeCard', () => {
  it('renders earned badge with name and icon', () => {
    render(
      <BadgeCard
        slug="first-step"
        name="Первый шаг"
        description="Завершите первую главу"
        icon="👣"
      />
    );

    expect(screen.getByText('Первый шаг')).toBeInTheDocument();
    expect(screen.getByText('👣')).toBeInTheDocument();
    expect(screen.getByText('Завершите первую главу')).toBeInTheDocument();
  });

  it('renders locked badge with lock icon and ???', () => {
    render(
      <BadgeCard
        slug="secret-badge"
        name="Секрет"
        description="Скрытое достижение"
        icon="🏆"
        locked
      />
    );

    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(screen.getByText('???')).toBeInTheDocument();
    // Description should not be visible when locked
    expect(screen.queryByText('Скрытое достижение')).not.toBeInTheDocument();
  });

  it('shows rarity label for unlocked badge', () => {
    render(
      <BadgeCard
        slug="chapter-master"
        name="Мастер глав"
        description="Завершите 10 глав"
        icon="📖"
      />
    );

    expect(screen.getByText('Редкий')).toBeInTheDocument();
  });

  it('shows earned date when provided', () => {
    const earnedAt = new Date('2026-06-01');
    render(
      <BadgeCard
        slug="first-step"
        name="Первый шаг"
        description="Завершите первую главу"
        icon="👣"
        earnedAt={earnedAt}
      />
    );

    // Russian locale date
    expect(screen.getByText('01.06.2026')).toBeInTheDocument();
  });

  it('applies rarity-specific CSS classes', () => {
    const { container: commonContainer } = render(
      <BadgeCard slug="first-step" name="Test" description="Test" icon="👣" />
    );
    const { container: legendaryContainer } = render(
      <BadgeCard slug="game-dev-master" name="Master" description="All projects" icon="👑" />
    );

    // Common and legendary should have different border colors
    const commonCard = commonContainer.firstChild as HTMLElement;
    const legendaryCard = legendaryContainer.firstChild as HTMLElement;
    expect(commonCard.className).not.toBe(legendaryCard.className);
  });
});

// ── LevelProgress ──────────────────────────────────────────────────────────────

describe('LevelProgress', () => {
  it('displays level number', () => {
    render(<LevelProgress xp={150} level={2} />);

    expect(screen.getByText('Уровень 2')).toBeInTheDocument();
  });

  it('displays XP count', () => {
    render(<LevelProgress xp={150} level={2} />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays XP to next level', () => {
    render(<LevelProgress xp={50} level={1} />);

    // At 50 XP, level 1: current=50, needed=100
    expect(screen.getByText('50 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText('До уровня 2: 50 XP')).toBeInTheDocument();
  });

  it('renders progress bar element', () => {
    const { container } = render(<LevelProgress xp={50} level={1} />);

    // Should have a progress bar div
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toBeInTheDocument();
  });
});

// ── NextRecommendation ──────────────────────────────────────────────────────

describe('NextRecommendation', () => {
  const baseData: UserProgressSummary = {
    userId: 'default-user',
    username: 'student',
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    completedChapters: 0,
    totalChapters: 54,
    completedProjects: 0,
    totalProjects: 6,
    badges: [],
    projectProgress: [
      {
        projectSlug: 'project-1-clicker',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [
          { chapterSlug: 'introduction', completed: false },
          { chapterSlug: 'chapter-1', completed: false },
        ],
      },
      {
        projectSlug: 'project-2-space-shooter',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [
          { chapterSlug: 'introduction', completed: false },
        ],
      },
    ],
    activityCalendar: [],
  };

  it('shows "Что дальше?" when there are incomplete chapters', () => {
    render(<NextRecommendation data={baseData} />);

    expect(screen.getByText('Что дальше?')).toBeInTheDocument();
    expect(screen.getByText('Продолжить обучение')).toBeInTheDocument();
  });

  it('shows completion message when all chapters done', () => {
    const completedData: UserProgressSummary = {
      ...baseData,
      completedChapters: 54,
      completedProjects: 6,
      projectProgress: baseData.projectProgress.map((p) => ({
        ...p,
        completedChapters: p.totalChapters,
        chapters: p.chapters.map((c) => ({ ...c, completed: true })),
      })),
    };

    render(<NextRecommendation data={completedData} />);

    expect(screen.getByText('Курс пройден!')).toBeInTheDocument();
  });
});

// ── ProjectProgressCard ──────────────────────────────────────────────────────

describe('ProjectProgressCard', () => {
  it('renders project title and language badge', () => {
    render(
      <ProjectProgressCard
        projectSlug="project-1-clicker"
        completedChapters={3}
        totalChapters={9}
      />
    );

    expect(screen.getByText('Кликер/Idle')).toBeInTheDocument();
    expect(screen.getByText('GDScript')).toBeInTheDocument();
  });

  it('shows chapter progress as fraction', () => {
    render(
      <ProjectProgressCard
        projectSlug="project-1-clicker"
        completedChapters={3}
        totalChapters={9}
      />
    );

    expect(screen.getByText('3/9')).toBeInTheDocument();
  });

  it('shows check icon when project is complete', () => {
    render(
      <ProjectProgressCard
        projectSlug="project-1-clicker"
        completedChapters={9}
        totalChapters={9}
      />
    );

    // CheckCircle2 icon should be present when completed
    const { container } = render(
      <ProjectProgressCard
        projectSlug="project-1-clicker"
        completedChapters={9}
        totalChapters={9}
      />
    );
    const svgElement = container.querySelector('.text-green-500');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders project icon', () => {
    render(
      <ProjectProgressCard
        projectSlug="project-2-space-shooter"
        completedChapters={0}
        totalChapters={9}
      />
    );

    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders 3D Adventure project', () => {
    render(
      <ProjectProgressCard
        projectSlug="project-5-3d-adventure"
        completedChapters={5}
        totalChapters={9}
      />
    );

    expect(screen.getByText('3D Приключение')).toBeInTheDocument();
    expect(screen.getByText('5/9')).toBeInTheDocument();
  });
});
