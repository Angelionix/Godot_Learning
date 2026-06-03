import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSidebarStore } from '@/store/sidebar-store';
import { useGamificationStore } from '@/store/gamification-store';

// Mock the server action to avoid "use server" import issues
vi.mock('@/actions/gamification.action', () => ({
  getUserGamificationAction: vi.fn(),
}));

import { getUserGamificationAction } from '@/actions/gamification.action';

const mockGetUserGamification = vi.mocked(getUserGamificationAction);

// ── SidebarStore ────────────────────────────────────────────────────────────

describe('useSidebarStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSidebarStore.setState({ isOpen: true });
  });

  it('starts with isOpen = true', () => {
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('toggle flips isOpen', () => {
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(false);

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('setOpen sets isOpen to the given value', () => {
    useSidebarStore.getState().setOpen(false);
    expect(useSidebarStore.getState().isOpen).toBe(false);

    useSidebarStore.getState().setOpen(true);
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('setOpen with same value does not change state', () => {
    useSidebarStore.getState().setOpen(true);
    expect(useSidebarStore.getState().isOpen).toBe(true);

    useSidebarStore.getState().setOpen(true);
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });
});

// ── GamificationStore ──────────────────────────────────────────────────────

describe('useGamificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useGamificationStore.setState({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      pendingBadges: [],
    });
  });

  // ── Pending badges management ──

  describe('addPendingBadge', () => {
    it('adds a badge to the pending list', () => {
      const badge = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      useGamificationStore.getState().addPendingBadge(badge);

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(1);
      expect(useGamificationStore.getState().pendingBadges[0]).toEqual(badge);
    });

    it('adds multiple badges to the pending list', () => {
      const badge1 = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      const badge2 = { slug: 'streak-7', name: 'Неделя огня', description: 'Тест', icon: '🔥' };

      useGamificationStore.getState().addPendingBadge(badge1);
      useGamificationStore.getState().addPendingBadge(badge2);

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(2);
    });

    it('allows duplicate slugs (same badge added twice)', () => {
      const badge = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      useGamificationStore.getState().addPendingBadge(badge);
      useGamificationStore.getState().addPendingBadge(badge);

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(2);
    });
  });

  describe('clearPendingBadge', () => {
    it('removes a specific badge by slug', () => {
      const badge1 = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      const badge2 = { slug: 'streak-7', name: 'Неделя огня', description: 'Тест', icon: '🔥' };

      useGamificationStore.getState().addPendingBadge(badge1);
      useGamificationStore.getState().addPendingBadge(badge2);
      useGamificationStore.getState().clearPendingBadge('first-step');

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(1);
      expect(useGamificationStore.getState().pendingBadges[0].slug).toBe('streak-7');
    });

    it('does nothing when badge slug not found', () => {
      const badge = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      useGamificationStore.getState().addPendingBadge(badge);
      useGamificationStore.getState().clearPendingBadge('nonexistent');

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(1);
    });
  });

  describe('clearAllPendingBadges', () => {
    it('removes all pending badges', () => {
      const badge1 = { slug: 'first-step', name: 'Первый шаг', description: 'Тест', icon: '👣' };
      const badge2 = { slug: 'streak-7', name: 'Неделя огня', description: 'Тест', icon: '🔥' };

      useGamificationStore.getState().addPendingBadge(badge1);
      useGamificationStore.getState().addPendingBadge(badge2);
      useGamificationStore.getState().clearAllPendingBadges();

      expect(useGamificationStore.getState().pendingBadges).toHaveLength(0);
    });
  });

  // ── fetchGamificationData ──

  describe('fetchGamificationData', () => {
    it('fetches data successfully', async () => {
      const mockData = {
        userId: 'default-user',
        username: 'student',
        xp: 150,
        level: 2,
        streak: 3,
        lastActiveDate: null,
        completedChapters: 5,
        totalChapters: 54,
        completedProjects: 0,
        totalProjects: 6,
        badges: [],
        projectProgress: [],
        activityCalendar: [],
      };

      mockGetUserGamification.mockResolvedValue({
        success: true,
        data: mockData as any,
      });

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.data).not.toBeNull();
      expect(state.data!.xp).toBe(150);
      expect(state.data!.level).toBe(2);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).not.toBeNull();
    });

    it('sets error when fetch fails', async () => {
      mockGetUserGamification.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.data).toBeNull();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('sets error when exception is thrown', async () => {
      mockGetUserGamification.mockRejectedValue(new Error('Server error'));

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.data).toBeNull();
      expect(state.error).toBe('Server error');
      expect(state.isLoading).toBe(false);
    });

    it('skips fetch when already loading', async () => {
      useGamificationStore.setState({ isLoading: true });

      await useGamificationStore.getState().fetchGamificationData();

      expect(mockGetUserGamification).not.toHaveBeenCalled();
    });

    it('skips fetch when data is fresh (< 30s)', async () => {
      const mockData = {
        userId: 'default-user',
        username: 'student',
        xp: 100,
        level: 2,
        streak: 1,
        lastActiveDate: null,
        completedChapters: 3,
        totalChapters: 54,
        completedProjects: 0,
        totalProjects: 6,
        badges: [],
        projectProgress: [],
        activityCalendar: [],
      };

      useGamificationStore.setState({
        data: mockData as any,
        lastFetched: Date.now() - 10000, // 10 seconds ago (fresh)
      });

      await useGamificationStore.getState().fetchGamificationData();

      expect(mockGetUserGamification).not.toHaveBeenCalled();
    });

    it('re-fetches when data is stale (> 30s)', async () => {
      const mockData = {
        userId: 'default-user',
        username: 'student',
        xp: 100,
        level: 2,
        streak: 1,
        lastActiveDate: null,
        completedChapters: 3,
        totalChapters: 54,
        completedProjects: 0,
        totalProjects: 6,
        badges: [],
        projectProgress: [],
        activityCalendar: [],
      };

      useGamificationStore.setState({
        data: mockData as any,
        lastFetched: Date.now() - 60000, // 60 seconds ago (stale)
      });

      mockGetUserGamification.mockResolvedValue({
        success: true,
        data: { ...mockData, xp: 200 } as any,
      });

      await useGamificationStore.getState().fetchGamificationData();

      expect(mockGetUserGamification).toHaveBeenCalled();
      expect(useGamificationStore.getState().data!.xp).toBe(200);
    });
  });

  // ── refresh ──

  describe('refresh', () => {
    it('clears lastFetched and triggers re-fetch', async () => {
      const mockData = {
        userId: 'default-user',
        username: 'student',
        xp: 100,
        level: 2,
        streak: 1,
        lastActiveDate: null,
        completedChapters: 3,
        totalChapters: 54,
        completedProjects: 0,
        totalProjects: 6,
        badges: [],
        projectProgress: [],
        activityCalendar: [],
      };

      useGamificationStore.setState({
        data: mockData as any,
        lastFetched: Date.now() - 10000, // Fresh, but we want to force refresh
      });

      mockGetUserGamification.mockResolvedValue({
        success: true,
        data: { ...mockData, xp: 300 } as any,
      });

      await useGamificationStore.getState().refresh();

      expect(mockGetUserGamification).toHaveBeenCalled();
      expect(useGamificationStore.getState().data!.xp).toBe(300);
    });
  });
});
