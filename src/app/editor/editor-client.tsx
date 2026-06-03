"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gamepad2,
  Play,
  Square,
  FolderOpen,
  Plus,
  Clock,
  AlertTriangle,
  Loader2,
  Monitor,
  Save,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Info,
  FlaskConical,
  CheckCheck,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ProjectFileBrowser } from "@/components/editor/project-file-browser";
import { GradingButton } from "@/components/editor/grading-button";
import { GradingResults, type GradingSubmission } from "@/components/editor/grading-results";
import { useGodotEditor } from "@/hooks/use-godot-editor";
import { useAutoSave } from "@/hooks/use-auto-save";

// === Типы ===

interface EditorSession {
  id: string;
  projectSlug: string;
  status: string;
  editorUrl: string | null;
  expiresAt: string;
  lastActivity: string;
  createdAt: string;
}

interface EditorProject {
  id: string;
  projectSlug: string;
  name: string;
  description: string | null;
  sizeBytes: number;
  fileCount: number;
  templateSlug: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectTemplate {
  slug: string;
  name: string;
  description: string;
  difficulty: string;
  icon: string;
}

// === Шаблоны проектов ===

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    slug: "project-1-clicker",
    name: "Кликер / Idle-игра",
    description: "Сигналы, UI, сохранения — основы Godot",
    difficulty: "Начальный",
    icon: "👆",
  },
  {
    slug: "project-2-space-shooter",
    name: "Космический шутер",
    description: "Физика 2D, столкновения, спавн врагов",
    difficulty: "Средний",
    icon: "🚀",
  },
  {
    slug: "project-3-metroidvania",
    name: "Метроидвания",
    description: "State Machine, AnimationTree, карта уровней",
    difficulty: "Продвинутый",
    icon: "🗺️",
  },
  {
    slug: "project-4-tower-defense",
    name: "Tower Defense",
    description: "C++/GDExtension, путь врагов, тайлы",
    difficulty: "Продвинутый",
    icon: "🏰",
  },
  {
    slug: "project-5-3d-adventure",
    name: "3D Приключение",
    description: "3D-физика, CSG, камеры, навигация",
    difficulty: "Сложный",
    icon: "🎮",
  },
  {
    slug: "project-6-performance-demo",
    name: "Performance Demo",
    description: "Оптимизация, профайлинг, compute-шейдеры",
    difficulty: "Экспертный",
    icon: "⚡",
  },
];

// === Компонент ===

export function EditorClient() {
  const [session, setSession] = useState<EditorSession | null>(null);
  const [projects, setProjects] = useState<EditorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorLoading, setEditorLoading] = useState(false);
  const [sabSupported, setSabSupported] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSlug, setNewProjectSlug] = useState("project-1-clicker");
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<GradingSubmission | null>(null);
  const [showGrading, setShowGrading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PostMessage API Bridge
  const godotEditor = useGodotEditor({
    iframeRef,
    onReady: () => {
      toast.success("Godot Editor загружен");
    },
    onTestResults: (data) => {
      const submission: GradingSubmission = {
        id: "live-" + Date.now(),
        status: data.summary.failed === 0 ? "passed" : "failed",
        totalTests: data.summary.total,
        passedTests: data.summary.passed,
        failedTests: data.summary.failed,
        skippedTests: data.summary.skipped,
        duration: data.summary.duration,
        xpEarned: 0,
        testResults: data.tests,
        createdAt: new Date(),
      };
      setGradingSubmission(submission);
      setShowGrading(true);
    },
    onError: (data) => {
      if (!data.recoverable) {
        toast.error(`Ошибка редактора: ${data.message}`);
      }
    },
  });

  // Auto-save every 30 seconds when editor is active
  const autoSave = useAutoSave({
    intervalMs: 30_000,
    enabled: session?.status === "active",
    onSave: async () => {
      godotEditor.saveProject();
    },
  });

  // Проверяем поддержку SharedArrayBuffer
  useEffect(() => {
    try {
      new SharedArrayBuffer(1);
      setSabSupported(true);
    } catch {
      setSabSupported(false);
    }
  }, []);

  // Загружаем проекты при монтировании
  useEffect(() => {
    loadProjects();
    loadActiveSession();
  }, []);

  // Heartbeat для поддержания сессии
  useEffect(() => {
    if (session?.status === "active" && session.id) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/editor/session/${session.id}`, {
            method: "PATCH",
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status !== "active") {
              setSession(null);
              toast.error("Сессия редактора истекла");
            }
          }
        } catch {
          // Сетевая ошибка — не критично
        }
      }, 60_000); // Каждую минуту

      setHeartbeatInterval(interval);
      return () => clearInterval(interval);
    }
  }, [session?.id, session?.status]);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/editor/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSession = async () => {
    try {
      const res = await fetch("/api/editor/session");
      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.status === "active") {
          setSession(data.session);
        }
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const startSession = async (projectSlug: string) => {
    setEditorLoading(true);
    try {
      const res = await fetch("/api/editor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Не удалось создать сессию");
      }

      const data = await res.json();
      setSession(data);
      toast.success("Сессия редактора создана");
    } catch (err: any) {
      toast.error(err.message || "Ошибка при создании сессии");
    } finally {
      setEditorLoading(false);
    }
  };

  const closeSession = async () => {
    if (!session?.id) return;

    try {
      const res = await fetch(`/api/editor/session/${session.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSession(null);
        toast.success("Сессия закрыта");
      }
    } catch (err) {
      console.error("Failed to close session:", err);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Введите название проекта");
      return;
    }

    try {
      const res = await fetch("/api/editor/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug: newProjectSlug,
          name: newProjectName.trim(),
          templateSlug: newProjectSlug,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Не удалось создать проект");
      }

      toast.success("Проект создан");
      setCreateDialogOpen(false);
      setNewProjectName("");
      loadProjects();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/editor/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Проект удалён");
        loadProjects();
      }
    } catch (err) {
      toast.error("Ошибка при удалении проекта");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
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
  };

  const getTemplateInfo = (slug: string) =>
    PROJECT_TEMPLATES.find((t) => t.slug === slug);

  // Если есть активная сессия — показываем редактор
  if (session?.status === "active" && session.editorUrl) {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Gamepad2 className="size-5 text-[#478CBF]" />
            <span className="font-medium text-sm">
              {getTemplateInfo(session.projectSlug)?.name || session.projectSlug}
            </span>
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="size-3" />
              До {new Date(session.expiresAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {autoSave.lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="size-3" />
                Сохранено {autoSave.lastSaved.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => godotEditor.saveProject()}>
              <Save className="size-3.5" />
              Сохранить
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <Download className="size-3.5" />
              Скачать
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-[#478CBF]/50 text-[#478CBF]"
              onClick={() => godotEditor.runTests()}
            >
              <FlaskConical className="size-3.5" />
              Проверить
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={closeSession}
              className="gap-1"
            >
              <Square className="size-3.5" />
              Закрыть
            </Button>
          </div>
        </div>

        {/* Godot Editor iframe */}
        <div className="flex-1 relative">
          {editorLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center space-y-4">
                <Loader2 className="size-12 text-[#478CBF] animate-spin mx-auto" />
                <p className="text-lg font-medium">Загрузка Godot Editor...</p>
                <p className="text-sm text-muted-foreground">
                  Это может занять 10-30 секунд
                </p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={session.editorUrl}
            className="w-full h-full border-0"
            title="Godot Web Editor"
            allow="cross-origin-isolated"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            onLoad={() => setEditorLoading(false)}
          />
        </div>
      </div>
    );
  }

  // Список проектов и создание сессии
  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      {/* Заголовок */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gamepad2 className="size-8 text-[#478CBF]" />
          Godot Web Editor
        </h1>
        <p className="text-muted-foreground text-lg">
          Создавайте игры прямо в браузере с полноценным Godot Editor.
          Выберите проект курса или создайте свой.
        </p>
      </div>

      {/* Предупреждение о SharedArrayBuffer */}
      {!sabSupported && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="size-5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-500">
                SharedArrayBuffer не поддерживается
              </p>
              <p className="text-sm text-muted-foreground">
                Для работы Godot Web Editor необходимы заголовки COOP/COEP.
                Убедитесь, что сервер настроен правильно (Docker + Nginx).
                Без этого редактор может работать нестабильно.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="size-4" />
            Мои проекты
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Plus className="size-4" />
            Создать из шаблона
          </TabsTrigger>
          {selectedProjectId && (
            <TabsTrigger value="files" className="gap-1.5">
              <Monitor className="size-4" />
              Файлы
            </TabsTrigger>
          )}
        </TabsList>

        {/* Мои проекты */}
        <TabsContent value="projects" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="size-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет проектов</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Создайте первый проект из шаблона курса, чтобы начать работу
                  в Godot Web Editor
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
                  <Plus className="size-4" />
                  Создать проект
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => {
                const template = getTemplateInfo(project.projectSlug);
                return (
                  <Card key={project.id} className="group relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {template?.icon || "📁"}
                          </span>
                          <div>
                            <CardTitle className="text-base">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {template?.name || project.projectSlug}
                            </CardDescription>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Проект &laquo;{project.name}&raquo; и все его файлы
                                будут удалены без возможности восстановления.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProject(project.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Monitor className="size-3" />
                          {project.fileCount} файлов
                        </span>
                        <span>{formatBytes(project.sizeBytes)}</span>
                        {project.lastOpenedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDate(project.lastOpenedAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-1.5"
                          onClick={() => startSession(project.projectSlug)}
                          disabled={editorLoading}
                        >
                          {editorLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Play className="size-4" />
                          )}
                          Открыть в редакторе
                        </Button>
                        <GradingButton
                          projectId={project.id}
                          projectSlug={project.projectSlug}
                          onResults={(results) => {
                            setGradingSubmission(results);
                            setShowGrading(true);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedProjectId(project.id)}
                          title="Файлы проекта"
                        >
                          <FolderOpen className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Файлы проекта */}
        {selectedProjectId && (
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Файлы проекта</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProjectId(null)}
              >
                Назад к проектам
              </Button>
            </div>
            <ProjectFileBrowser
              projectId={selectedProjectId}
              projectSlug={projects.find((p) => p.id === selectedProjectId)?.projectSlug || ""}
            />
          </TabsContent>
        )}

        {/* Создать из шаблона */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROJECT_TEMPLATES.map((template) => (
              <Card
                key={template.slug}
                className="group hover:border-[#478CBF]/50 transition-colors cursor-pointer"
                onClick={() => {
                  setNewProjectSlug(template.slug);
                  setNewProjectName(template.name);
                  setCreateDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-sm">
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Информационная секция */}
      <Separator />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="size-4 text-[#478CBF]" />
              Требования
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Браузер с поддержкой SharedArrayBuffer (Chrome, Edge, Firefox)</p>
            <p>Заголовки COOP/COEP для изоляции</p>
            <p>Минимум 2 GB оперативной памяти</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4 text-[#478CBF]" />
              Сессии
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Длительность сессии: 2 часа</p>
            <p>Лимит: 1 активная сессия</p>
            <p>Автоматическое продление при активности</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="size-4 text-[#478CBF]" />
              Хранилище
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Квота: 50 MB на проект</p>
            <p>Файлы хранятся в S3/MinIO</p>
            <p>Возможность скачать .zip архив</p>
          </CardContent>
        </Card>
      </div>

      {/* Диалог создания проекта */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать проект</DialogTitle>
            <DialogDescription>
              Создайте новый проект на основе шаблона курса. Файлы шаблона будут
              скопированы в ваш проект.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Шаблон</Label>
              <select
                value={newProjectSlug}
                onChange={(e) => {
                  setNewProjectSlug(e.target.value);
                  const t = getTemplateInfo(e.target.value);
                  if (t) setNewProjectName(t.name);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PROJECT_TEMPLATES.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.icon} {t.name} — {t.difficulty}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Название проекта</Label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Мой проект"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={createProject} className="gap-1.5">
              <Plus className="size-4" />
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Результаты автогрейдинга */}
      <Dialog open={showGrading} onOpenChange={setShowGrading}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {gradingSubmission && (
            <GradingResults
              submission={gradingSubmission}
              onRetry={() => {
                setShowGrading(false);
                if (selectedProjectId) {
                  const project = projects.find((p) => p.id === selectedProjectId);
                  if (project) {
                    fetch(`/api/submit/${project.id}`, { method: "POST" })
                      .then((res) => res.json())
                      .then((data) => {
                        setGradingSubmission(data);
                      });
                  }
                }
              }}
              onClose={() => setShowGrading(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
