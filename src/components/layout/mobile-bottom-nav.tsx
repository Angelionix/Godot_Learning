"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/learn", label: "Обучение", icon: BookOpen },
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/profile", label: "Профиль", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
