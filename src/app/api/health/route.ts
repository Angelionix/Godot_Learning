/**
 * Health Check API — /api/health
 *
 * Используется для Docker healthcheck и мониторинга.
 * Проверяет доступность базы данных и S3-хранилища.
 *
 * Ответы:
 *   200 — статус "ok" (БД доступна) или "degraded" (БД доступна, S3 — нет)
 *   503 — статус "degraded" (БД недоступна)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isS3Configured } from "@/lib/s3";
import { APP_VERSION } from "@/lib/version";

/** Время запуска сервера — для расчёта uptime */
const SERVER_START_TIME = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

  // --- Проверка базы данных ---
  let databaseOk = false;
  try {
    // Простой запрос $queryRaw для проверки подключения
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch (error) {
    console.error("[Health] Ошибка подключения к БД:", error);
  }

  // --- Проверка S3 ---
  let s3Ok = false;
  try {
    s3Ok = isS3Configured();
  } catch (error) {
    console.error("[Health] Ошибка проверки S3:", error);
  }

  // --- Формирование ответа ---
  const checks = {
    database: databaseOk,
    s3: s3Ok,
  };

  // Если база данных недоступна — возвращаем 503
  if (!databaseOk) {
    return NextResponse.json(
      {
        status: "degraded",
        version: APP_VERSION,
        timestamp,
        uptime: uptimeSeconds,
        checks,
      },
      { status: 503 }
    );
  }

  // БД доступна, но S3 — нет: "degraded" с HTTP 200
  const status = s3Ok ? "ok" : "degraded";

  return NextResponse.json({
    status,
    version: APP_VERSION,
    timestamp,
    uptime: uptimeSeconds,
    checks,
  });
}
