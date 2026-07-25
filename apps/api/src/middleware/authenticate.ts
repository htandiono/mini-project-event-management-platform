import { prisma } from "@eventure/database";
import type { AuthUser } from "@eventure/shared";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { asyncHandler } from "../lib/async-handler.js";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token = req.cookies?.accessToken as string | undefined;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    try {
      const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt !== null) {
        throw new AppError("User not found or deleted", 401);
      }

      if (user.status === "SUSPENDED") {
        throw new AppError("Account is suspended", 403);
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Invalid or expired authentication token", 401);
    }
  },
);
