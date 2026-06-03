import { getUserProfileAction } from "@/actions/profile.action";
import { ProfileClient } from "./profile-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Настройки профиля, статистика обучения и бейджи.",
  openGraph: {
    title: "Профиль — Godot Learning",
    description: "Твой профиль и статистика обучения на Godot Learning Platform.",
  },
};

export default async function ProfilePage() {
  const result = await getUserProfileAction();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <p className="text-muted-foreground">
          Не удалось загрузить профиль
        </p>
      </div>
    );
  }

  return <ProfileClient initialData={result.data} />;
}
