"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useGamificationStore } from "@/store/gamification-store";
import { getRarityColor, getRarityBg, getBadgeDefinition } from "@/lib/gamification";
import { cn } from "@/lib/utils";

/**
 * Toast notification that shows when a new badge is earned.
 * Shows animated badge card with confetti-like effect.
 */
export function BadgeNotification() {
  const { pendingBadges, clearPendingBadge } = useGamificationStore();
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (pendingBadges.length > 0 && !visible) {
      const badge = pendingBadges[0];
      setVisible(badge.slug);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisible(null);
        setTimeout(() => clearPendingBadge(badge.slug), 300); // wait for exit animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [pendingBadges, visible, clearPendingBadge]);

  if (!visible || pendingBadges.length === 0) return null;

  const badge = pendingBadges.find((b) => b.slug === visible);
  if (!badge) return null;

  const def = getBadgeDefinition(badge.slug);
  const rarity = def?.rarity || "common";

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right-full duration-500">
      <div
        className={cn(
          "relative flex items-start gap-3 p-4 rounded-xl border-2 shadow-xl max-w-sm",
          getRarityBg(rarity),
          getRarityColor(rarity)
        )}
      >
        {/* Glow effect for epic/legendary */}
        {(["epic", "legendary"] as const).includes(rarity) && (
          <div className="absolute inset-0 rounded-xl animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        )}

        {/* Badge icon */}
        <div className="text-3xl shrink-0">{badge.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-70">Новое достижение!</p>
          <p className="font-bold text-sm">{badge.name}</p>
          <p className="text-xs opacity-80 mt-0.5">{badge.description}</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setVisible(null);
            setTimeout(() => clearPendingBadge(badge.slug), 300);
          }}
          className="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
