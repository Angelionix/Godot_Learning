/**
 * Repository для управления сессиями и проектами Godot Web Editor.
 *
 * Инкапсулирует доступ к данным EditorSession и EditorProject через Prisma.
 */

import prisma from "@/lib/prisma";
import { SESSION_TIMEOUT_MS, MAX_SESSIONS_PER_USER } from "@/lib/storage";

const DEFAULT_USER_ID = "default-user";

// === Сессии ===

export interface SessionData {
  id: string;
  userId: string;
  projectSlug: string;
  status: string;
  editorUrl: string | null;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Создаёт новую сессию редактора.
 * Проверяет лимит одновременных сессий и завершает просроченные.
 */
export async function createSession(
  userId: string = DEFAULT_USER_ID,
  projectSlug: string,
  editorUrl?: string
): Promise<SessionData> {
  // Закрываем просроченные сессии
  await expireStaleSessions(userId);

  // Проверяем лимит активных сессий
  const activeCount = await prisma.editorSession.count({
    where: { userId, status: "active" },
  });

  if (activeCount >= MAX_SESSIONS_PER_USER) {
    // Закрываем самую старую активную сессию
    const oldest = await prisma.editorSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { lastActivity: "asc" },
    });

    if (oldest) {
      await prisma.editorSession.update({
        where: { id: oldest.id },
        data: { status: "closed" },
      });
    }
  }

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);

  const session = await prisma.editorSession.create({
    data: {
      userId,
      projectSlug,
      editorUrl: editorUrl || null,
      status: "active",
      expiresAt,
      lastActivity: new Date(),
    },
  });

  return session;
}

/**
 * Получает активную сессию по ID.
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = await prisma.editorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  // Проверяем таймаут
  if (session.status === "active" && new Date() > session.expiresAt) {
    await prisma.editorSession.update({
      where: { id: sessionId },
      data: { status: "expired" },
    });
    return { ...session, status: "expired" };
  }

  return session;
}

/**
 * Получает активную сессию пользователя.
 */
export async function getActiveSession(userId: string = DEFAULT_USER_ID): Promise<SessionData | null> {
  // Сначала обновляем просроченные
  await expireStaleSessions(userId);

  const session = await prisma.editorSession.findFirst({
    where: { userId, status: "active" },
    orderBy: { lastActivity: "desc" },
  });

  return session;
}

/**
 * Обновляет активность сессии (heartbeat).
 */
export async function heartbeatSession(sessionId: string): Promise<SessionData | null> {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") return null;

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);

  return prisma.editorSession.update({
    where: { id: sessionId },
    data: {
      lastActivity: new Date(),
      expiresAt,
    },
  });
}

/**
 * Закрывает сессию.
 */
export async function closeSession(sessionId: string): Promise<SessionData | null> {
  const session = await prisma.editorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  return prisma.editorSession.update({
    where: { id: sessionId },
    data: { status: "closed" },
  });
}

/**
 * Закрывает все просроченные сессии пользователя.
 */
async function expireStaleSessions(userId: string): Promise<number> {
  const result = await prisma.editorSession.updateMany({
    where: {
      userId,
      status: "active",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });

  return result.count;
}

// === Проекты ===

export interface ProjectData {
  id: string;
  userId: string;
  projectSlug: string;
  name: string;
  description: string | null;
  s3Key: string;
  sizeBytes: number;
  fileCount: number;
  templateSlug: string | null;
  isTemplate: boolean;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Создаёт запись проекта в БД.
 */
export async function createProject(
  userId: string = DEFAULT_USER_ID,
  projectSlug: string,
  name: string,
  s3Key: string,
  options?: {
    description?: string;
    templateSlug?: string;
    isTemplate?: boolean;
  }
): Promise<ProjectData> {
  return prisma.editorProject.create({
    data: {
      userId,
      projectSlug,
      name,
      s3Key,
      description: options?.description || null,
      templateSlug: options?.templateSlug || null,
      isTemplate: options?.isTemplate || false,
    },
  });
}

/**
 * Получает проект по ID.
 */
export async function getProject(projectId: string): Promise<ProjectData | null> {
  return prisma.editorProject.findUnique({
    where: { id: projectId },
  });
}

/**
 * Получает список проектов пользователя, опционально фильтруя по projectSlug.
 */
export async function listProjects(
  userId: string = DEFAULT_USER_ID,
  projectSlug?: string
): Promise<ProjectData[]> {
  const where: any = { userId, isTemplate: false };
  if (projectSlug) where.projectSlug = projectSlug;

  return prisma.editorProject.findMany({
    where,
    orderBy: { lastOpenedAt: { sort: "desc", nulls: "last" } },
  });
}

/**
 * Обновляет метаданные проекта.
 */
export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; sizeBytes?: number; fileCount?: number; lastOpenedAt?: Date }
): Promise<ProjectData | null> {
  const project = await prisma.editorProject.findUnique({
    where: { id: projectId },
  });

  if (!project) return null;

  return prisma.editorProject.update({
    where: { id: projectId },
    data,
  });
}

/**
 * Удаляет проект из БД.
 */
export async function deleteProject(projectId: string): Promise<ProjectData | null> {
  const project = await prisma.editorProject.findUnique({
    where: { id: projectId },
  });

  if (!project) return null;

  return prisma.editorProject.delete({
    where: { id: projectId },
  });
}

/**
 * Получает список доступных шаблонов.
 */
export async function listTemplates(): Promise<ProjectData[]> {
  return prisma.editorProject.findMany({
    where: { isTemplate: true },
    orderBy: { projectSlug: "asc" },
  });
}

/**
 * Обновляет размер проекта и количество файлов (после загрузки/удаления файлов).
 */
export async function updateProjectStorage(
  projectId: string,
  sizeBytes: number,
  fileCount: number
): Promise<ProjectData | null> {
  return updateProject(projectId, { sizeBytes, fileCount });
}
