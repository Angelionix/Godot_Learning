"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, Gamepad2, Code } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { XpLevelBadge } from "@/components/gamification/xp-level-badge";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/learn", label: "Обучение" },
  { href: "/playground", label: "Playground", icon: Code },
  { href: "/dashboard", label: "Дашборд" },
];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Gamepad2 className="size-6 text-[#478CBF]" />
            <span>
              Godot{" "}
              <span className="text-[#478CBF]">Learning</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions: XP + Theme + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* XP / Level / Streak widget */}
            <div className="hidden md:flex">
              <XpLevelBadge />
            </div>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Переключить тему"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden" />
                }
              >
                <Menu className="size-5" />
                <span className="sr-only">Открыть меню</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="flex items-center gap-2 mb-6">
                  <Gamepad2 className="size-5 text-[#478CBF]" />
                  <span>
                    Godot <span className="text-[#478CBF]">Learning</span>
                  </span>
                </SheetTitle>

                {/* Mobile XP widget */}
                <div className="mb-4 px-2">
                  <XpLevelBadge />
                </div>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                        pathname === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
