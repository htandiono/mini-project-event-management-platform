"use client";

import { TRANSACTION_STATUS_LABELS, type TransactionSummary } from "@eventure/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiClientError, cancelTransaction, getTransaction } from "@/lib/api-client";
import { formatIdr } from "@/lib/currency";

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
              ? "Upload your proof from the payment section supplied by the account feature."
              : "This status updates automatically as your registration is reviewed."}
          </p>
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
                className="button button--primary"
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
    </article>
  );
}
