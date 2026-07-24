import type { ApiSuccess } from "@eventure/shared";
import { Router } from "express";

interface HealthData {
  status: "ok";
  timestamp: string;
}

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  const body: ApiSuccess<HealthData> = {
    success: true,
    message: "Eventure API is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  };

  response.status(200).json(body);
});
