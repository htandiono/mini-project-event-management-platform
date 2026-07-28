import "dotenv/config";

import { defineConfig, env } from "prisma/config";

const databaseUrl =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || env("DATABASE_URL");

process.env.DATABASE_URL ||= databaseUrl;

export default defineConfig({
  engine: "classic",
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
