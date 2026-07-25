import type { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "@eventure/shared";
import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body as unknown as RegisterDTO, res);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.login(req.body as unknown as LoginDTO, res);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const logout = (_req: Request, res: Response) => {
  authService.logout(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null,
  });
};

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body as unknown as ForgotPasswordDTO);
  res.status(200).json({
    success: true,
    message: "If your email is registered, a password reset link has been sent",
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.resetPassword(req.body as unknown as ResetPasswordDTO, res);
  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in with your new password.",
    data: user,
  });
});
