/**
 * Тесты для Editor Repository — сессии и проекты
 *
 * Эти тесты проверяют бизнес-логику без реального подключения к БД,
 * используя моки Prisma.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокируем storage (импортируется в repository)
vi.mock("@/lib/storage", () => ({
  SESSION_TIMEOUT_MS: 2 * 60 * 60 * 1000,
  MAX_SESSIONS_PER_USER: 1,
  MAX_PROJECT_SIZE: 50 * 1024 * 1024,
}));

// Мокируем prisma — фабрика не может использовать внешние переменные
vi.mock("@/lib/prisma", () => ({
  default: {
    editorSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    editorProject: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Импортируем мокированный prisma для доступа к мокам
import prisma from "@/lib/prisma";

import {
  createSession,
  getSession,
  getActiveSession,
  heartbeatSession,
  closeSession,
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
} from "@/repositories/editor.repository";

describe("Editor Session Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create a new session", async () => {
      const mockSession = {
        id: "sess-1",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        status: "active",
        editorUrl: "http://localhost:8080",
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.editorSession.count).mockResolvedValue(0);
      vi.mocked(prisma.editorSession.updateMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.editorSession.create).mockResolvedValue(mockSession);

      const result = await createSession("default-user", "project-1-clicker", "http://localhost:8080");

      expect(result).toEqual(mockSession);
      expect(prisma.editorSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "default-user",
            projectSlug: "project-1-clicker",
            status: "active",
          }),
        })
      );
    });

    it("should close oldest session when limit exceeded", async () => {
      const oldestSession = {
        id: "sess-old",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        status: "active",
        lastActivity: new Date("2026-01-01"),
      };

      vi.mocked(prisma.editorSession.count).mockResolvedValue(1);
      vi.mocked(prisma.editorSession.updateMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.editorSession.findFirst).mockResolvedValue(oldestSession);
      vi.mocked(prisma.editorSession.update).mockResolvedValue({ ...oldestSession, status: "closed" });
      vi.mocked(prisma.editorSession.create).mockResolvedValue({
        id: "sess-new",
        userId: "default-user",
        projectSlug: "project-2-shooter",
        status: "active",
      });

      await createSession("default-user", "project-2-shooter");

      expect(prisma.editorSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sess-old" },
          data: { status: "closed" },
        })
      );
    });
  });

  describe("getSession", () => {
    it("should return session when found", async () => {
      const mockSession = {
        id: "sess-1",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        status: "active",
        expiresAt: new Date(Date.now() + 3600000),
      };

      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(mockSession);

      const result = await getSession("sess-1");
      expect(result).toEqual(mockSession);
    });

    it("should return null when session not found", async () => {
      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(null);

      const result = await getSession("non-existent");
      expect(result).toBeNull();
    });

    it("should expire session when past timeout", async () => {
      const expiredSession = {
        id: "sess-1",
        userId: "default-user",
        status: "active",
        expiresAt: new Date("2020-01-01"),
      };

      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(expiredSession);
      vi.mocked(prisma.editorSession.update).mockResolvedValue({
        ...expiredSession,
        status: "expired",
      });

      const result = await getSession("sess-1");
      expect(result?.status).toBe("expired");
      expect(prisma.editorSession.update).toHaveBeenCalled();
    });
  });

  describe("heartbeatSession", () => {
    it("should update lastActivity and extendsAt", async () => {
      const mockSession = {
        id: "sess-1",
        status: "active",
        expiresAt: new Date(Date.now() + 3600000),
      };

      const updatedSession = {
        ...mockSession,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(mockSession);
      vi.mocked(prisma.editorSession.update).mockResolvedValue(updatedSession);

      const result = await heartbeatSession("sess-1");
      expect(result).toEqual(updatedSession);
    });

    it("should return null for closed session", async () => {
      const closedSession = {
        id: "sess-1",
        status: "closed",
        expiresAt: new Date("2020-01-01"),
      };

      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(closedSession);

      const result = await heartbeatSession("sess-1");
      expect(result).toBeNull();
    });
  });

  describe("closeSession", () => {
    it("should close active session", async () => {
      const mockSession = { id: "sess-1", status: "active" };

      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(mockSession);
      vi.mocked(prisma.editorSession.update).mockResolvedValue({
        ...mockSession,
        status: "closed",
      });

      const result = await closeSession("sess-1");
      expect(result?.status).toBe("closed");
    });

    it("should return null for non-existent session", async () => {
      vi.mocked(prisma.editorSession.findUnique).mockResolvedValue(null);

      const result = await closeSession("non-existent");
      expect(result).toBeNull();
    });
  });
});

describe("Editor Project Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a new project", async () => {
      const mockProject = {
        id: "proj-1",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        name: "Мой кликер",
        description: "Описание",
        s3Key: "default-user/project-1-clicker/proj-1/",
        sizeBytes: 0,
        fileCount: 0,
        templateSlug: null,
        isTemplate: false,
        lastOpenedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.editorProject.create).mockResolvedValue(mockProject);

      const result = await createProject(
        "default-user",
        "project-1-clicker",
        "Мой кликер",
        "default-user/project-1-clicker/proj-1/",
        { description: "Описание" }
      );

      expect(result).toEqual(mockProject);
      expect(prisma.editorProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "default-user",
            projectSlug: "project-1-clicker",
            name: "Мой кликер",
          }),
        })
      );
    });
  });

  describe("getProject", () => {
    it("should return project when found", async () => {
      const mockProject = { id: "proj-1", name: "Test Project" };

      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue(mockProject);

      const result = await getProject("proj-1");
      expect(result).toEqual(mockProject);
    });

    it("should return null when not found", async () => {
      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue(null);

      const result = await getProject("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("listProjects", () => {
    it("should return all user projects", async () => {
      const mockProjects = [
        { id: "proj-1", name: "Project 1", isTemplate: false },
        { id: "proj-2", name: "Project 2", isTemplate: false },
      ];

      vi.mocked(prisma.editorProject.findMany).mockResolvedValue(mockProjects);

      const result = await listProjects("default-user");
      expect(result).toEqual(mockProjects);
      expect(prisma.editorProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "default-user",
            isTemplate: false,
          }),
        })
      );
    });

    it("should filter by projectSlug", async () => {
      const mockProjects = [
        { id: "proj-1", name: "Project 1", projectSlug: "project-1-clicker" },
      ];

      vi.mocked(prisma.editorProject.findMany).mockResolvedValue(mockProjects);

      await listProjects("default-user", "project-1-clicker");
      expect(prisma.editorProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectSlug: "project-1-clicker",
          }),
        })
      );
    });
  });

  describe("updateProject", () => {
    it("should update project fields", async () => {
      const updatedProject = {
        id: "proj-1",
        name: "Updated Name",
        updatedAt: new Date(),
      };

      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue({ id: "proj-1" });
      vi.mocked(prisma.editorProject.update).mockResolvedValue(updatedProject);

      const result = await updateProject("proj-1", { name: "Updated Name" });
      expect(result).toEqual(updatedProject);
    });

    it("should return null for non-existent project", async () => {
      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue(null);

      const result = await updateProject("non-existent", { name: "Test" });
      expect(result).toBeNull();
    });
  });

  describe("deleteProject", () => {
    it("should delete project", async () => {
      const mockProject = { id: "proj-1", name: "To Delete" };

      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue(mockProject);
      vi.mocked(prisma.editorProject.delete).mockResolvedValue(mockProject);

      const result = await deleteProject("proj-1");
      expect(result).toEqual(mockProject);
      expect(prisma.editorProject.delete).toHaveBeenCalledWith({
        where: { id: "proj-1" },
      });
    });

    it("should return null for non-existent project", async () => {
      vi.mocked(prisma.editorProject.findUnique).mockResolvedValue(null);

      const result = await deleteProject("non-existent");
      expect(result).toBeNull();
    });
  });
});
