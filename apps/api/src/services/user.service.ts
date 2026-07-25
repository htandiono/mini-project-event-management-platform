import { prisma, type Prisma } from "@eventure/database";
import type { ChangePasswordDTO, UpdateProfileDTO, UserResponse } from "@eventure/shared";
import bcrypt from "bcryptjs";
import { AppError } from "../lib/app-error.js";
import { formatUserResponse } from "./auth.service.js";
import { deleteFromCloudinary, uploadToCloudinary } from "./cloudinary.service.js";

export async function getUserPointBalance(userId: string): Promise<number> {
  const now = new Date();
  const entries = await prisma.pointLedger.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  let balance = 0;
  for (const entry of entries) {
    if (entry.type === "CREDIT" || entry.type === "RESTORE") {
      balance += entry.amount;
    } else if (entry.type === "DEBIT" || entry.type === "EXPIRE") {
      balance -= entry.amount;
    }
  }
  return Math.max(0, balance);
}

export async function getProfile(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError("User not found", 404);
  }

  const response = formatUserResponse(user);

  if (user.role === "CUSTOMER") {
    response.pointBalance = await getUserPointBalance(userId);
    response.activeCouponsCount = await prisma.userCoupon.count({
      where: {
        userId,
        status: { in: ["ACTIVE", "RESTORED"] },
        expiresAt: { gt: new Date() },
      },
    });
  }

  return response;
}

export async function updateProfile(
  userId: string,
  dto: UpdateProfileDTO,
  file?: Express.Multer.File,
): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError("User not found", 404);
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (dto.name !== undefined && dto.name.trim().length > 0) {
    updateData.name = dto.name.trim();
  }

  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer);
    if (user.avatarPublicId) {
      void deleteFromCloudinary(user.avatarPublicId);
    }
    updateData.avatarUrl = uploadResult.url;
    updateData.avatarPublicId = uploadResult.publicId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return getProfile(updatedUser.id);
}

export async function changePassword(
  userId: string,
  dto: ChangePasswordDTO,
): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError("User not found", 404);
  }

  const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new AppError("Current password is incorrect", 400, [
      { field: "currentPassword", message: "Current password does not match" },
    ]);
  }

  const passwordHash = await bcrypt.hash(dto.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return getProfile(userId);
}

export async function getPointsHistory(userId: string) {
  return prisma.pointLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoupons(userId: string) {
  return prisma.userCoupon.findMany({
    where: { userId },
    include: {
      coupon: { select: { code: true, name: true, discountPercent: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReferrals(userId: string) {
  return prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.transaction.findMany({
    where: { customerId: userId },
    include: {
      event: {
        select: { name: true, slug: true, startsAt: true, endsAt: true, venue: true, city: true },
      },
      items: { include: { ticketType: { select: { name: true } } } },
      paymentProof: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
