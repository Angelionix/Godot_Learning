"use client";

import { Award, BarChart3, BookOpen, Flame, Target, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LevelProgress } from "@/components/gamification/level-progress";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { BadgeCard } from "@/components/gamification/badge-card";
import { ProjectProgressCard } from "@/components/gamification/project-progress-card";
import { NextRecommendation } from "@/components/gamification/next-recommendation";
import { BADGE_DEFINITIONS } from "@/lib/gamification";
import type { UserProgressSummary } from "@/repositories/progress.repository";

interface DashboardContentProps {
  data: UserProgressSummary;
}

export function DashboardContent({ data }: DashboardContentProps) {
  const earnedSlugs = new Set(data.badges.map((b) => b.slug));
  const totalBadges = BADGE_DEFINITIONS.length;
  const earnedBadgeCount = data.badges.length;
  const overallPercent =
    data.totalChapters > 0
      ? Math.round((data.completedChapters / data.totalChapters) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        <p className="mt-1 text-muted-foreground">
          Ваш прогресс, достижения и рекомендации по обучению
        </p>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* XP */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Zap className="size-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.xp}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </CardContent>
        </Card>

        {/* Level */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#478CBF]/10">
              <Trophy className="size-5 text-[#478CBF]" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.level}</p>
              <p className="text-xs text-muted-foreground">Уровень</p>
            </div>
          </CardContent>
        </Card>

        {/* Chapters */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <BookOpen className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {data.completedChapters}
                <span className="text-sm text-muted-foreground font-normal">/{data.totalChapters}</span>
              </p>
              <p className="text-xs text-muted-foreground">Глав</p>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <Award className="size-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {earnedBadgeCount}
                <span className="text-sm text-muted-foreground font-normal">/{totalBadges}</span>
              </p>
              <p className="text-xs text-muted-foreground">Достижений</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Level + Radar + Projects */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Level Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4 text-[#478CBF]" />
                Прогресс уровня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LevelProgress xp={data.xp} level={data.level} />

              {/* Overall course progress */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Общий прогресс курса</span>
                <span className="text-muted-foreground tabular-nums">{overallPercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#478CBF] to-[#45B853] transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.completedProjects} из {data.totalProjects} проектов завершено
              </p>
            </CardContent>
          </Card>

          {/* Skill Radar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-[#478CBF]" />
                Навыки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SkillRadar data={data} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Навыки рассчитываются на основе завершённых глав в каждом проекте
              </p>
            </CardContent>
          </Card>

          {/* Project Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-[#478CBF]" />
                Прогресс по проектам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {data.projectProgress.map((proj) => (
                  <ProjectProgressCard
                    key={proj.projectSlug}
                    projectSlug={proj.projectSlug}
                    completedChapters={proj.completedChapters}
                    totalChapters={proj.totalChapters}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Streak + Badges + Recommendation */}
        <div className="flex flex-col gap-6">
          {/* Streak Calendar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="size-4 text-orange-500" />
                Активность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCalendar streak={data.streak} />
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="size-4 text-purple-500" />
                  Достижения
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {earnedBadgeCount}/{totalBadges}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {/* Earned badges first */}
                {data.badges.map((badge) => (
                  <BadgeCard
                    key={badge.slug}
                    slug={badge.slug}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earnedAt={badge.earnedAt}
                  />
                ))}
                {/* Locked badges */}
                {BADGE_DEFINITIONS.filter((def) => !earnedSlugs.has(def.slug)).map((def) => (
                  <BadgeCard
                    key={def.slug}
                    slug={def.slug}
                    name={def.name}
                    description={def.description}
                    icon={def.icon}
                    locked
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Recommendation */}
          <NextRecommendation data={data} />
        </div>
      </div>
    </div>
  );
}
