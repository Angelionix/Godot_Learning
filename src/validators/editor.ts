/**
 * Zod-схемы для валидации API запросов Godot Web Editor.
 */

import { z } from "zod";

/** Создание сессии редактора */
export const createSessionSchema = z.object({
  projectSlug: z.string().min(1).max(100),
  projectId: z.string().cuid().optional(), // ID существующего проекта
});

/** Обновление активности сессии */
export const heartbeatSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

/** Создание проекта */
export const createProjectSchema = z.object({
  projectSlug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  templateSlug: z.string().max(100).optional(),
});

/** Обновление проекта */
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

/** Параметры запроса списка проектов */
export const listProjectsSchema = z.object({
  projectSlug: z.string().max(100).optional(),
});

/** Загрузка файла в проект */
export const uploadFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().max(100).optional(),
});

/** Типы из схем */
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type HeartbeatSessionInput = z.infer<typeof heartbeatSessionSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
