"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  File,
  FileCode,
  FileImage,
  FolderOpen,
  Upload,
  Download,
  Trash2,
  HardDrive,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { toast } from "sonner";

// === Типы ===

interface ProjectFile {
  name: string;
  key: string;
  size: number;
  lastModified: string;
}

interface ProjectFileBrowserProps {
  projectId: string;
  projectSlug: string;
}

// === Константы ===

const MAX_PROJECT_SIZE_MB = 50;
const MAX_PROJECT_SIZE_BYTES = MAX_PROJECT_SIZE_MB * 1024 * 1024;

// === Вспомогательные функции ===

/** Форматирует размер файла в B/KB/MB */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/** Форматирует дату в русской локали */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** Возвращает иконку файла по расширению */
function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "gd":
      return <FileCode className="size-4 text-[#478CBF] shrink-0" />;
    case "tscn":
      return <FileCode className="size-4 text-green-500 shrink-0" />;
    case "tres":
      return <FileCode className="size-4 text-orange-500 shrink-0" />;
    case "godot":
      return <FileCode className="size-4 text-[#478CBF] shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
    case "svg":
      return <FileImage className="size-4 text-purple-500 shrink-0" />;
    default:
      return <File className="size-4 text-muted-foreground shrink-0" />;
  }
}

/** Возвращает описание типа файла по расширению */
function getFileTypeLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "gd":
      return "GDScript";
    case "tscn":
      return "Сцена";
    case "tres":
      return "Ресурс";
    case "godot":
      return "Проект";
    case "png":
      return "PNG";
    case "jpg":
    case "jpeg":
      return "JPEG";
    case "webp":
      return "WebP";
    case "svg":
      return "SVG";
    case "wav":
    case "ogg":
    case "mp3":
      return "Аудио";
    case "cfg":
    case "ini":
      return "Конфиг";
    default:
      return ext?.toUpperCase() || "Файл";
  }
}

/** Определяет MIME-тип по расширению файла */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "gd":
      return "text/plain";
    case "tscn":
    case "tres":
    case "godot":
    case "cfg":
    case "ini":
      return "text/plain";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "json":
      return "application/json";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

// === Компонент ===

export function ProjectFileBrowser({
  projectId,
  projectSlug,
}: ProjectFileBrowserProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [s3Available, setS3Available] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка списка файлов
  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/editor/projects/${projectId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setTotalSize(data.totalSize || 0);
        setFileCount(data.fileCount || 0);
        setS3Available(data.s3Available !== false);
      } else {
        const error = await res.json();
        console.error("Failed to load files:", error);
        setS3Available(false);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
      setS3Available(false);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Загрузка файла
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];

    // Проверка размера файла
    if (file.size > MAX_PROJECT_SIZE_BYTES) {
      toast.error(
        `Файл слишком большой. Максимальный размер проекта — ${MAX_PROJECT_SIZE_MB} MB`
      );
      return;
    }

    // Проверка квоты
    if (totalSize + file.size > MAX_PROJECT_SIZE_BYTES) {
      toast.error(
        `Недостаточно места. Использовано ${formatBytes(totalSize)} из ${MAX_PROJECT_SIZE_MB} MB`
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);

    try {
      // Шаг 1: Получаем presigned URL
      const presignRes = await fetch(
        `/api/editor/projects/${projectId}/files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: getContentType(file.name),
          }),
        }
      );

      if (!presignRes.ok) {
        const error = await presignRes.json();
        throw new Error(error.error || "Не удалось получить URL для загрузки");
      }

      const { uploadUrl } = await presignRes.json();

      // Шаг 2: Загружаем файл по presigned URL
      setUploadProgress(30);

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": getContentType(file.name),
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Не удалось загрузить файл в хранилище");
      }

      setUploadProgress(90);

      // Шаг 3: Обновляем список файлов
      await loadFiles();
      setUploadProgress(100);

      toast.success(`Файл «${file.name}» загружен`);
    } catch (err: any) {
      toast.error(err.message || "Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName(null);
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Удаление файла
  const handleDelete = async (fileKey: string, fileName: string) => {
    setDeletingKey(fileKey);
    try {
      const res = await fetch(
        `/api/editor/projects/${projectId}/files?key=${encodeURIComponent(fileKey)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Не удалось удалить файл");
      }

      toast.success(`Файл «${fileName}» удалён`);
      await loadFiles();
    } catch (err: any) {
      toast.error(err.message || "Ошибка при удалении файла");
    } finally {
      setDeletingKey(null);
    }
  };

  // Скачивание файла
  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const res = await fetch(
        `/api/editor/projects/${projectId}/files?download=${encodeURIComponent(fileKey)}`
      );

      if (!res.ok) {
        throw new Error("Не удалось скачать файл");
      }

      // Если API возвращает redirect URL
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
          return;
        }
      }

      // Иначе скачиваем как blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Ошибка при скачивании файла");
    }
  };

  // Процент использования хранилища
  const storagePercent = Math.min(
    Math.round((totalSize / MAX_PROJECT_SIZE_BYTES) * 100),
    100
  );

  // Цвет прогресс-бара хранилища
  const getStorageColor = () => {
    if (storagePercent > 90) return "bg-red-500";
    if (storagePercent > 70) return "bg-yellow-500";
    return "bg-[#478CBF]";
  };

  // === Рендер ===

  // Состояние загрузки
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // S3 недоступен
  if (!s3Available) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <HardDrive className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Хранилище недоступно</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            S3 хранилище не настроено. Файловый браузер будет доступен после
            настройки MinIO/S3.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и кнопка загрузки */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-[#478CBF]" />
          <h3 className="font-medium">Файлы проекта</h3>
          <Badge variant="outline" className="text-xs">
            {fileCount} {fileCount === 1 ? "файл" : fileCount < 5 ? "файла" : "файлов"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            accept=".gd,.tscn,.tres,.godot,.png,.jpg,.jpeg,.webp,.svg,.wav,.ogg,.mp3,.cfg,.ini,.json,.txt,.xml,.csv"
          />
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Загрузить
          </Button>
        </div>
      </div>

      {/* Прогресс загрузки */}
      {uploading && uploadFileName && (
        <Card>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 truncate">
                <Loader2 className="size-3.5 animate-spin shrink-0" />
                <span className="truncate">{uploadFileName}</span>
              </span>
              <span className="text-muted-foreground shrink-0 ml-2">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-[#478CBF] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация о хранилище */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Хранилище</span>
            </div>
            <span className="text-sm font-medium">
              {formatBytes(totalSize)} / {MAX_PROJECT_SIZE_MB} MB
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getStorageColor()}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          {storagePercent > 70 && (
            <p className="text-xs text-yellow-600 mt-1.5">
              {storagePercent > 90
                ? "Хранилище почти заполнено! Удалите ненужные файлы."
                : "Хранилище заполняется. Обратите внимание на размер файлов."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Пустое состояние */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Upload className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">Нет файлов</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm">
              Загрузите файлы проекта — скрипты GDScript, сцены, ресурсы или
              изображения. Они будут доступны в Godot Web Editor.
            </p>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              Загрузить первый файл
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Список файлов */
        <Card>
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.key}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                {/* Иконка файла */}
                {getFileIcon(file.name)}

                {/* Информация о файле */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {file.name}
                    </span>
                    <Badge variant="ghost" className="text-[10px] px-1 py-0">
                      {getFileTypeLabel(file.name)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDownload(file.key, file.name)}
                    title="Скачать"
                  >
                    <Download className="size-3.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        disabled={deletingKey === file.key}
                        title="Удалить"
                      >
                        {deletingKey === file.key ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить файл?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Файл &laquo;{file.name}&raquo; ({formatBytes(file.size)})
                          будет удалён без возможности восстановления.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(file.key, file.name)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
