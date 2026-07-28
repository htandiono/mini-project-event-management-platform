import type { ApiFailure } from "@eventure/shared";
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { AppError } from "../lib/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const body: ApiFailure = {
      success: false,
      message: error.code === "LIMIT_FILE_SIZE" ? "Uploaded image is too large" : error.message,
      errors: [],
    };

    response.status(400).json(body);
    return;
  }

  if (error instanceof SyntaxError) {
    const body: ApiFailure = {
      success: false,
      message: "Malformed JSON payload",
      errors: [],
    };

    response.status(400).json(body);
    return;
  }

  if (error instanceof ZodError) {
    const body: ApiFailure = {
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };

    response.status(400).json(body);
    return;
  }

  if (error instanceof AppError) {
    const body: ApiFailure = {
      success: false,
      message: error.message,
      errors: error.errors,
    };

    response.status(error.statusCode).json(body);
    return;
  }

  const body: ApiFailure = {
    success: false,
    message: "Internal server error",
    errors: [],
  };

  response.status(500).json(body);
};
