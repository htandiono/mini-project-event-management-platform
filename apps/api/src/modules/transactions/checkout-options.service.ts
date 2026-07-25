import { PointEntryType, UserCouponStatus, type PrismaClient } from "@eventure/database";
import type { CheckoutOptions } from "@eventure/shared";

import { calculatePointBalance } from "./checkout.service.js";

export async function getCheckoutOptions(
  database: PrismaClient,
  customerId: string,
  now = new Date(),
): Promise<CheckoutOptions> {
  const [pointEntries, userCoupons] = await Promise.all([
    database.pointLedger.findMany({
      where: {
        userId: customerId,
        OR: [
          {
            type: { in: [PointEntryType.CREDIT, PointEntryType.RESTORE] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          { type: PointEntryType.DEBIT },
        ],
      },
      select: { type: true, amount: true },
    }),
    database.userCoupon.findMany({
      where: {
        userId: customerId,
        status: { in: [UserCouponStatus.ACTIVE, UserCouponStatus.RESTORED] },
        expiresAt: { gt: now },
        coupon: { deletedAt: null },
      },
      orderBy: { expiresAt: "asc" },
      select: {
        id: true,
        expiresAt: true,
        coupon: { select: { name: true, discountPercent: true } },
      },
    }),
  ]);

  return {
    pointBalance: Math.max(0, calculatePointBalance(pointEntries)),
    coupons: userCoupons.map((userCoupon) => ({
      id: userCoupon.id,
      name: userCoupon.coupon.name,
      discountPercent: userCoupon.coupon.discountPercent,
      expiresAt: userCoupon.expiresAt.toISOString(),
    })),
  };
}
