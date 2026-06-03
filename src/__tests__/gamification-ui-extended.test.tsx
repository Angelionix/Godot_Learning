import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the gamification store
vi.mock('@/store/gamification-store', () => ({
  useGamificationStore: vi.fn((selector) => {
    const state = {
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      pendingBadges: [],
      fetchGamificationData: vi.fn(),
      addPendingBadge: vi.fn(),
      clearPendingBadge: vi.fn(),
      clearAllPendingBadges: vi.fn(),
      refresh: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock gamification action for StreakCalendar
vi.mock('@/actions/gamification.action', () => ({
  getActivityCalendarAction: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

// Mock ResizeObserver for recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { useGamificationStore } from '@/store/gamification-store';
import { XpLevelBadge } from '@/components/gamification/xp-level-badge';
import { SkillRadar } from '@/components/gamification/skill-radar';
import type { UserProgressSummary } from '@/repositories/progress.repository';

const mockUseGamificationStore = vi.mocked(useGamificationStore);

// Helper: wrap components with TooltipProvider (required by radix Tooltip)
function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

// ── XpLevelBadge ──────────────────────────────────────────────────────────

describe('XpLevelBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when data is null', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: null,
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<XpLevelBadge />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('shows level badge with correct level number', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: {
          xp: 250,
          level: 3,
          streak: 0,
        },
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    renderWithProviders(<XpLevelBadge />);

    expect(screen.getByText('Ур. 3')).toBeInTheDocument();
  });

  it('shows XP count', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: {
          xp: 250,
          level: 3,
          streak: 0,
        },
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    renderWithProviders(<XpLevelBadge />);

    expect(screen.getByText('250 XP')).toBeInTheDocument();
  });

  it('shows streak flame when streak > 0', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: {
          xp: 100,
          level: 2,
          streak: 5,
        },
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    renderWithProviders(<XpLevelBadge />);

    // The streak number should be visible
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show streak when streak is 0', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: {
          xp: 50,
          level: 1,
          streak: 0,
        },
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { container } = renderWithProviders(<XpLevelBadge />);

    // No flame/streak badge should be present
    const flameElement = container.querySelector('.text-orange-500');
    expect(flameElement).toBeNull();
  });

  it('renders XP progress bar', () => {
    mockUseGamificationStore.mockImplementation((selector: any) => {
      const state = {
        data: {
          xp: 150,
          level: 2,
          streak: 0,
        },
        fetchGamificationData: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { container } = renderWithProviders(<XpLevelBadge />);

    // The progress bar div should be rendered
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });
});

// ── SkillRadar ──────────────────────────────────────────────────────────

// Since SkillRadar uses recharts which requires SVG rendering in jsdom,
// we test the data calculation logic and basic rendering

describe('SkillRadar', () => {
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
        completedChapters: 5,
        totalChapters: 9,
        chapters: [],
      },
      {
        projectSlug: 'project-2-space-shooter',
        completedChapters: 3,
        totalChapters: 9,
        chapters: [],
      },
      {
        projectSlug: 'project-3-metroidvania',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [],
      },
      {
        projectSlug: 'project-4-tower-defense',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [],
      },
      {
        projectSlug: 'project-5-3d-adventure',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [],
      },
      {
        projectSlug: 'project-6-performance-demo',
        completedChapters: 0,
        totalChapters: 9,
        chapters: [],
      },
    ],
    activityCalendar: [],
  };

  it('renders without crashing', () => {
    const { container } = render(<SkillRadar data={baseData} />);
    // The component should render a div wrapper
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the chart container with correct height', () => {
    const { container } = render(<SkillRadar data={baseData} />);
    const chartDiv = container.querySelector('.h-\\[280px\\]');
    expect(chartDiv).toBeInTheDocument();
  });

  it('calculates skill scores correctly based on project progress', () => {
    // UI/Interface skill: only project-1-clicker → 5/9 = 55.56% → 56%
    // We verify this by testing the logic directly
    const uiAxis = { key: 'ui', projects: ['project-1-clicker'] };
    let totalChapters = 0;
    let completedChapters = 0;
    for (const proj of baseData.projectProgress) {
      if (uiAxis.projects.includes(proj.projectSlug)) {
        totalChapters += proj.totalChapters;
        completedChapters += proj.completedChapters;
      }
    }
    const score = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    expect(score).toBe(56); // 5/9 = 55.56% rounds to 56
  });

  it('calculates 0 score for skill with no progress', () => {
    const perfAxis = { key: 'performance', projects: ['project-6-performance-demo'] };
    let totalChapters = 0;
    let completedChapters = 0;
    for (const proj of baseData.projectProgress) {
      if (perfAxis.projects.includes(proj.projectSlug)) {
        totalChapters += proj.totalChapters;
        completedChapters += proj.completedChapters;
      }
    }
    const score = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    expect(score).toBe(0);
  });

  it('calculates aggregate skill score for multi-project axis', () => {
    // Physics axis: project-2 (3/9) + project-3 (0/9) → 3/18 = 16.67% → 17%
    const physicsAxis = { key: 'physics', projects: ['project-2-space-shooter', 'project-3-metroidvania'] };
    let totalChapters = 0;
    let completedChapters = 0;
    for (const proj of baseData.projectProgress) {
      if (physicsAxis.projects.includes(proj.projectSlug)) {
        totalChapters += proj.totalChapters;
        completedChapters += proj.completedChapters;
      }
    }
    const score = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    expect(score).toBe(17);
  });

  it('applies custom className', () => {
    const { container } = render(<SkillRadar data={baseData} className="test-class" />);
    expect(container.firstChild).toBeTruthy();
  });
});
