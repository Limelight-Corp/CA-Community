import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),

  // Database & Redis
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Security & JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ADMIN_SECRET: z.string().min(16, 'JWT_ADMIN_SECRET must be at least 16 chars'),
  DATA_ENCRYPTION_KEY: z.string().min(32, 'DATA_ENCRYPTION_KEY must be at least 32 chars'),

  // Admin Isolation & CORS
  ADMIN_API_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ADMIN_ALLOWED_ORIGIN: z.string().default('http://localhost:3001'),
  WEB_ALLOWED_ORIGIN: z.string().default('http://localhost:3000'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder_key'),
  RAZORPAY_KEY_SECRET: z.string().default('placeholder_secret_key'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('placeholder_webhook_secret'),

  // GST
  GST_RATE_PERCENTAGE: z.coerce.number().default(18),
  GSTIN: z.string().default('07AAAAA0000A1Z5'),
  COMPANY_NAME: z.string().default('ASCEND Chartered Accountants Community'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
