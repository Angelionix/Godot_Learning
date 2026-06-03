'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Типы полезных нагрузок (payload types)
// ============================================================================

/** Данные о загруженном проекте */
export interface ProjectLoadedPayload {
  projectSlug: string;
  fileCount: number;
  timestamp: number;
}

/** Данные о сохранённом проекте */
export interface ProjectSavedPayload {
  files: Array<{
    path: string;
    size: number;
    modified: number;
  }>;
  totalSize: number;
  timestamp: number;
}

/** Результаты тестирования GUT */
export interface TestResultsPayload {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  tests: Array<{
    name: string;
    suite: string;
    status: 'pass' | 'fail' | 'skip';
    duration: number;
    message?: string; // сообщение об ошибке для упавших тестов
    line_number?: number;
    script: string;
  }>;
  timestamp: number;
}

/** Данные об ошибке редактора */
export interface ErrorPayload {
  message: string;
  code?: string;
  recoverable: boolean;
  timestamp: number;
}

/** Список файлов проекта */
export interface FilesListPayload {
  files: Array<{
    path: string;
    size: number;
    modified: number;
  }>;
  timestamp: number;
}

// ============================================================================
// Типы сообщений (message types)
// ============================================================================

/** Типы исходящих сообщений (Платформа → Редактор) */
export type PlatformOutgoingMessageType =
  | 'godot-learning-ping'
  | 'godot-learning-load-project'
  | 'godot-learning-save-project'
  | 'godot-learning-run-tests'
  | 'godot-learning-get-files'
  | 'godot-learning-set-theme'
  | 'godot-learning-navigate';

/** Типы входящих сообщений (Редактор → Платформа) */
export type EditorIncomingMessageType =
  | 'godot-editor-ready'
  | 'godot-editor-pong'
  | 'godot-editor-project-loaded'
  | 'godot-editor-project-saved'
  | 'godot-editor-test-results'
  | 'godot-editor-error'
  | 'godot-editor-files-list'
  | 'godot-editor-activity';

/** Префикс входящих сообщений от редактора */
const EDITOR_MESSAGE_PREFIX = 'godot-editor-';

// ============================================================================
// Структура сообщения
// ============================================================================

/** Формат всех сообщений между платформой и редактором */
export interface BridgeMessage<T = unknown> {
  type: string;
  payload?: T;
  timestamp: number;
}

// ============================================================================
// Вспомогательные типы полезных нагрузок исходящих сообщений
// ============================================================================

/** Полезная нагрузка для загрузки проекта */
interface LoadProjectPayload {
  projectId: string;
  projectSlug: string;
}

/** Полезная нагрузка для смены темы */
interface SetThemePayload {
  theme: 'dark' | 'light';
}

/** Полезная нагрузка для навигации к файлу */
interface NavigateToFilePayload {
  filePath: string;
}

// ============================================================================
// Опции хука
// ============================================================================

export interface UseGodotEditorOptions {
  /** Ссылка на iframe с редактором Godot */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Источник (origin) iframe редактора. По умолчанию: window.location.origin */
  editorOrigin?: string;
  /** Колбэк: редактор загружен и готов к работе */
  onReady?: () => void;
  /** Колбэк: проект загружен в редактор */
  onProjectLoaded?: (data: ProjectLoadedPayload) => void;
  /** Колбэк: проект сохранён */
  onProjectSaved?: (data: ProjectSavedPayload) => void;
  /** Колбэк: получены результаты тестирования */
  onTestResults?: (data: TestResultsPayload) => void;
  /** Колбэк: ошибка в редакторе */
  onError?: (data: ErrorPayload) => void;
  /** Колбэк: получен список файлов */
  onFilesList?: (data: FilesListPayload) => void;
  /** Колбэк: активность пользователя в редакторе (для heartbeat) */
  onActivity?: () => void;
}

// ============================================================================
// Возвращаемое значение хука
// ============================================================================

export interface UseGodotEditorReturn {
  /** Установлено ли соединение с редактором */
  isConnected: boolean;
  /** Время последней активности */
  lastActivity: Date | null;
  /** Отправить произвольное сообщение в редактор */
  sendMessage: (type: string, payload?: unknown) => void;
  /** Проверка доступности редактора (health check) */
  ping: () => void;
  /** Загрузить проект в редактор */
  loadProject: (projectId: string, projectSlug: string) => void;
  /** Сохранить текущий проект */
  saveProject: () => void;
  /** Запустить тесты GUT */
  runTests: () => void;
  /** Запросить список файлов проекта */
  getFiles: () => void;
  /** Установить тему редактора */
  setTheme: (theme: 'dark' | 'light') => void;
  /** Перейти к файлу в редакторе */
  navigateToFile: (filePath: string) => void;
}

// ============================================================================
// Хук useGodotEditor
// ============================================================================

/**
 * Хук для обмена сообщениями между платформой обучения Godot
 * и iframe редактора Godot через PostMessage API.
 *
 * Обеспечивает типизированный протокол взаимодействия,
 * отслеживание состояния соединения и активности.
 */
export function useGodotEditor(options: UseGodotEditorOptions): UseGodotEditorReturn {
  const {
    iframeRef,
    editorOrigin = typeof window !== 'undefined' ? window.location.origin : '',
    onReady,
    onProjectLoaded,
    onProjectSaved,
    onTestResults,
    onError,
    onFilesList,
    onActivity,
  } = options;

  // Состояние соединения с редактором
  const [isConnected, setIsConnected] = useState(false);
  // Время последней активности от редактора
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Используем refs для колбэков, чтобы избежать пересоздания обработчика
  const callbacksRef = useRef({
    onReady,
    onProjectLoaded,
    onProjectSaved,
    onTestResults,
    onError,
    onFilesList,
    onActivity,
  });

  // Обновляем refs при изменении колбэков
  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onProjectLoaded,
      onProjectSaved,
      onTestResults,
      onError,
      onFilesList,
      onActivity,
    };
  }, [onReady, onProjectLoaded, onProjectSaved, onTestResults, onError, onFilesList, onActivity]);

  /**
   * Отправляет сообщение в iframe редактора.
   * Все сообщения имеют формат: { type, payload?, timestamp }
   */
  const sendMessage = useCallback(
    (type: string, payload?: unknown) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        console.warn(`[useGodotEditor] Невозможно отправить сообщение: iframe недоступен (type=${type})`);
        return;
      }

      const message: BridgeMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };

      iframe.contentWindow.postMessage(message, editorOrigin);
    },
    [iframeRef, editorOrigin]
  );

  /**
   * Проверка доступности редактора (health check).
   * Отправляет ping-сообщение и ожидает pong.
   */
  const ping = useCallback(() => {
    sendMessage('godot-learning-ping');
  }, [sendMessage]);

  /**
   * Загрузить проект в редактор.
   * Передаёт идентификатор и slug проекта.
   */
  const loadProject = useCallback(
    (projectId: string, projectSlug: string) => {
      const payload: LoadProjectPayload = { projectId, projectSlug };
      sendMessage('godot-learning-load-project', payload);
    },
    [sendMessage]
  );

  /**
   * Сохранить текущий проект в редакторе.
   */
  const saveProject = useCallback(() => {
    sendMessage('godot-learning-save-project');
  }, [sendMessage]);

  /**
   * Запустить тесты GUT в редакторе.
   */
  const runTests = useCallback(() => {
    sendMessage('godot-learning-run-tests');
  }, [sendMessage]);

  /**
   * Запросить список файлов проекта у редактора.
   */
  const getFiles = useCallback(() => {
    sendMessage('godot-learning-get-files');
  }, [sendMessage]);

  /**
   * Установить тему редактора (тёмная/светлая).
   */
  const setTheme = useCallback(
    (theme: 'dark' | 'light') => {
      const payload: SetThemePayload = { theme };
      sendMessage('godot-learning-set-theme', payload);
    },
    [sendMessage]
  );

  /**
   * Перейти к указанному файлу в редакторе.
   */
  const navigateToFile = useCallback(
    (filePath: string) => {
      const payload: NavigateToFilePayload = { filePath };
      sendMessage('godot-learning-navigate', payload);
    },
    [sendMessage]
  );

  /**
   * Обработчик входящих сообщений от iframe редактора.
   * Проверяет origin, фильтрует по префиксу и маршрутизирует
   * по типу сообщения.
   */
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Проверяем источник сообщения
      if (event.origin !== editorOrigin) {
        return;
      }

      // Проверяем структуру сообщения
      const data = event.data;
      if (!data || typeof data.type !== 'string') {
        return;
      }

      // Обрабатываем только сообщения с префиксом редактора
      if (!data.type.startsWith(EDITOR_MESSAGE_PREFIX)) {
        return;
      }

      // Обновляем время последней активности
      setLastActivity(new Date());

      // Маршрутизация по типу сообщения
      switch (data.type as EditorIncomingMessageType) {
        case 'godot-editor-ready': {
          // Редактор загружен и готов к работе — устанавливаем соединение
          setIsConnected(true);
          callbacksRef.current.onReady?.();
          break;
        }

        case 'godot-editor-pong': {
          // Ответ на ping — подтверждаем соединение
          setIsConnected(true);
          break;
        }

        case 'godot-editor-project-loaded': {
          // Проект успешно загружен в редактор
          const payload = data.payload as ProjectLoadedPayload;
          callbacksRef.current.onProjectLoaded?.(payload);
          break;
        }

        case 'godot-editor-project-saved': {
          // Проект сохранён, получен манифест файлов
          const payload = data.payload as ProjectSavedPayload;
          callbacksRef.current.onProjectSaved?.(payload);
          break;
        }

        case 'godot-editor-test-results': {
          // Получены результаты тестирования GUT
          const payload = data.payload as TestResultsPayload;
          callbacksRef.current.onTestResults?.(payload);
          break;
        }

        case 'godot-editor-error': {
          // Редактор сообщил об ошибке
          const payload = data.payload as ErrorPayload;
          callbacksRef.current.onError?.(payload);
          break;
        }

        case 'godot-editor-files-list': {
          // Получен список файлов проекта
          const payload = data.payload as FilesListPayload;
          callbacksRef.current.onFilesList?.(payload);
          break;
        }

        case 'godot-editor-activity': {
          // Активность пользователя в редакторе (heartbeat)
          callbacksRef.current.onActivity?.();
          break;
        }

        default: {
          // Неизвестный тип сообщения — игнорируем
          console.warn(`[useGodotEditor] Неизвестный тип сообщения: ${data.type}`);
          break;
        }
      }
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [editorOrigin]);

  return {
    isConnected,
    lastActivity,
    sendMessage,
    ping,
    loadProject,
    saveProject,
    runTests,
    getFiles,
    setTheme,
    navigateToFile,
  };
}
