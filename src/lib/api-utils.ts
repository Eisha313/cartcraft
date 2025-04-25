import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }

  static unprocessable(message: string, details?: unknown): ApiError {
    return new ApiError(message, 422, details);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, 500);
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return successResponse(data, undefined, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  error: string | Error | ApiError,
  statusCode: number = 500,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  let message: string;
  let status: number = statusCode;
  let errorDetails: unknown = details;

  if (error instanceof ApiError) {
    message = error.message;
    status = error.statusCode;
    errorDetails = error.details ?? details;
  } else if (error instanceof ZodError) {
    message = 'Validation failed';
    status = 400;
    errorDetails = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = error;
  }

  const response: ApiResponse<never> = {
    success: false,
    error: message,
  };

  if (errorDetails) {
    response.details = errorDetails;
  }

  return NextResponse.json(response, { status });
}

export async function parseRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;
  
  try {
    body = await request.json();
  } catch {
    throw ApiError.badRequest('Invalid JSON body');
  }

  const result = schema.safeParse(body);
  
  if (!result.success) {
    throw ApiError.badRequest(
      'Validation failed',
      result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  return result.data;
}

export function parseQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

export function getPaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 20), 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export type RouteHandler<T = unknown> = () => Promise<NextResponse<ApiResponse<T>>>;

export async function withErrorHandler<T>(
  handler: RouteHandler<T>
): Promise<NextResponse<ApiResponse<T | never>>> {
  try {
    return await handler();
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    if (error instanceof ZodError) {
      return errorResponse(error);
    }

    if (error instanceof Error) {
      // Don't expose internal error messages in production
      const message = process.env.NODE_ENV === 'development'
        ? error.message
        : 'Internal server error';
      return errorResponse(message, 500);
    }

    return errorResponse('An unexpected error occurred', 500);
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<ApiResponse<T[]>> {
  return successResponse(data, {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
}
