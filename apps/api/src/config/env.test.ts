import { describe, expect, it } from "vitest";

import { getEnv } from "./env.js";

const baseEnv = {
  FRONTEND_URL: "https://eventure.example",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_USER: "test",
  SMTP_PASS: "test",
  MAIL_FROM: "Eventure <no-reply@example.com>",
};

describe("getEnv", () => {
  it("accepts the Vercel Supabase pooled URL", () => {
    const env = getEnv({
      ...baseEnv,
      POSTGRES_PRISMA_URL: "postgresql://supabase.example/eventure",
    });

    expect(env.POSTGRES_PRISMA_URL).toBe("postgresql://supabase.example/eventure");
  });

  it("accepts paired Supabase Storage credentials", () => {
    const env = getEnv({
      ...baseEnv,
      POSTGRES_PRISMA_URL: "postgresql://supabase.example/eventure",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(env.SUPABASE_URL).toBe("https://project.supabase.co");
  });

  it("rejects incomplete Supabase Storage credentials", () => {
    expect(() =>
      getEnv({
        ...baseEnv,
        POSTGRES_PRISMA_URL: "postgresql://supabase.example/eventure",
        SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toThrow("Invalid environment configuration: SUPABASE_URL");
  });

  it("keeps supporting the local DATABASE_URL", () => {
    const env = getEnv({
      ...baseEnv,
      DATABASE_URL: "postgresql://localhost/eventure",
    });

    expect(env.DATABASE_URL).toBe("postgresql://localhost/eventure");
  });

  it("rejects configuration without a database URL", () => {
    expect(() => getEnv(baseEnv)).toThrow("Invalid environment configuration: DATABASE_URL");
  });
});
