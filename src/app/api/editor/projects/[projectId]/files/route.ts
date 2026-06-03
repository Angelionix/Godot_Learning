/**
 * GET /api/editor/projects/[projectId]/files — список файлов проекта
 * POST /api/editor/projects/[projectId]/files — получить presigned URL для загрузки
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadFileSchema } from "@/validators/editor";
import { getProject } from "@/repositories/editor.repository";
import {
  listProjectFiles,
  getUploadUrl,
  getDownloadUrl,
  uploadProjectFile,
  checkProjectQuota,
  updateProjectStorage,
} from "@/lib/storage";
import { isS3Configured, getProjectS3Key } from "@/lib/s3";

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

    if (!isS3Configured()) {
      return NextResponse.json({
        files: [],
        totalSize: 0,
        fileCount: 0,
        s3Available: false,
      });
    }

    const info = await listProjectFiles(
      project.userId,
      project.projectSlug,
      project.id
    );

    return NextResponse.json({
      files: info.files.map((f) => ({
        name: f.name,
        key: f.key,
        size: f.size,
        lastModified: f.lastModified,
      })),
      totalSize: info.totalSize,
      fileCount: info.fileCount,
      s3Available: true,
    });
  } catch (error: any) {
    console.error("[Editor Files] GET error:", error);
    return NextResponse.json(
      { error: "Не удалось получить список файлов" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const parsed = uploadFileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, contentType } = parsed.data;

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 хранилище не настроено" },
        { status: 503 }
      );
    }

    // Проверяем квоту
    const quota = await checkProjectQuota(
      project.userId,
      project.projectSlug,
      project.id
    );

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Превышена квота хранилища",
          currentSize: quota.currentSize,
          maxSize: quota.maxSize,
        },
        { status: 413 }
      );
    }

    // Генерируем presigned URL для загрузки
    const key = getProjectS3Key(
      project.userId,
      project.projectSlug,
      project.id,
      fileName
    );

    const uploadUrl = await getUploadUrl(key, {
      contentType: contentType || "application/octet-stream",
      expiresIn: 3600,
    });

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("[Editor Files] POST error:", error);
    return NextResponse.json(
      { error: "Не удалось создать URL для загрузки" },
      { status: 500 }
    );
  }
}
