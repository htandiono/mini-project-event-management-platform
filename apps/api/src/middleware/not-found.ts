import type { RequestHandler } from "express";

import { AppError } from "../lib/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route ${request.method} ${request.path} was not found`, 404));
};
