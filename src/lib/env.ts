import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_COOKIE_NAME: z.string().default("barbearia_session"),
  UAZAPI_BASE_URL: z.string().url().optional(),
  UAZAPI_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  TZ: z.string().default("America/Sao_Paulo"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
  UAZAPI_BASE_URL: process.env.UAZAPI_BASE_URL,
  UAZAPI_TOKEN: process.env.UAZAPI_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TZ: process.env.TZ,
  NODE_ENV: process.env.NODE_ENV,
});
