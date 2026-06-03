/**
 * Тесты для S3-клиента и сервиса хранилища
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокируем @aws-sdk/client-s3
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn().mockImplementation((input) => input),
  GetObjectCommand: vi.fn().mockImplementation((input) => input),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => input),
  ListObjectsV2Command: vi.fn().mockImplementation((input) => input),
  HeadObjectCommand: vi.fn().mockImplementation((input) => input),
  CopyObjectCommand: vi.fn().mockImplementation((input) => input),
  CreateBucketCommand: vi.fn().mockImplementation((input) => input),
  HeadBucketCommand: vi.fn().mockImplementation((input) => input),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
}));

import {
  getProjectS3Key,
  getTemplateS3Key,
  isS3Configured,
  MAX_PROJECT_SIZE,
  S3_BUCKET_NAME,
} from "@/lib/s3";

describe("S3 Client Configuration", () => {
  it("should have correct default bucket name", () => {
    expect(S3_BUCKET_NAME).toBe("user-projects");
  });

  it("should have 50MB max project size", () => {
    expect(MAX_PROJECT_SIZE).toBe(50 * 1024 * 1024);
  });

  it("should detect when S3 is not configured in test environment", () => {
    // В тестовой среде S3_ENDPOINT не задан
    const originalEnv = process.env.S3_ENDPOINT;
    delete process.env.S3_ENDPOINT;
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    expect(isS3Configured()).toBe(false);

    // Восстанавливаем
    if (originalEnv) process.env.S3_ENDPOINT = originalEnv;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should detect S3 configuration when S3_ENDPOINT is set", () => {
    const original = process.env.S3_ENDPOINT;
    process.env.S3_ENDPOINT = "http://localhost:9000";

    expect(isS3Configured()).toBe(true);

    if (original) process.env.S3_ENDPOINT = original;
    else delete process.env.S3_ENDPOINT;
  });
});

describe("getProjectS3Key", () => {
  it("should generate correct key without filename", () => {
    const key = getProjectS3Key("user-1", "project-1-clicker", "proj-123");
    expect(key).toBe("user-1/project-1-clicker/proj-123/");
  });

  it("should generate correct key with filename", () => {
    const key = getProjectS3Key("user-1", "project-1-clicker", "proj-123", "main.gd");
    expect(key).toBe("user-1/project-1-clicker/proj-123/main.gd");
  });

  it("should handle special characters in filename", () => {
    const key = getProjectS3Key("user-1", "project-2-shooter", "proj-456", "scripts/player.gd");
    expect(key).toBe("user-1/project-2-shooter/proj-456/scripts/player.gd");
  });
});

describe("getTemplateS3Key", () => {
  it("should generate correct template key without filename", () => {
    const key = getTemplateS3Key("project-1-clicker");
    expect(key).toBe("templates/project-1-clicker/");
  });

  it("should generate correct template key with filename", () => {
    const key = getTemplateS3Key("project-1-clicker", "project.godot");
    expect(key).toBe("templates/project-1-clicker/project.godot");
  });
});
