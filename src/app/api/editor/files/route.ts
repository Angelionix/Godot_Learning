/**
 * GET /api/editor/files — скачать файл из S3
 * DELETE /api/editor/files — удалить файл из S3
 *
 * Использует query-параметры вместо dynamic routes,
 * чтобы корректно обрабатывать S3-ключи с символами '/'.
 */

import { NextRequest, NextResponse } from "next/server";
import { downloadFile, deleteFile, getFileMetadata, listProjectFiles } from "@/lib/storage";
import { isS3Configured } from "@/lib/s3";
import { getProject, updateProjectStorage } from "@/repositories/editor.repository";

/**
 * Определяет Content-Type по расширению файла.
 */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    // Godot / Game
    tscn: "text/plain",
    tres: "text/plain",
    gd: "text/plain",
    gdscript: "text/plain",
    godot: "application/xml",
    // Изображения
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    gif: "image/gif",
    bmp: "image/bmp",
    // Аудио
    ogg: "audio/ogg",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    // Видео
    ogv: "video/ogg",
    mp4: "video/mp4",
    webm: "video/webm",
    // Шрифты
    ttf: "font/ttf",
    otf: "font/otf",
    woff: "font/woff",
    woff2: "font/woff2",
    // Документы
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    // Архивы
    zip: "application/zip",
    // Другое
    bin: "application/octet-stream",
    res: "text/plain",
    import: "text/plain",
    cfg: "text/plain",
    ini: "text/plain",
  };
  return mimeMap[ext] || "application/octet-stream";
}

/**
 * Извлекает имя файла из S3-ключа.
 */
function getFileNameFromKey(key: string): string {
  return key.split("/").pop() || key;
}

/**
 * Извлекает projectId из S3-ключа.
 * Структура ключа: {userId}/{projectSlug}/{projectId}/{fileName}
 */
function getProjectIdFromKey(key: string): string | null {
  const parts = key.split("/");
  // Ожидаем минимум 4 части: userId/projectSlug/projectId/fileName
  if (parts.length >= 4) {
    return parts[2];
  }
  return null;
}

/**
 * GET /api/editor/files?key={s3Key}
 * Скачивает файл из S3 по его ключу.
 */
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Не указан ключ файла (параметр key)" },
        { status: 400 }
      );
    }

    // Декодируем ключ, если он был URL-закодирован
    const decodedKey = decodeURIComponent(key);

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 хранилище не настроено" },
        { status: 503 }
      );
    }

    // Получаем метаданные файла для Content-Type
    const metadata = await getFileMetadata(decodedKey);
    const fileName = getFileNameFromKey(decodedKey);
    const contentType = metadata?.contentType || getContentType(fileName);

    // Скачиваем файл
    const fileBuffer = await downloadFile(decodedKey);

    // Формируем заголовки ответа
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    headers.set("Content-Length", fileBuffer.length.toString());
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(fileBuffer, { headers });
  } catch (error: any) {
    console.error("[Editor Files] GET download error:", error);

    // Если файл не найден в S3
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Не удалось скачать файл" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/editor/files
 * Удаляет файл из S3 по его ключу.
 * Body: { key: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Не указан ключ файла (поле key)" },
        { status: 400 }
      );
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 хранилище не настроено" },
        { status: 503 }
      );
    }

    // Удаляем файл из S3
    await deleteFile(key);

    // Обновляем информацию о хранилище проекта
    const projectId = getProjectIdFromKey(key);
    if (projectId) {
      const project = await getProject(projectId);
      if (project) {
        try {
          const storageInfo = await listProjectFiles(
            project.userId,
            project.projectSlug,
            project.id
          );
          await updateProjectStorage(
            project.id,
            storageInfo.totalSize,
            storageInfo.fileCount
          );
        } catch (updateError) {
          // Не прерываем ответ, если не удалось обновить информацию
          console.warn(
            "[Editor Files] Failed to update project storage after delete:",
            updateError
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Editor Files] DELETE error:", error);

    // Если файл не найден в S3 — всё равно считаем успехом
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Не удалось удалить файл" },
      { status: 500 }
    );
  }
}
