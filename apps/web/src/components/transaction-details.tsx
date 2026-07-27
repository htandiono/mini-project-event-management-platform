"use client";

import { TRANSACTION_STATUS_LABELS, type TransactionSummary } from "@eventure/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ApiClientError,
  cancelTransaction,
  getTransaction,
  uploadTransactionPaymentProof,
} from "@/lib/api-client";
import { formatIdr } from "@/lib/currency";

import { ReviewEditor } from "./review-editor";
import styles from "./transactions.module.css";

interface TransactionDetailsProps {
  transactionId: string;
}

export function formatCountdown(milliseconds: number): string {
  if (milliseconds <= 0) return "Deadline reached";
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m remaining`;
}

export function validatePaymentProofFile(file: File): string | null {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!supportedTypes.includes(file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > 5 * 1024 * 1024) return "Payment proof must be 5 MB or smaller.";
  return null;
}

function PaymentCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const interval = window.setInterval(
      () => setRemaining(new Date(deadline).getTime() - Date.now()),
      1_000,
    );
    return () => window.clearInterval(interval);
  }, [deadline]);

  return (
    <div className={styles.countdown} aria-live="polite">
      <span>Upload payment proof before</span>
      <strong>{formatCountdown(remaining)}</strong>
    </div>
  );
}

export function TransactionDetails({ transactionId }: TransactionDetailsProps) {
  const [transaction, setTransaction] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTransaction(transactionId, controller.signal)
      .then(setTransaction)
      .catch((reason: unknown) => {
        if (reason instanceof ApiClientError && reason.status === 401) setNeedsLogin(true);
        else if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Unable to load transaction");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [transactionId]);

  async function cancel() {
    if (!window.confirm("Cancel this unpaid transaction and release the reserved tickets?")) return;
    setWorking(true);
    setError("");

    try {
      await cancelTransaction(transactionId);
      setTransaction(await getTransaction(transactionId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to cancel transaction");
    } finally {
      setWorking(false);
    }
  }

  async function uploadProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentProof) {
      setError("Choose a payment proof image first.");
      return;
    }

    const validationError = validatePaymentProofFile(paymentProof);
    if (validationError) {
      setError(validationError);
      return;
    }

    setWorking(true);
    setError("");

    try {
      await uploadTransactionPaymentProof(transactionId, paymentProof);
      setTransaction(await getTransaction(transactionId));
      setPaymentProof(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload payment proof");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p className={`shell ${styles.page}`}>Loading transaction...</p>;

  if (needsLogin) {
    return (
      <section className={`shell ${styles.page}`}>
        <div className={styles.loginPrompt}>
          <p>Log in to view this transaction.</p>
          <Link className="button button--primary" href="/login">
            Log in
          </Link>
        </div>
      </section>
    );
  }

  if (!transaction) {
    return (
      <section className={`shell ${styles.page}`}>
        <p className={styles.error} role="alert">
          {error || "Transaction not found"}
        </p>
      </section>
    );
  }

  return (
    <article className={`shell ${styles.page}`}>
      <header className={styles.detailHeader}>
        <div>
          <p className="eyebrow">{transaction.invoiceNumber}</p>
          <h1>{transaction.eventName}</h1>
        </div>
        <span className={styles.status}>{TRANSACTION_STATUS_LABELS[transaction.status]}</span>
      </header>

      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <h2>Tickets</h2>
          {transaction.items.map((item) => (
            <div className={styles.lineItem} key={item.ticketTypeId}>
              <span>
                {item.ticketTypeName} × {item.quantity}
              </span>
              <strong>{item.subtotal === 0 ? "Free" : formatIdr(item.subtotal)}</strong>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatIdr(transaction.subtotal)}</span>
          </div>
          {transaction.voucherDiscount > 0 ? (
            <div className={styles.totalRow}>
              <span>Voucher</span>
              <span>−{formatIdr(transaction.voucherDiscount)}</span>
            </div>
          ) : null}
          {transaction.couponDiscount > 0 ? (
            <div className={styles.totalRow}>
              <span>Coupon</span>
              <span>−{formatIdr(transaction.couponDiscount)}</span>
            </div>
          ) : null}
          {transaction.pointsUsed > 0 ? (
            <div className={styles.totalRow}>
              <span>Points</span>
              <span>−{formatIdr(transaction.pointsUsed)}</span>
            </div>
          ) : null}
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>{transaction.total === 0 ? "Free" : formatIdr(transaction.total)}</span>
          </div>
        </section>

        <aside className={styles.panel}>
          <h2>What happens next</h2>
          {transaction.status === "WAITING_FOR_PAYMENT" ? (
            <PaymentCountdown deadline={transaction.paymentDeadline} />
          ) : null}
          <p className={styles.muted}>
            {transaction.status === "WAITING_FOR_PAYMENT"
              ? "Upload a clear bank-transfer receipt before the two-hour deadline."
              : "This status updates automatically as your registration is reviewed."}
          </p>
          {transaction.status === "WAITING_FOR_PAYMENT" ? (
            <form className={styles.uploadForm} onSubmit={uploadProof}>
              <label>
                <span>Payment proof (JPEG, PNG, or WebP; max 5 MB)</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={working}
                  name="paymentProof"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setPaymentProof(file);
                    if (file) setError(validatePaymentProofFile(file) ?? "");
                  }}
                  required
                  type="file"
                />
              </label>
              <button className="button button--primary" disabled={working} type="submit">
                {working ? "Uploading..." : "Upload payment proof"}
              </button>
            </form>
          ) : null}
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            <Link className="button button--ghost" href={`/events/${transaction.eventSlug}`}>
              View event
            </Link>
            {transaction.status === "WAITING_FOR_PAYMENT" ? (
              <button
                className="button button--ghost"
                type="button"
                disabled={working}
                onClick={cancel}
              >
                {working ? "Canceling..." : "Cancel transaction"}
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {transaction.status === "DONE" && new Date(transaction.eventEndsAt) <= new Date() ? (
        <ReviewEditor
          key={transaction.review?.id ?? "new-review"}
          transactionId={transaction.id}
          review={transaction.review}
          onChange={(review) =>
            setTransaction((current) => (current ? { ...current, review } : current))
          }
        />
      ) : null}
    </article>
  );
}
