/**
 * S3/MinIO клиент для хранения файлов проектов Godot Web Editor.
 *
 * Использует @aws-sdk/client-s3 для совместимости с MinIO и любым S3-провайдером.
 * Конфигурация через переменные окружения.
 */

import { S3Client } from "@aws-sdk/client-s3";

// Конфигурация S3 из переменных окружения
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
const S3_BUCKET = process.env.S3_BUCKET || "user-projects";

/** Максимальный размер одного проекта — 50 MB */
export const MAX_PROJECT_SIZE = 50 * 1024 * 1024;

/** Название бакета */
export const S3_BUCKET_NAME = S3_BUCKET;

/**
 * Singleton S3Client — переиспользуется между запросами.
 * MinIO совместим с AWS S3 API, но требует явный endpoint.
 */
let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      // MinIO использует path-style URLs, не virtual-hosted
      forcePathStyle: true,
      // Таймауты для больших файлов
      requestHandler: {
        requestTimeout: 30_000, // 30 секунд на загрузку
      } as any,
    });
  }
  return s3Client;
}

/**
 * Проверяет, настроен ли S3 (не в режиме мок).
 * В development-режиме без MinIO можно использовать мок-хранилище.
 */
export function isS3Configured(): boolean {
  return !!process.env.S3_ENDPOINT || process.env.NODE_ENV === "production";
}

/**
 * Генерирует S3-ключ для файлов проекта пользователя.
 * Структура: {userId}/{projectSlug}/{projectId}/
 */
export function getProjectS3Key(
  userId: string,
  projectSlug: string,
  projectId: string,
  fileName?: string
): string {
  const base = `${userId}/${projectSlug}/${projectId}`;
  return fileName ? `${base}/${fileName}` : `${base}/`;
}

/**
 * Генерирует S3-ключ для шаблона проекта.
 * Структура: templates/{projectSlug}/
 */
export function getTemplateS3Key(projectSlug: string, fileName?: string): string {
  const base = `templates/${projectSlug}`;
  return fileName ? `${base}/${fileName}` : `${base}/`;
}
