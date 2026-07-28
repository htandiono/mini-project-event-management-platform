import { TransactionStatus, type PrismaClient } from "@eventure/database";
import { ORGANIZER_REVIEW_WINDOW_DAYS, type PaymentProofSubmission } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../../services/cloudinary.service.js";
import { restoreTransactionById } from "./transaction-lifecycle.service.js";

interface PaymentProofFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

interface PaymentProofStorage {
  upload(file: PaymentProofFile): Promise<{ url: string; publicId: string }>;
  remove(publicId: string): Promise<void>;
}

const cloudinaryPaymentProofStorage: PaymentProofStorage = {
  upload: (file) => uploadToCloudinary(file.buffer, "eventure/payment-proofs", false),
  remove: deleteFromCloudinary,
};

export async function submitPaymentProof(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  file: PaymentProofFile,
  now = new Date(),
  storage: PaymentProofStorage = cloudinaryPaymentProofStorage,
): Promise<PaymentProofSubmission> {
  const transaction = await database.transaction.findFirst({
    where: { id: transactionId, customerId },
    select: { id: true, status: true, paymentDeadline: true },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  if (transaction.status !== TransactionStatus.WAITING_FOR_PAYMENT) {
    throw new AppError("Payment proof can only be uploaded for an unpaid transaction", 409);
  }

  if (transaction.paymentDeadline <= now) {
    await restoreTransactionById(
      database,
      transactionId,
      TransactionStatus.WAITING_FOR_PAYMENT,
      TransactionStatus.EXPIRED,
      "Payment deadline expired",
      now,
    );
    throw new AppError("The payment deadline has expired", 409);
  }

  const uploaded = await storage.upload(file);
  const organizerDeadline = new Date(
    now.getTime() + ORGANIZER_REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    await database.$transaction(async (client) => {
      const transition = await client.transaction.updateMany({
        where: {
          id: transactionId,
          customerId,
          status: TransactionStatus.WAITING_FOR_PAYMENT,
          paymentDeadline: { gt: now },
        },
        data: {
          status: TransactionStatus.WAITING_FOR_CONFIRMATION,
          paymentUploadedAt: now,
          organizerDeadline,
        },
      });

      if (transition.count !== 1) {
        throw new AppError("Transaction status changed; refresh and try again", 409);
      }

      await client.paymentProof.create({
        data: {
          transactionId,
          fileUrl: uploaded.url,
          publicId: uploaded.publicId,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: now,
        },
      });
    });
  } catch (error) {
    await storage.remove(uploaded.publicId);
    throw error;
  }

  return {
    transactionId,
    status: "WAITING_FOR_CONFIRMATION",
    paymentUploadedAt: now.toISOString(),
    organizerDeadline: organizerDeadline.toISOString(),
  };
}
