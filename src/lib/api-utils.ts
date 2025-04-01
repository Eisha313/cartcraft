import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse {
  const error: ApiError = { code, message };
  if (details) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}

export function parseFilters(searchParams: URLSearchParams): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {};

  const category = searchParams.get('category');
  if (category) filters.category = category;

  const minPrice = searchParams.get('minPrice');
  if (minPrice) filters.minPrice = minPrice;

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) filters.maxPrice = maxPrice;

  const inStock = searchParams.get('inStock');
  if (inStock) filters.inStock = inStock;

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const tags = searchParams.getAll('tags');
  if (tags.length > 0) filters.tags = tags;

  return filters;
}

export function parseSortParams(searchParams: URLSearchParams): { field: string; order: 1 | -1 } {
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

  const allowedSortFields = ['name', 'price', 'createdAt', 'stock'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  return { field, order: sortOrder };
}
