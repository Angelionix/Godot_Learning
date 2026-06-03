import { create } from "zustand";
import type { UserProgressSummary } from "@/repositories/progress.repository";
import { getUserGamificationAction } from "@/actions/gamification.action";

interface GamificationState {
  /** Full user progress data */
  data: UserProgressSummary | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Last fetch timestamp */
  lastFetched: number | null;
  /** Pending badge notifications (newly earned) */
  pendingBadges: { slug: string; name: string; description: string; icon: string }[];

  // Actions
  fetchGamificationData: () => Promise<void>;
  addPendingBadge: (badge: { slug: string; name: string; description: string; icon: string }) => void;
  clearPendingBadge: (slug: string) => void;
  clearAllPendingBadges: () => void;
  /** Refresh data (force re-fetch) */
  refresh: () => Promise<void>;
}

const CACHE_DURATION = 30_000; // 30 seconds

export const useGamificationStore = create<GamificationState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  pendingBadges: [],

  fetchGamificationData: async () => {
    const state = get();

    // Skip if already loading
    if (state.isLoading) return;

    // Skip if data is fresh (< 30s)
    if (
      state.data &&
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_DURATION
    ) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await getUserGamificationAction();
      if (result.success && result.data) {
        set({
          data: result.data,
          lastFetched: Date.now(),
          isLoading: false,
        });
      } else {
        set({
          error: result.success === false ? (result.error as string) : "Unknown error",
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch gamification data",
        isLoading: false,
      });
    }
  },

  addPendingBadge: (badge) => {
    set((state) => ({
      pendingBadges: [...state.pendingBadges, badge],
    }));
  },

  clearPendingBadge: (slug) => {
    set((state) => ({
      pendingBadges: state.pendingBadges.filter((b) => b.slug !== slug),
    }));
  },

  clearAllPendingBadges: () => {
    set({ pendingBadges: [] });
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchGamificationData();
  },
}));
