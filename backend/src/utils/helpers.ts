import { v4 as uuidv4 } from 'uuid';
import { PaginationMeta } from '../types';

/**
 * Generate a new UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Remove sensitive fields from a user object
 */
export function sanitizeUser(user: Record<string, any>): Record<string, any> {
  const { passwordHash, password_hash, ...sanitized } = user;
  return sanitized;
}

/**
 * Format an error into a consistent response shape
 */
export function formatError(err: unknown): { message: string; code?: string } {
  if (err instanceof Error) {
    return {
      message: err.message,
      code: (err as any).code,
    };
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  return { message: 'An unexpected error occurred' };
}

/**
 * Generate pagination metadata
 */
export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Parse pagination query params safely
 */
export function parsePagination(
  pageStr: unknown,
  limitStr: unknown,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(pageStr || '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(limitStr || '20'), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Hash a string using SHA-256 (for token storage)
 */
import crypto from 'crypto';
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
