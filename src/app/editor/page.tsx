import type { Metadata } from "next";
import { EditorClient } from "./editor-client";

export const metadata: Metadata = {
  title: "Godot Web Editor",
  description:
    "Онлайн-редактор Godot Engine для создания игр прямо в браузере. Полная интеграция с курсом Godot Learning Platform.",
  openGraph: {
    title: "Godot Web Editor — Godot Learning",
    description:
      "Онлайн-редактор Godot Engine для создания игр прямо в браузере.",
  },
};

export default function EditorPage() {
  return <EditorClient />;
}
