import { getProgressForUser } from "@/repositories/progress.repository";
import { DashboardContent } from "./dashboard-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дашборд",
  description: "Статистика обучения: XP, уровень, бейджи, стрик и радар навыков.",
  openGraph: {
    title: "Дашборд — Godot Learning",
    description: "Твой прогресс обучения Godot: XP, уровень, бейджи и стрик.",
  },
};

export default async function DashboardPage() {
  const data = await getProgressForUser();

  return <DashboardContent data={data} />;
}
