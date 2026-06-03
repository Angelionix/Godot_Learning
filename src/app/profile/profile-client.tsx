"use client";

import { useState } from "react";
import {
  User,
  Award,
  BarChart3,
  Settings,
  Zap,
  Trophy,
  BookOpen,
  Flame,
  Target,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BadgeCard } from "@/components/gamification/badge-card";
import { LevelProgress } from "@/components/gamification/level-progress";
import { ProjectProgressCard } from "@/components/gamification/project-progress-card";
import { BADGE_DEFINITIONS } from "@/lib/gamification";
import { projects } from "@/lib/projects";
import { updateUserProfileAction } from "@/actions/profile.action";
import type { UserProfileData } from "@/actions/profile.action";

interface ProfileClientProps {
  initialData: UserProfileData;
}

export function ProfileClient({ initialData }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfileData>(initialData);
  const [activeTab, setActiveTab] = useState("overview");

  // Settings form state
  const [username, setUsername] = useState(initialData.username);
  const [email, setEmail] = useState(initialData.email || "");
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const earnedSlugs = new Set(profile.badges.map((b) => b.slug));
  const earnedBadgeCount = profile.badges.length;
  const totalBadges = profile.totalBadges;

  const overallPercent =
    profile.progressStats.totalChapters > 0
      ? Math.round(
          (profile.progressStats.completedChapters /
            profile.progressStats.totalChapters) *
            100
        )
      : 0;

  // Streak status
  const getStreakInfo = (streak: number) => {
    if (streak === 0) return { emoji: "💤", text: "Начните заниматься сегодня!", color: "text-muted-foreground" };
    if (streak < 3) return { emoji: "🌱", text: "Хорошее начало!", color: "text-green-500" };
    if (streak < 7) return { emoji: "🔥", text: "Вы на огне!", color: "text-orange-500" };
    if (streak < 14) return { emoji: "⚡", text: "Невероятная дисциплина!", color: "text-yellow-500" };
    if (streak < 30) return { emoji: "💎", text: "Железная воля!", color: "text-purple-500" };
    return { emoji: "🌟", text: "Легенда дисциплины!", color: "text-amber-500" };
  };

  const streakInfo = getStreakInfo(profile.streak);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const result = await updateUserProfileAction({
        username,
        email: email || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      if (result.success && result.data) {
        setProfile(result.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || "Не удалось сохранить изменения");
      }
    } catch {
      setSaveError("Произошла ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  // Format join date
  const joinDate = new Date(profile.createdAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Days since join
  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="mt-1 text-muted-foreground">
          Ваша учетная запись, достижения и настройки
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <User className="size-4" />
            <span className="hidden sm:inline">Обзор</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-1.5">
            <Award className="size-4" />
            <span className="hidden sm:inline">Бейджи</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Прогресс</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Настройки</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="flex flex-col gap-6 mt-4">
            {/* Profile Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="size-24 rounded-full border-4 border-[#478CBF]/30 object-cover"
                      />
                    ) : (
                      <div className="size-24 rounded-full border-4 border-[#478CBF]/30 bg-[#478CBF]/10 flex items-center justify-center">
                        <User className="size-10 text-[#478CBF]" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-[#478CBF] flex items-center justify-center text-white text-xs font-bold border-2 border-background">
                      {profile.level}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                    {profile.email && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {profile.email}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start">
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="size-3" />
                        С {joinDate}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="size-3" />
                        {daysSinceJoin} {daysSinceJoin === 1 ? "день" : daysSinceJoin < 5 ? "дня" : "дней"} на платформе
                      </Badge>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <span className="text-3xl">{streakInfo.emoji}</span>
                    <p className="text-2xl font-bold tabular-nums">{profile.streak}</p>
                    <p className="text-xs text-muted-foreground">дней подряд</p>
                    <p className={`text-[10px] font-medium ${streakInfo.color}`}>
                      {streakInfo.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* XP */}
              <Card>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Zap className="size-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{profile.xp}</p>
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
                    <p className="text-2xl font-bold tabular-nums">{profile.level}</p>
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
                      {profile.progressStats.completedChapters}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{profile.progressStats.totalChapters}
                      </span>
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
                      <span className="text-sm text-muted-foreground font-normal">
                        /{totalBadges}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">Бейджей</p>
                  </div>
                </CardContent>
              </Card>

              {/* Streak */}
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <Flame className="size-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{profile.streak}</p>
                    <p className="text-xs text-muted-foreground">Стрик</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Level Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4 text-[#478CBF]" />
                  Прогресс уровня
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LevelProgress xp={profile.xp} level={profile.level} />

                <Separator className="my-4" />

                {/* Overall progress */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Общий прогресс курса</span>
                  <span className="text-muted-foreground tabular-nums">
                    {overallPercent}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#478CBF] to-[#45B853] transition-all"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.progressStats.completedProjects} из{" "}
                  {profile.progressStats.totalProjects} проектов завершено
                </p>
              </CardContent>
            </Card>

            {/* Quick Badges Preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="size-4 text-purple-500" />
                    Последние достижения
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("badges")}
                    className="text-xs"
                  >
                    Все бейджи →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profile.badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Пока нет достижений. Начните проходить главы, чтобы заработать первые бейджи!
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {profile.badges.slice(0, 5).map((badge) => (
                      <BadgeCard
                        key={badge.slug}
                        slug={badge.slug}
                        name={badge.name}
                        description={badge.description}
                        icon={badge.icon}
                        earnedAt={badge.earnedAt}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Badges Tab ───────────────────────────────────────── */}
        <TabsContent value="badges">
          <div className="flex flex-col gap-6 mt-4">
            {/* Badge summary */}
            <div className="flex items-center gap-4">
              <Card className="flex-1">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <Award className="size-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {earnedBadgeCount}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{totalBadges}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Достижений получено
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="pt-4 pb-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{
                        width: `${totalBadges > 0 ? (earnedBadgeCount / totalBadges) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    {totalBadges > 0
                      ? Math.round((earnedBadgeCount / totalBadges) * 100)
                      : 0}
                    % коллекции
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* All Badges Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Все достижения</CardTitle>
                <CardDescription>
                  Получайте бейджи за прогресс, стрики и особые достижения
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Earned badges */}
                  {profile.badges.map((badge) => (
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
                  {BADGE_DEFINITIONS.filter((def) => !earnedSlugs.has(def.slug)).map(
                    (def) => (
                      <BadgeCard
                        key={def.slug}
                        slug={def.slug}
                        name={def.name}
                        description={def.description}
                        icon={def.icon}
                        locked
                      />
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Progress Tab ─────────────────────────────────────── */}
        <TabsContent value="progress">
          <div className="flex flex-col gap-6 mt-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="size-4 text-green-500" />
                    <span className="text-sm font-medium">Главы</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">
                    {profile.progressStats.completedChapters}
                    <span className="text-lg text-muted-foreground font-normal">
                      /{profile.progressStats.totalChapters}
                    </span>
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          profile.progressStats.totalChapters > 0
                            ? (profile.progressStats.completedChapters /
                                profile.progressStats.totalChapters) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="size-4 text-[#478CBF]" />
                    <span className="text-sm font-medium">Проекты</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">
                    {profile.progressStats.completedProjects}
                    <span className="text-lg text-muted-foreground font-normal">
                      /{profile.progressStats.totalProjects}
                    </span>
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#478CBF] transition-all"
                      style={{
                        width: `${
                          profile.progressStats.totalProjects > 0
                            ? (profile.progressStats.completedProjects /
                                profile.progressStats.totalProjects) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="size-4 text-amber-500" />
                    <span className="text-sm font-medium">Вызовы</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">
                    {profile.challengeStats.passedChallenges}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.challengeStats.totalAttempts} попыток всего
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Project-by-project progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#478CBF]" />
                  Прогресс по проектам
                </CardTitle>
                <CardDescription>
                  Детальный прогресс по каждому проекту курса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {profile.progressStats.projectProgress.map((proj) => {
                    const projectData = projects.find(
                      (p) => p.slug === proj.projectSlug
                    );
                    return (
                      <ProjectProgressCard
                        key={proj.projectSlug}
                        projectSlug={proj.projectSlug}
                        completedChapters={proj.completedChapters}
                        totalChapters={proj.totalChapters}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Detailed chapter breakdown per project */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="size-4 text-green-500" />
                  Главы по проектам
                </CardTitle>
                <CardDescription>
                  Подробная информация о пройденных главах
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {profile.progressStats.projectProgress.map((proj) => {
                    const projectData = projects.find(
                      (p) => p.slug === proj.projectSlug
                    );
                    const percent =
                      proj.totalChapters > 0
                        ? Math.round(
                            (proj.completedChapters / proj.totalChapters) * 100
                          )
                        : 0;
                    const isComplete =
                      proj.completedChapters >= proj.totalChapters;

                    return (
                      <div key={proj.projectSlug}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {projectData?.icon || "📘"}
                            </span>
                            <span className="font-medium text-sm">
                              {projectData?.title || proj.projectSlug}
                            </span>
                            {isComplete && (
                              <CheckCircle2 className="size-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {proj.completedChapters}/{proj.totalChapters} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete
                                ? "bg-green-500"
                                : "bg-gradient-to-r from-[#478CBF] to-[#45B853]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Settings Tab ─────────────────────────────────────── */}
        <TabsContent value="settings">
          <div className="flex flex-col gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4 text-[#478CBF]" />
                  Личные данные
                </CardTitle>
                <CardDescription>
                  Обновите ваше имя пользователя, email и аватар
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5 max-w-md">
                  {/* Username */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="username"
                      className="text-sm font-medium"
                    >
                      Имя пользователя
                    </label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите имя пользователя"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      От 1 до 50 символов
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Необязательное поле
                    </p>
                  </div>

                  {/* Avatar URL */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="avatarUrl"
                      className="text-sm font-medium"
                    >
                      URL аватара
                    </label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ссылка на изображение аватара
                    </p>
                  </div>

                  {/* Avatar Preview */}
                  {avatarUrl && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Предпросмотр:
                      </span>
                      <img
                        src={avatarUrl}
                        alt="Аватар"
                        className="size-12 rounded-full border-2 border-border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Save Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !username.trim()}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Сохранить изменения
                    </Button>

                    {saveSuccess && (
                      <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
                        <CheckCircle2 className="size-4" />
                        Сохранено!
                      </span>
                    )}

                    {saveError && (
                      <span className="text-sm text-destructive font-medium">
                        {saveError}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info (read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  Информация об аккаунте
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID пользователя</span>
                    <span className="font-mono text-xs">{profile.id}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата регистрации</span>
                    <span>{joinDate}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Последнее обновление</span>
                    <span>
                      {new Date(profile.updatedAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
