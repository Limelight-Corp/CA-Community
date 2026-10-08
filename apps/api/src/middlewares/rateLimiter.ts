import rateLimit from 'express-rate-limit';
import { RateLimitExceededError } from '../errors/AppError';

export const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitExceededError('Too many requests, please slow down'));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitExceededError('Too many authentication attempts, please try again in 15 minutes'));
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitExceededError('Too many OTP requests, please wait before requesting another'));
  },
});
