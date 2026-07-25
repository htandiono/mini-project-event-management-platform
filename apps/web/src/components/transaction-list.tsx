"use client";

import type { TransactionSummary } from "@eventure/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ApiClientError, getTransactions } from "@/lib/api-client";
import { formatIdr } from "@/lib/currency";

import styles from "./transactions.module.css";

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTransactions(controller.signal)
      .then(setTransactions)
      .catch((reason: unknown) => {
        if (reason instanceof ApiClientError && reason.status === 401) setNeedsLogin(true);
        else if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Unable to load transactions");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className={`shell ${styles.page}`}>
      <header className={styles.heading}>
        <p className="eyebrow">My Eventure</p>
        <h1>Ticket transactions</h1>
      </header>

      {loading ? <p className={styles.muted}>Loading your transactions...</p> : null}
      {needsLogin ? (
        <div className={styles.loginPrompt}>
          <p>Log in as a customer to see your ticket transactions.</p>
          <Link className="button button--primary" href="/login">
            Log in
          </Link>
        </div>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !needsLogin && !error && transactions.length === 0 ? (
        <EmptyState
          title="No ticket transactions yet"
          description="Discover an event and reserve your first ticket."
        />
      ) : null}

      <div className={styles.list}>
        {transactions.map((transaction) => (
          <article className={styles.card} key={transaction.id}>
            <div>
              <p>{transaction.invoiceNumber}</p>
              <h2>{transaction.eventName}</h2>
            </div>
            <span className={styles.status}>{transaction.status.replaceAll("_", " ")}</span>
            <div>
              <strong>{transaction.total === 0 ? "Free" : formatIdr(transaction.total)}</strong>
              <br />
              <Link className="text-link" href={`/transactions/${transaction.id}`}>
                View details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
