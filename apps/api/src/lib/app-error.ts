import type { ApiErrorDetail } from "@eventure/shared";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "AppError";
  }
}
