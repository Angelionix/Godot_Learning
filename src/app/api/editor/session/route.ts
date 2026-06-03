/**
 * POST /api/editor/session — создать сессию Godot Web Editor
 * GET /api/editor/session — получить активную сессию текущего пользователя
 */

import { NextRequest, NextResponse } from "next/server";
import { createSessionSchema } from "@/validators/editor";
import { createSession, getActiveSession } from "@/repositories/editor.repository";

const DEFAULT_USER_ID = "default-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectSlug, projectId } = parsed.data;
    const userId = DEFAULT_USER_ID; // TODO: заменить на реальный userId из auth

    // Формируем URL Godot Editor (пока плейсхолдер)
    const editorBaseUrl = process.env.GODOT_EDITOR_URL || "/editor/godot";
    const editorUrl = `${editorBaseUrl}?project=${projectSlug}&session=NEW`;

    const session = await createSession(userId, projectSlug, editorUrl);

    return NextResponse.json(
      {
        id: session.id,
        projectSlug: session.projectSlug,
        status: session.status,
        editorUrl: session.editorUrl,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Editor Session] POST error:", error);
    return NextResponse.json(
      { error: "Не удалось создать сессию редактора" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userId = DEFAULT_USER_ID; // TODO: заменить на реальный userId из auth
    const session = await getActiveSession(userId);

    if (!session) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        projectSlug: session.projectSlug,
        status: session.status,
        editorUrl: session.editorUrl,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[Editor Session] GET error:", error);
    return NextResponse.json(
      { error: "Не удалось получить сессию" },
      { status: 500 }
    );
  }
}
