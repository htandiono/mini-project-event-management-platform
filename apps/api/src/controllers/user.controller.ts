import type { ChangePasswordDTO, UpdateProfileDTO } from "@eventure/shared";
import type { Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import * as userService from "../services/user.service.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const profile = await userService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const updated = await userService.updateProfile(
    req.user.id,
    req.body as unknown as UpdateProfileDTO,
    req.file,
  );
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updated,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const updated = await userService.changePassword(
    req.user.id,
    req.body as unknown as ChangePasswordDTO,
  );
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: updated,
  });
});

export const getPointsHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const data = await userService.getPointsHistory(req.user.id);
  res.status(200).json({ success: true, message: "Points history retrieved", data });
});

export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const data = await userService.getCoupons(req.user.id);
  res.status(200).json({ success: true, message: "Coupons retrieved", data });
});

export const getReferrals = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const data = await userService.getReferrals(req.user.id);
  res.status(200).json({ success: true, message: "Referrals retrieved", data });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const data = await userService.getUserOrders(req.user.id);
  res.status(200).json({ success: true, message: "Orders retrieved", data });
});
