import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type RequestHandler, type Response } from "express";
import helmetModule from "helmet";

import { getEnv } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

type HelmetFactory = () => RequestHandler;

const createHelmet =
  typeof helmetModule === "function"
    ? (helmetModule as unknown as HelmetFactory)
    : (helmetModule as unknown as { default: HelmetFactory }).default;

export interface CreateAppOptions {
  frontendUrl: string;
  frontendPreviewUrl?: string;
}

export function createApp({ frontendUrl, frontendPreviewUrl }: CreateAppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.use(createHelmet());
  app.use(
    cors({
      credentials: true,
      origin: frontendPreviewUrl ? [frontendUrl, frontendPreviewUrl] : frontendUrl,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

let runtimeApp: ReturnType<typeof createApp> | undefined;

export default function handler(request: Request, response: Response) {
  const env = getEnv();
  runtimeApp ??= createApp({
    frontendUrl: env.FRONTEND_URL,
    frontendPreviewUrl: env.FRONTEND_PREVIEW_URL,
  });

  runtimeApp(request, response);
}
