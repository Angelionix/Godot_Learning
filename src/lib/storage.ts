/**
 * Сервис хранилища файлов проектов Godot Editor.
 *
 * Предоставляет высокоуровневый API для:
 * - Загрузки/скачивания файлов проектов через S3/MinIO
 * - Генерации presigned URLs для прямого доступа
 * - Управления квотами и лимитами
 * - Fallback на локальное хранилище в development-режиме
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, S3_BUCKET_NAME, MAX_PROJECT_SIZE, getProjectS3Key, getTemplateS3Key, isS3Configured } from "./s3";

// === Типы ===

export interface StorageFile {
  key: string;
  size: number;
  lastModified: Date;
  name: string; // Имя файла (последняя часть ключа)
}

export interface ProjectStorageInfo {
  s3Key: string;
  totalSize: number;
  fileCount: number;
  files: StorageFile[];
}

export interface PresignedUrlOptions {
  /** Время жизни URL в секундах (по умолчанию 3600 = 1 час) */
  expiresIn?: number;
  /** Content-Type для загрузки */
  contentType?: string;
}

// === Константы ===

const DEFAULT_PRESIGNED_EXPIRY = 3600; // 1 час
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 часа
const MAX_SESSIONS_PER_USER = 1;

export { SESSION_TIMEOUT_MS, MAX_SESSIONS_PER_USER, MAX_PROJECT_SIZE };

// === Инициализация бакета ===

/**
 * Создаёт бакет, если он не существует.
 * Вызывается при старте приложения.
 */
export async function ensureBucketExists(): Promise<void> {
  if (!isS3Configured()) {
    console.log("[Storage] S3 not configured, skipping bucket creation");
    return;
  }

  const client = getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET_NAME }));
    console.log(`[Storage] Bucket "${S3_BUCKET_NAME}" exists`);
  } catch {
    console.log(`[Storage] Creating bucket "${S3_BUCKET_NAME}"...`);
    await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET_NAME }));
    console.log(`[Storage] Bucket "${S3_BUCKET_NAME}" created`);
  }
}

// === Загрузка файлов ===

/**
 * Загружает файл в S3.
 */
export async function uploadFile(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<void> {
  const client = getS3Client();
  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Загружает файл проекта пользователя.
 */
export async function uploadProjectFile(
  userId: string,
  projectSlug: string,
  projectId: string,
  fileName: string,
  data: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const key = getProjectS3Key(userId, projectSlug, projectId, fileName);
  await uploadFile(key, data, contentType);
  return key;
}

// === Скачивание файлов ===

/**
 * Скачивает файл из S3.
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${key}`);
  }

  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/**
 * Получает метаданные файла без скачивания.
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
} | null> {
  const client = getS3Client();

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      })
    );

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified || new Date(),
    };
  } catch {
    return null;
  }
}

// === Список файлов ===

/**
 * Получает список файлов в папке проекта.
 */
export async function listProjectFiles(
  userId: string,
  projectSlug: string,
  projectId: string
): Promise<ProjectStorageInfo> {
  const client = getS3Client();
  const prefix = getProjectS3Key(userId, projectSlug, projectId);

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: prefix,
    })
  );

  const files: StorageFile[] = (response.Contents || [])
    .filter((obj) => obj.Key && !obj.Key.endsWith("/"))
    .map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
      name: obj.Key!.split("/").pop() || "",
    }));

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    s3Key: prefix,
    totalSize,
    fileCount: files.length,
    files,
  };
}

// === Удаление файлов ===

/**
 * Удаляет один файл из S3.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Удаляет все файлы проекта.
 */
export async function deleteProjectFiles(
  userId: string,
  projectSlug: string,
  projectId: string
): Promise<number> {
  const info = await listProjectFiles(userId, projectSlug, projectId);

  for (const file of info.files) {
    await deleteFile(file.key);
  }

  return info.fileCount;
}

// === Presigned URLs ===

/**
 * Генерирует presigned URL для скачивания файла.
 */
export async function getDownloadUrl(
  key: string,
  options?: PresignedUrlOptions
): Promise<string> {
  const client = getS3Client();
  const expiresIn = options?.expiresIn || DEFAULT_PRESIGNED_EXPIRY;

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  );
}

/**
 * Генерирует presigned URL для загрузки файла.
 */
export async function getUploadUrl(
  key: string,
  options?: PresignedUrlOptions
): Promise<string> {
  const client = getS3Client();
  const expiresIn = options?.expiresIn || DEFAULT_PRESIGNED_EXPIRY;

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: options?.contentType,
    }),
    { expiresIn }
  );
}

// === Шаблоны проектов ===

/**
 * Копирует шаблон проекта в папку пользователя.
 * Используется при создании нового проекта из шаблона.
 */
export async function copyTemplateToUser(
  templateSlug: string,
  userId: string,
  projectSlug: string,
  projectId: string
): Promise<number> {
  const client = getS3Client();
  const templatePrefix = getTemplateS3Key(templateSlug);

  // Получаем список файлов шаблона
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: templatePrefix,
    })
  );

  const templateFiles = (response.Contents || []).filter(
    (obj) => obj.Key && !obj.Key.endsWith("/")
  );

  // Копируем каждый файл в папку пользователя
  for (const file of templateFiles) {
    const fileName = file.Key!.replace(templatePrefix, "");
    const destKey = getProjectS3Key(userId, projectSlug, projectId, fileName);

    await client.send(
      new CopyObjectCommand({
        Bucket: S3_BUCKET_NAME,
        CopySource: `${S3_BUCKET_NAME}/${file.Key}`,
        Key: destKey,
      })
    );
  }

  return templateFiles.length;
}

// === Квоты ===

/**
 * Проверяет, не превышена ли квота хранилища для проекта.
 */
export async function checkProjectQuota(
  userId: string,
  projectSlug: string,
  projectId: string,
  additionalBytes: number = 0
): Promise<{ allowed: boolean; currentSize: number; maxSize: number }> {
  const info = await listProjectFiles(userId, projectSlug, projectId);
  const currentSize = info.totalSize + additionalBytes;

  return {
    allowed: currentSize <= MAX_PROJECT_SIZE,
    currentSize: info.totalSize,
    maxSize: MAX_PROJECT_SIZE,
  };
}
