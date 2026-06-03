/**
 * GET /api/editor/session/[id] — статус сессии
 * DELETE /api/editor/session/[id] — закрыть сессию
 * PATCH /api/editor/session/[id] — heartbeat (обновить активность)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, heartbeatSession, closeSession } from "@/repositories/editor.repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(id);

    if (!session) {
      return NextResponse.json(
        { error: "Сессия не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      projectSlug: session.projectSlug,
      status: session.status,
      editorUrl: session.editorUrl,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    });
  } catch (error: any) {
    console.error("[Editor Session] GET by ID error:", error);
    return NextResponse.json(
      { error: "Не удалось получить сессию" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await heartbeatSession(id);

    if (!session) {
      return NextResponse.json(
        { error: "Сессия не найдена или уже закрыта" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
    });
  } catch (error: any) {
    console.error("[Editor Session] PATCH error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить сессию" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await closeSession(id);

    if (!session) {
      return NextResponse.json(
        { error: "Сессия не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status: session.status });
  } catch (error: any) {
    console.error("[Editor Session] DELETE error:", error);
    return NextResponse.json(
      { error: "Не удалось закрыть сессию" },
      { status: 500 }
    );
  }
}
