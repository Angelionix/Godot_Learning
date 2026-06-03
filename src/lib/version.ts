/**
 * Версия приложения — единый источник правды.
 * Обновлять при каждом релизе в соответствии с docs/versioning.md
 *
 * Формат: MAJOR.MINOR.PATCH (SemVer 2.0.0)
 */

export const APP_VERSION = "0.8.0";

/**
 * Возвращает версию в формате для отображения
 */
export function getVersionDisplay(): string {
  return `v${APP_VERSION}`;
}

/**
 * Возвращает ссылку на changelog
 */
export function getChangelogUrl(): string {
  return "https://github.com/Angelionix/Godot_Learning/blob/main/docs/versioning.md";
}
