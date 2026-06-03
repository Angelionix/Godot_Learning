"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, BookOpen, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { projects } from "@/lib/projects";
import { getAllProjectChaptersMap } from "@/lib/chapter-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Load chapter data from shared module (syncs with _meta.json)
  const projectChaptersMap = getAllProjectChaptersMap();

  // Only show sidebar on /learn routes
  const isLearnRoute = pathname.startsWith("/learn");
  if (!isLearnRoute) return null;

  const toggleProject = (slug: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        isOpen ? "w-64" : "w-12"
      )}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-2 border-b border-border">
        <Button variant="ghost" size="icon-xs" onClick={toggle} aria-label="Свернуть панель">
          {isOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
        </Button>
      </div>

      {isOpen && (
        <ScrollArea className="flex-1">
          <div className="p-3">
            <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Проекты
            </h2>
            <nav className="flex flex-col gap-0.5">
              {projects.map((project) => {
                const chapters = projectChaptersMap[project.slug] || [];
                const isExpanded = expandedProjects[project.slug];
                const isActive = pathname.includes(project.slug);

                return (
                  <div key={project.slug}>
                    <button
                      onClick={() => toggleProject(project.slug)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="text-base">{project.icon}</span>
                      <span className="flex-1 truncate text-left">{project.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                        {chapters.map((chapter) => {
                          const chapterPath = `/learn/${project.slug}/${chapter.slug}`;
                          const isChapterActive = pathname === chapterPath;

                          return (
                            <Link
                              key={chapter.slug}
                              href={chapterPath}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                                isChapterActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                              )}
                            >
                              <BookOpen className="size-3 shrink-0" />
                              <span className="truncate">{chapter.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
