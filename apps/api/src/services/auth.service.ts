import crypto from "crypto";
import { prisma, type User } from "@eventure/database";
import type {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  UserResponse,
} from "@eventure/shared";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./email.service.js";

export function formatUserResponse(
  user: Pick<
    User,
    | "id"
    | "email"
    | "name"
    | "role"
    | "status"
    | "referralCode"
    | "referredById"
    | "avatarUrl"
    | "createdAt"
    | "updatedAt"
  >,
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    referredById: user.referredById,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
  };
}

export function setAuthCookies(res: Response, user: { id: string; role: string }) {
  const env = getEnv();
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] },
  );
  const refreshToken = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] },
  );

  const isProduction = env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response) {
  const env = getEnv();
  const isProduction = env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = `REF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  return `REF-${Date.now().toString(36).toUpperCase()}`;
}

export async function register(dto: RegisterDTO, res: Response): Promise<UserResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409, [
      { field: "email", message: "Email is already in use" },
    ]);
  }

  let referrerId: string | null = null;
  if (dto.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: dto.referralCode.trim().toUpperCase() },
    });
    if (!referrer || referrer.deletedAt !== null || referrer.status === "SUSPENDED") {
      throw new AppError("Invalid referral code", 404, [
        { field: "referralCode", message: "Referral code not found or inactive" },
      ]);
    }
    referrerId = referrer.id;
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const referralCode = await generateUniqueReferralCode();
  const name = dto.name.trim();

  const newUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name,
        role: dto.role,
        referralCode,
        referredById: referrerId,
        status: "ACTIVE",
      },
    });

    if (referrerId) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      await tx.pointLedger.create({
        data: {
          userId: referrerId,
          type: "CREDIT",
          amount: 10000,
          description: `Referral reward for inviting ${createdUser.email}`,
          expiresAt,
        },
      });

      let coupon = await tx.coupon.findUnique({ where: { code: "REF10" } });
      if (!coupon) {
        coupon = await tx.coupon.create({
          data: {
            code: "REF10",
            name: "Referral 10% Discount",
            discountPercent: 10,
            validityDays: 90,
          },
        });
      }

      await tx.userCoupon.create({
        data: {
          userId: createdUser.id,
          couponId: coupon.id,
          status: "ACTIVE",
          expiresAt,
        },
      });
    }

    return createdUser;
  });

  setAuthCookies(res, { id: newUser.id, role: newUser.role });

  void sendWelcomeEmail(newUser.email, newUser.name);

  return formatUserResponse(newUser);
}

export async function login(dto: LoginDTO, res: Response): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status === "SUSPENDED") {
    throw new AppError("Your account has been suspended", 403);
  }

  setAuthCookies(res, { id: user.id, role: user.role });

  return formatUserResponse(user);
}

export function logout(res: Response): void {
  clearAuthCookies(res);
}

export async function forgotPassword(dto: ForgotPasswordDTO): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (!user || user.deletedAt !== null || user.status === "SUSPENDED") {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      resetTokenExpiresAt,
    },
  });

  const env = getEnv();
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  void sendPasswordResetEmail(user.email, user.name, resetLink);
}

export async function resetPassword(dto: ResetPasswordDTO, res: Response): Promise<UserResponse> {
  const hashedToken = crypto.createHash("sha256").update(dto.token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      resetTokenExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      resetTokenExpiresAt: null,
    },
  });

  clearAuthCookies(res);

  return formatUserResponse(updatedUser);
}
