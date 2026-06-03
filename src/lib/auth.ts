/**
 * Authentication utilities.
 *
 * Currently the platform operates without authentication (TD-004: deferred).
 * All API routes use DEFAULT_USER_ID. When NextAuth.js is integrated,
 * replace getUserId() with session-based user identification.
 *
 * @see docs/tech-debt.md — TD-004 (Auth)
 */

/** Default user ID used while authentication is not implemented */
export const DEFAULT_USER_ID = 'default-user';

/**
 * Get the current user ID.
 *
 * TODO (TD-004): Replace with NextAuth session lookup:
 * ```
 * import { getServerSession } from 'next-auth';
 * const session = await getServerSession(authOptions);
 * return session?.user?.id ?? null;
 * ```
 *
 * For now, returns the default user ID.
 */
export function getUserId(): string {
  return DEFAULT_USER_ID;
}

/**
 * Get the current user ID or throw if not authenticated.
 * Use in API routes that require authentication (once TD-004 is resolved).
 */
export function requireUserId(): string {
  // TODO (TD-004): Throw UnauthorizedError when auth is enabled
  return DEFAULT_USER_ID;
}
