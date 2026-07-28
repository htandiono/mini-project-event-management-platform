import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmetModule from "helmet";

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
}

export function createApp({ frontendUrl }: CreateAppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.use(createHelmet());
  app.use(
    cors({
      credentials: true,
      origin: frontendUrl,
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
