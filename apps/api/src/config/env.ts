import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1).optional(),
    POSTGRES_PRISMA_URL: z.string().min(1).optional(),
    POSTGRES_URL_NON_POOLING: z.string().min(1).optional(),
    FRONTEND_URL: z.url(),
    FRONTEND_PREVIEW_URL: z.url().optional(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    MAIL_FROM: z.string().min(1),
  })
  .refine((env) => env.DATABASE_URL || env.POSTGRES_PRISMA_URL, {
    message: "DATABASE_URL or POSTGRES_PRISMA_URL is required",
    path: ["DATABASE_URL"],
  });

const mailEnvSchema = envSchema.refine(
  (env) =>
    Boolean(env.RESEND_API_KEY) ||
    Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS),
  {
    message: "RESEND_API_KEY or complete SMTP credentials are required",
    path: ["SMTP_HOST"],
  },
);

const storageEnvSchema = mailEnvSchema.refine(
  (env) => Boolean(env.SUPABASE_URL) === Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  {
    message: "Supabase Storage URL and service role key must be configured together",
    path: ["SUPABASE_URL"],
  },
);

export type AppEnv = z.infer<typeof storageEnvSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = storageEnvSchema.safeParse(source);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${missing}`);
  }

  return result.data;
}
