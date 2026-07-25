import { z } from "zod";

const checkoutItemSchema = z.object({
  ticketTypeId: z.string().trim().min(1).max(40),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutInputSchema = z.object({
  eventId: z.string().trim().min(1).max(40),
  items: z.array(checkoutItemSchema).min(1).max(10),
  voucherCode: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((code) => code.toUpperCase())
    .optional(),
  userCouponId: z.string().trim().min(1).max(40).optional(),
  pointsToUse: z.number().int().min(0).default(0),
});

export const transactionIdSchema = z.string().trim().min(1).max(40);

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1_000),
});
