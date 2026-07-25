import type { EventDetail, EventReviews } from "@eventure/shared";
import Link from "next/link";

import { formatIdr } from "@/lib/currency";

import styles from "./event-details.module.css";

interface EventDetailsProps {
  event: EventDetail;
  reviewData: EventReviews;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-ID", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function voucherLabel(voucher: EventDetail["vouchers"][number]): string {
  if (voucher.discountPercent) return `${voucher.discountPercent}% off`;
  return `${formatIdr(voucher.discountAmount ?? 0)} off`;
}

export function EventDetails({ event, reviewData }: EventDetailsProps) {
  return (
    <article className={`shell ${styles.page}`}>
      <Link className={styles.back} href="/events">
        ← Back to all events
      </Link>

      <header className={styles.hero}>
        <div>
          <p className="eyebrow">{event.categoryName}</p>
          <h1>{event.name}</h1>
          <p className={styles.lead}>{event.description}</p>
        </div>
        <div className={styles.facts}>
          <div className={styles.fact}>
            <span>When</span>
            <strong>{dateTimeFormatter.format(new Date(event.startsAt))}</strong>
          </div>
          <div className={styles.fact}>
            <span>Where</span>
            <strong>{event.venue}</strong>
            <small>
              {event.address}, {event.city}
            </small>
          </div>
          <div className={styles.fact}>
            <span>Organizer</span>
            <strong>{event.organizerName}</strong>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.panel} id="tickets">
          <h2>Choose your ticket</h2>
          <div className={styles.tickets}>
            {event.ticketTypes.map((ticket) => (
              <article className={styles.ticket} key={ticket.id}>
                <div className={styles.ticketHeader}>
                  <h3>{ticket.name}</h3>
                  <strong>{ticket.price === 0 ? "Free" : formatIdr(ticket.price)}</strong>
                </div>
                {ticket.description ? <p>{ticket.description}</p> : null}
                <p>{ticket.availableSeats} seats remaining</p>
              </article>
            ))}
          </div>

          {event.vouchers.length > 0 ? (
            <>
              <p className={styles.muted}>Available event vouchers</p>
              <ul className={styles.voucherList}>
                {event.vouchers.map((voucher) => (
                  <li key={voucher.code}>
                    {voucher.code} · {voucherLabel(voucher)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className={styles.panel}>
          <h2>Attendee reviews</h2>
          <p className={styles.muted}>
            {reviewData.reviewCount > 0
              ? `${reviewData.averageRating.toFixed(1)} out of 5 from ${reviewData.reviewCount} review${reviewData.reviewCount === 1 ? "" : "s"}`
              : "No attendee reviews yet."}
          </p>
          <div className={styles.reviews}>
            {reviewData.reviews.map((review) => (
              <article className={styles.review} key={review.id}>
                <div className={styles.reviewHeader}>
                  <h3>{review.customerName}</h3>
                  <span className={styles.rating} aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
