"use client";

import type { ReviewSummary } from "@eventure/shared";
import { type FormEvent, useState } from "react";

import { createReview, deleteReview, updateReview } from "@/lib/api-client";

import styles from "./transactions.module.css";

interface ReviewEditorProps {
  transactionId: string;
  review: ReviewSummary | null;
  onChange: (review: ReviewSummary | null) => void;
}

export function ReviewEditor({ transactionId, review, onChange }: ReviewEditorProps) {
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm(review ? "Save changes to your review?" : "Publish this event review?")) {
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const saved = review
        ? await updateReview(transactionId, { rating, comment })
        : await createReview(transactionId, { rating, comment });
      onChange(saved);
      setMessage(review ? "Review updated." : "Review published.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save review");
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete your review?")) return;
    setWorking(true);
    setError("");

    try {
      await deleteReview(transactionId);
      onChange(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete review");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className={`${styles.panel} ${styles.reviewPanel}`}>
      <h2>{review ? "Your event review" : "Review this event"}</h2>
      <form className={styles.reviewForm} onSubmit={submit}>
        <label>
          <span>Rating</span>
          <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Very good</option>
            <option value={3}>3 - Good</option>
            <option value={2}>2 - Fair</option>
            <option value={1}>1 - Poor</option>
          </select>
        </label>
        <label>
          <span>Comment</span>
          <textarea
            required
            minLength={5}
            maxLength={1_000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className={styles.success} role="status">
            {message}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button className="button button--primary" type="submit" disabled={working}>
            {working ? "Saving..." : review ? "Update review" : "Publish review"}
          </button>
          {review ? (
            <button
              className="button button--ghost"
              type="button"
              disabled={working}
              onClick={remove}
            >
              Delete review
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
