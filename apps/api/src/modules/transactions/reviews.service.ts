import { TransactionStatus, type PrismaClient } from "@eventure/database";
import type { EventReviews, ReviewInput, ReviewSummary } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";

function mapReview(review: {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; avatarUrl: string | null };
}): ReviewSummary {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    customerName: review.customer.name,
    customerAvatarUrl: review.customer.avatarUrl,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

async function findReviewableTransaction(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  now: Date,
) {
  const transaction = await database.transaction.findFirst({
    where: {
      id: transactionId,
      customerId,
      status: TransactionStatus.DONE,
      event: { endsAt: { lte: now }, deletedAt: null },
    },
    select: { id: true, eventId: true },
  });

  if (!transaction) {
    throw new AppError("Reviews are available after attending a completed event", 409);
  }

  return transaction;
}

export async function createTransactionReview(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  input: ReviewInput,
  now = new Date(),
): Promise<ReviewSummary> {
  const transaction = await findReviewableTransaction(database, customerId, transactionId, now);
  const existing = await database.review.findUnique({
    where: { transactionId },
    select: { id: true, deletedAt: true },
  });

  if (existing && !existing.deletedAt) {
    throw new AppError("This transaction already has a review", 409);
  }

  const review = existing
    ? await database.review.update({
        where: { id: existing.id },
        data: { ...input, deletedAt: null },
        include: { customer: { select: { name: true, avatarUrl: true } } },
      })
    : await database.review.create({
        data: {
          ...input,
          transactionId,
          eventId: transaction.eventId,
          customerId,
        },
        include: { customer: { select: { name: true, avatarUrl: true } } },
      });

  return mapReview(review);
}

export async function updateTransactionReview(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  input: ReviewInput,
): Promise<ReviewSummary> {
  const existing = await database.review.findFirst({
    where: { transactionId, customerId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Review not found", 404);
  }

  const review = await database.review.update({
    where: { id: existing.id },
    data: input,
    include: { customer: { select: { name: true, avatarUrl: true } } },
  });

  return mapReview(review);
}

export async function deleteTransactionReview(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  now = new Date(),
): Promise<void> {
  const result = await database.review.updateMany({
    where: { transactionId, customerId, deletedAt: null },
    data: { deletedAt: now },
  });

  if (result.count === 0) {
    throw new AppError("Review not found", 404);
  }
}

export async function listEventReviews(
  database: PrismaClient,
  eventSlug: string,
): Promise<EventReviews> {
  const event = await database.event.findFirst({
    where: { slug: eventSlug, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const [reviews, aggregate] = await Promise.all([
    database.review.findMany({
      where: { eventId: event.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, avatarUrl: true } } },
    }),
    database.review.aggregate({
      where: { eventId: event.id, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    averageRating: aggregate._avg.rating ?? 0,
    reviewCount: aggregate._count.rating,
    reviews: reviews.map(mapReview),
  };
}
