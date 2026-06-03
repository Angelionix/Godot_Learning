/**
 * GET /api/editor/projects/[projectId] — получить проект
 * PATCH /api/editor/projects/[projectId] — обновить проект
 * DELETE /api/editor/projects/[projectId] — удалить проект
 */

import { NextRequest, NextResponse } from "next/server";
import { updateProjectSchema } from "@/validators/editor";
import {
  getProject,
  updateProject,
  deleteProject,
} from "@/repositories/editor.repository";
import { deleteProjectFiles } from "@/lib/storage";
import { isS3Configured } from "@/lib/s3";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: project.id,
      userId: project.userId,
      projectSlug: project.projectSlug,
      name: project.name,
      description: project.description,
      s3Key: project.s3Key,
      sizeBytes: project.sizeBytes,
      fileCount: project.fileCount,
      templateSlug: project.templateSlug,
      lastOpenedAt: project.lastOpenedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error: any) {
    console.error("[Editor Project] GET error:", error);
    return NextResponse.json(
      { error: "Не удалось получить проект" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await updateProject(projectId, {
      ...parsed.data,
      lastOpenedAt: new Date(),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      lastOpenedAt: project.lastOpenedAt,
      updatedAt: project.updatedAt,
    });
  } catch (error: any) {
    console.error("[Editor Project] PATCH error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить проект" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    // Удаляем файлы из S3
    if (isS3Configured()) {
      try {
        await deleteProjectFiles(
          project.userId,
          project.projectSlug,
          project.id
        );
      } catch (err) {
        console.warn("[Editor Project] S3 delete failed:", err);
      }
    }

    // Удаляем запись из БД
    await deleteProject(projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Editor Project] DELETE error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить проект" },
      { status: 500 }
    );
  }
}
