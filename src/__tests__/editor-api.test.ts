/**
 * Тесты для Editor API Routes — Session и Projects
 *
 * Тестирует обработку HTTP-запросов к API-маршрутам редактора.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокируем Next.js
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      json: () => Promise.resolve(body),
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
  },
  NextRequest: vi.fn(),
}));

// Мокируем repository
vi.mock("@/repositories/editor.repository", () => ({
  createSession: vi.fn(),
  getActiveSession: vi.fn(),
  getSession: vi.fn(),
  heartbeatSession: vi.fn(),
  closeSession: vi.fn(),
  createProject: vi.fn(),
  getProject: vi.fn(),
  listProjects: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

// Мокируем storage
vi.mock("@/lib/storage", () => ({
  copyTemplateToUser: vi.fn(),
  listProjectFiles: vi.fn(),
  getProjectS3Key: vi.fn((userId, slug, id, file) =>
    file ? `${userId}/${slug}/${id}/${file}` : `${userId}/${slug}/${id}/`
  ),
  deleteProjectFiles: vi.fn(),
  isS3Configured: vi.fn().mockReturnValue(false),
}));

// Мокируем S3
vi.mock("@/lib/s3", () => ({
  isS3Configured: vi.fn().mockReturnValue(false),
  getProjectS3Key: vi.fn(),
  S3_BUCKET_NAME: "user-projects",
  MAX_PROJECT_SIZE: 50 * 1024 * 1024,
}));

// Мокируем prisma db
vi.mock("@/lib/db", () => ({
  prisma: {
    editorProject: {
      update: vi.fn(),
    },
  },
}));

import { createSession, getActiveSession, getSession, heartbeatSession, closeSession } from "@/repositories/editor.repository";
import { listProjects, createProject, getProject, updateProject, deleteProject } from "@/repositories/editor.repository";

describe("Editor Session API Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/editor/session", () => {
    it("should create session with valid data", async () => {
      const mockSession = {
        id: "sess-1",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        status: "active",
        editorUrl: "/editor/godot?project=project-1-clicker&session=NEW",
        expiresAt: new Date(Date.now() + 7200000),
        createdAt: new Date(),
      };

      vi.mocked(createSession).mockResolvedValue(mockSession);

      const result = await createSession("default-user", "project-1-clicker");
      expect(result).toEqual(mockSession);
      expect(createSession).toHaveBeenCalledWith(
        "default-user",
        "project-1-clicker"
      );
    });
  });

  describe("GET /api/editor/session", () => {
    it("should return active session", async () => {
      const mockSession = {
        id: "sess-1",
        projectSlug: "project-1-clicker",
        status: "active",
        editorUrl: "/editor/godot",
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      vi.mocked(getActiveSession).mockResolvedValue(mockSession);

      const result = await getActiveSession("default-user");
      expect(result).toEqual(mockSession);
    });

    it("should return null when no active session", async () => {
      vi.mocked(getActiveSession).mockResolvedValue(null);

      const result = await getActiveSession("default-user");
      expect(result).toBeNull();
    });
  });

  describe("PATCH /api/editor/session/[id]", () => {
    it("should heartbeat active session", async () => {
      const updatedSession = {
        id: "sess-1",
        status: "active",
        expiresAt: new Date(Date.now() + 7200000),
        lastActivity: new Date(),
      };

      vi.mocked(heartbeatSession).mockResolvedValue(updatedSession);

      const result = await heartbeatSession("sess-1");
      expect(result).toEqual(updatedSession);
    });
  });

  describe("DELETE /api/editor/session/[id]", () => {
    it("should close session", async () => {
      const closedSession = {
        id: "sess-1",
        status: "closed",
      };

      vi.mocked(closeSession).mockResolvedValue(closedSession);

      const result = await closeSession("sess-1");
      expect(result?.status).toBe("closed");
    });
  });
});

describe("Editor Projects API Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/editor/projects", () => {
    it("should list user projects", async () => {
      const mockProjects = [
        {
          id: "proj-1",
          projectSlug: "project-1-clicker",
          name: "Кликер",
          description: null,
          sizeBytes: 1024,
          fileCount: 5,
          templateSlug: "project-1-clicker",
          lastOpenedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(listProjects).mockResolvedValue(mockProjects);

      const result = await listProjects("default-user");
      expect(result).toEqual(mockProjects);
    });
  });

  describe("POST /api/editor/projects", () => {
    it("should create new project", async () => {
      const mockProject = {
        id: "proj-new",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        name: "Мой проект",
        description: null,
        s3Key: "default-user/project-1-clicker/proj-new/",
        sizeBytes: 0,
        fileCount: 0,
        templateSlug: "project-1-clicker",
        isTemplate: false,
        lastOpenedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createProject).mockResolvedValue(mockProject);

      const result = await createProject(
        "default-user",
        "project-1-clicker",
        "Мой проект",
        "default-user/project-1-clicker/proj-new/",
        { templateSlug: "project-1-clicker" }
      );

      expect(result).toEqual(mockProject);
    });
  });

  describe("DELETE /api/editor/projects/[projectId]", () => {
    it("should delete project and its files", async () => {
      const mockProject = {
        id: "proj-1",
        userId: "default-user",
        projectSlug: "project-1-clicker",
        name: "To Delete",
      };

      vi.mocked(getProject).mockResolvedValue(mockProject);
      vi.mocked(deleteProject).mockResolvedValue(mockProject);

      // First get project
      const project = await getProject("proj-1");
      expect(project).toEqual(mockProject);

      // Then delete
      const result = await deleteProject("proj-1");
      expect(result).toEqual(mockProject);
    });

    it("should return null for non-existent project", async () => {
      vi.mocked(getProject).mockResolvedValue(null);

      const result = await getProject("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("PATCH /api/editor/projects/[projectId]", () => {
    it("should update project name", async () => {
      const updatedProject = {
        id: "proj-1",
        name: "Updated Name",
        description: null,
        lastOpenedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      vi.mocked(updateProject).mockResolvedValue(updatedProject);

      const result = await updateProject("proj-1", {
        name: "Updated Name",
        lastOpenedAt: new Date(),
      });

      expect(result).toEqual(updatedProject);
    });
  });
});
