import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  // e.g. 15m, 1h, 7d, 60s, or a number-of-seconds string like "900"
  JWT_EXPIRY: z.string().regex(/^\d+(ms|s|m|h|d|w|y)?$/, 'JWT_EXPIRY must be like 15m / 1h / 7d').default('15m'),
  JWT_REFRESH_EXPIRY: z.string().regex(/^\d+(ms|s|m|h|d|w|y)?$/, 'JWT_REFRESH_EXPIRY must be like 15m / 1h / 7d').default('7d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
