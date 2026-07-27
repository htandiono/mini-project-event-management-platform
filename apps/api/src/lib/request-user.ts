import type { AuthUser, UserRole } from "@eventure/shared";

import { AppError } from "./app-error.js";

export interface RequestLocals {
  user?: AuthUser;
}

export function requireRequestUser(locals: RequestLocals, role?: UserRole): AuthUser {
  const user = locals.user;

  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  if (role && user.role !== role) {
    throw new AppError("You do not have permission to perform this action", 403);
  }

  return user;
}
