'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Опции хука
// ============================================================================

export interface UseAutoSaveOptions {
  /** Интервал автосохранения в миллисекундах. По умолчанию: 30000 (30 секунд) */
  intervalMs?: number;
  /** Включено ли автосохранение */
  enabled: boolean;
  /** Функция сохранения — вызывается периодически и вручную */
  onSave: () => Promise<void>;
}

// ============================================================================
// Возвращаемое значение хука
// ============================================================================

export interface UseAutoSaveReturn {
  /** Время последнего сохранения */
  lastSaved: Date | null;
  /** Выполняется ли сохранение в данный момент */
  isSaving: boolean;
  /** Сохранить вручную (немедленно) */
  saveNow: () => Promise<void>;
}

// ============================================================================
// Хук useAutoSave
// ============================================================================

/**
 * Хук для автоматического сохранения содержимого редактора
 * с заданным интервалом.
 *
 * Предотвращает параллельные сохранения и предоставляет
 * возможность ручного немедленного сохранения.
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const { intervalMs = 30000, enabled, onSave } = options;

  // Время последнего сохранения
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // Флаг текущего сохранения
  const [isSaving, setIsSaving] = useState(false);

  // Используем ref для onSave, чтобы избежать пересоздания интервала
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Ref для флага сохранения (для проверки внутри интервала)
  const isSavingRef = useRef(false);

  /**
   * Выполняет сохранение — общий метод для автосохранения и ручного.
   * Предотвращает параллельные вызовы (если уже идёт сохранение — пропускаем).
   */
  const performSave = useCallback(async () => {
    // Предотвращаем параллельное сохранение
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await onSaveRef.current();
      setLastSaved(new Date());
    } catch (error) {
      console.error('[useAutoSave] Ошибка при сохранении:', error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  /**
   * Ручное немедленное сохранение.
   */
  const saveNow = useCallback(async () => {
    await performSave();
  }, [performSave]);

  /**
   * Настройка интервала автосохранения.
   * Активируется только когда enabled === true.
   * Корректно очищается при размонтировании или изменении опций.
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, intervalMs, performSave]);

  return {
    lastSaved,
    isSaving,
    saveNow,
  };
}
