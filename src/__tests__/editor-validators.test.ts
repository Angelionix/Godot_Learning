/**
 * Тесты для валидаторов Godot Web Editor API
 */

import { describe, it, expect } from "vitest";
import {
  createSessionSchema,
  heartbeatSessionSchema,
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  uploadFileSchema,
} from "@/validators/editor";

describe("Editor Validators", () => {
  describe("createSessionSchema", () => {
    it("should validate valid session creation", () => {
      const result = createSessionSchema.safeParse({
        projectSlug: "project-1-clicker",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with optional projectId", () => {
      const result = createSessionSchema.safeParse({
        projectSlug: "project-2-shooter",
        projectId: "clx1234567890abcdefghijklmnopqrstuvwxyz",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty projectSlug", () => {
      const result = createSessionSchema.safeParse({
        projectSlug: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long projectSlug", () => {
      const result = createSessionSchema.safeParse({
        projectSlug: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing projectSlug", () => {
      const result = createSessionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid projectId", () => {
      const result = createSessionSchema.safeParse({
        projectSlug: "project-1-clicker",
        projectId: "not-a-cuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("heartbeatSessionSchema", () => {
    it("should validate valid heartbeat", () => {
      const result = heartbeatSessionSchema.safeParse({
        sessionId: "clx1234567890abcdefghijklmnopqrstuvwxyz",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid sessionId", () => {
      const result = heartbeatSessionSchema.safeParse({
        sessionId: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createProjectSchema", () => {
    it("should validate valid project creation", () => {
      const result = createProjectSchema.safeParse({
        projectSlug: "project-1-clicker",
        name: "Мой кликер",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const result = createProjectSchema.safeParse({
        projectSlug: "project-1-clicker",
        name: "Мой кликер",
        description: "Описание проекта",
        templateSlug: "project-1-clicker",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createProjectSchema.safeParse({
        projectSlug: "project-1-clicker",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long name", () => {
      const result = createProjectSchema.safeParse({
        projectSlug: "project-1-clicker",
        name: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long description", () => {
      const result = createProjectSchema.safeParse({
        projectSlug: "project-1-clicker",
        name: "Test",
        description: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("should validate partial update", () => {
      const result = updateProjectSchema.safeParse({
        name: "Новое название",
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty update", () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject invalid name", () => {
      const result = updateProjectSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listProjectsSchema", () => {
    it("should validate empty params", () => {
      const result = listProjectsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate with projectSlug", () => {
      const result = listProjectsSchema.safeParse({
        projectSlug: "project-1-clicker",
      });
      expect(result.success).toBe(true);
    });

    it("should reject too long projectSlug", () => {
      const result = listProjectsSchema.safeParse({
        projectSlug: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("uploadFileSchema", () => {
    it("should validate valid upload", () => {
      const result = uploadFileSchema.safeParse({
        fileName: "main.gd",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with content type", () => {
      const result = uploadFileSchema.safeParse({
        fileName: "main.gd",
        contentType: "text/plain",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty fileName", () => {
      const result = uploadFileSchema.safeParse({
        fileName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long fileName", () => {
      const result = uploadFileSchema.safeParse({
        fileName: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });
});
