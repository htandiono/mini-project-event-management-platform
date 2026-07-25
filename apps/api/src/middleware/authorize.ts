import type { UserRole } from "@eventure/shared";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error.js";

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }

    next();
  };
}
