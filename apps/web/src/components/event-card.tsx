import type { EventSummary } from "@eventure/shared";
import Link from "next/link";

import { formatIdr } from "@/lib/currency";

interface EventCardProps {
  event: EventSummary;
  accent: "coral" | "gold" | "teal";
}

const dateFormatter = new Intl.DateTimeFormat("en-ID", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta",
  year: "numeric",
});

export function EventCard({ event, accent }: EventCardProps) {
  return (
    <article className="event-card">
      <Link
        className={`event-card__visual event-card__visual--${accent}`}
        href={`/events/${event.slug}`}
      >
        <span>{event.categoryName}</span>
        <strong>{event.name.slice(0, 1)}</strong>
      </Link>

      <div className="event-card__body">
        <p className="eyebrow">{dateFormatter.format(new Date(event.startsAt))}</p>
        <h3>
          <Link href={`/events/${event.slug}`}>{event.name}</Link>
        </h3>
        <p className="event-card__place">
          {event.venue} · {event.city}
        </p>
        <div className="event-card__meta">
          <span>From {event.priceFrom === 0 ? "Free" : formatIdr(event.priceFrom)}</span>
          <span>by {event.organizerName}</span>
        </div>
      </div>
    </article>
  );
}
