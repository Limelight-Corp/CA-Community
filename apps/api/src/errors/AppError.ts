import { ApiErrorDetail } from '@ascend/shared';

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly details?: ApiErrorDetail[];

  constructor(message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'FORBIDDEN';
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
}

export class SudoRequiredError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'SUDO_REQUIRED';
}

export class RateLimitExceededError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';
}
