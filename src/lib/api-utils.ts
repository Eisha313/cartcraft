import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatValidationErrors } from './validation';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource') {
    return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static unprocessable(message: string, details?: Record<string, unknown>) {
    return new ApiError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable') {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return successResponse(data, undefined, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        errors: formatValidationErrors(error),
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.details && { errors: error.details }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : defaultMessage;
    
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: defaultMessage,
    },
    { status: 500 }
  );
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number
): NonNullable<ApiResponse['meta']> {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(error);
  }
}

// Request body parsing helper
export async function parseRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}
