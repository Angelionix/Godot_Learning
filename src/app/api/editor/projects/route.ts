/**
 * GET /api/editor/projects — список проектов пользователя
 * POST /api/editor/projects — создать новый проект
 */

import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema, listProjectsSchema } from "@/validators/editor";
import {
  createProject,
  listProjects,
} from "@/repositories/editor.repository";
import {
  copyTemplateToUser,
  listProjectFiles,
} from "@/lib/storage";
import { isS3Configured, getProjectS3Key } from "@/lib/s3";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listProjectsSchema.safeParse({
      projectSlug: searchParams.get("projectSlug") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = DEFAULT_USER_ID;
    const projects = await listProjects(userId, parsed.data.projectSlug);

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        projectSlug: p.projectSlug,
        name: p.name,
        description: p.description,
        sizeBytes: p.sizeBytes,
        fileCount: p.fileCount,
        templateSlug: p.templateSlug,
        lastOpenedAt: p.lastOpenedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("[Editor Projects] GET error:", error);
    return NextResponse.json(
      { error: "Не удалось получить список проектов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectSlug, name, description, templateSlug } = parsed.data;
    const userId = DEFAULT_USER_ID;

    // Генерируем S3-ключ для нового проекта
    const s3Key = getProjectS3Key(userId, projectSlug, "pending");

    // Создаём проект в БД (без S3-ключа, обновим после создания)
    const project = await createProject(userId, projectSlug, name, s3Key, {
      description,
      templateSlug,
    });

    // Обновляем S3-ключ с реальным projectId
    const realS3Key = getProjectS3Key(userId, projectSlug, project.id);
    const { prisma: db } = await import("@/lib/db");
    await db.editorProject.update({
      where: { id: project.id },
      data: { s3Key: realS3Key },
    });

    // Если указан шаблон — копируем файлы из S3
    let fileCount = 0;
    if (templateSlug && isS3Configured()) {
      try {
        fileCount = await copyTemplateToUser(
          templateSlug,
          userId,
          projectSlug,
          project.id
        );

        // Обновляем информацию о файлах
        const storageInfo = await listProjectFiles(userId, projectSlug, project.id);
        await db.editorProject.update({
          where: { id: project.id },
          data: {
            s3Key: realS3Key,
            fileCount: storageInfo.fileCount,
            sizeBytes: storageInfo.totalSize,
          },
        });
      } catch (err) {
        console.warn("[Editor Projects] Template copy failed (S3 may not be available):", err);
      }
    }

    return NextResponse.json(
      {
        id: project.id,
        projectSlug: project.projectSlug,
        name: project.name,
        description: project.description,
        s3Key: realS3Key,
        sizeBytes: project.sizeBytes,
        fileCount: fileCount || project.fileCount,
        templateSlug: project.templateSlug,
        createdAt: project.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Editor Projects] POST error:", error);
    return NextResponse.json(
      { error: "Не удалось создать проект" },
      { status: 500 }
    );
  }
}
