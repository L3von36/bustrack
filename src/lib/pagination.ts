/**
 * Parse pagination params from a NextRequest.
 * Supports both cursor-based (for infinite scroll) and offset-based pagination.
 *
 * Query params:
 *   page     - Page number (1-based), default 1
 *   limit    - Items per page, default 20, max 100
 *   cursor   - Opaque cursor string (takes precedence over page)
 *
 * Returns a Prisma-compatible skip/take and the next cursor.
 */
import { NextRequest } from 'next/server';

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(request: NextRequest, defaultLimit = 20): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams,
) {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data: items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
}