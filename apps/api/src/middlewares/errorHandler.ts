import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '@ascend/shared';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Unhandled / Internal Server Error
  console.error('Unhandled internal error:', err);

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message,
    },
  };

  res.status(500).json(response);
}
