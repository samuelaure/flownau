import { apiLogger } from './logger';
import { AppError } from './exceptions';
import { ZodError } from 'zod';

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
};

export async function handleActionError(error: unknown, context?: string): Promise<ErrorResponse> {
  const log = apiLogger.child({ context });

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      log.error({ err: error, statusCode: error.statusCode }, error.message);
    } else {
      log.warn({ err: error, statusCode: error.statusCode }, error.message);
    }

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  if (error instanceof ZodError) {
    log.warn({ err: error }, 'Validation error');
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.flatten().fieldErrors,
      },
    };
  }

  // Generic unexpected error
  log.error({ err: error }, 'Unexpected error');
  const message = error instanceof Error ? error.message : 'An unknown error occurred';

  return {
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  };
}
