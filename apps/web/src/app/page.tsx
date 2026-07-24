import type { EventSummary } from "@eventure/shared";
import Link from "next/link";

import { EventCard } from "@/components/event-card";

const previewEvents: EventSummary[] = [
  {
    id: "preview-1",
    slug: "jakarta-product-meetup-2026",
    name: "Jakarta Product Meetup 2026",
    categoryName: "Technology",
    city: "Jakarta",
    venue: "Kuningan City Hall",
    startsAt: "2026-10-17T11:00:00.000Z",
    priceFrom: 75_000,
    imageUrl: null,
    organizerName: "Ayu Pratama",
  },
  {
    id: "preview-2",
    slug: "sunset-sessions-bandung",
    name: "Sunset Sessions Bandung",
    categoryName: "Music",
    city: "Bandung",
    venue: "Teras Cikapundung",
    startsAt: "2026-11-07T09:30:00.000Z",
    priceFrom: 125_000,
    imageUrl: null,
    organizerName: "Nada Collective",
  },
  {
    id: "preview-3",
    slug: "surabaya-taste-trail",
    name: "Surabaya Taste Trail",
    categoryName: "Food & Drink",
    city: "Surabaya",
    venue: "Tunjungan Plaza Courtyard",
    startsAt: "2026-12-05T04:00:00.000Z",
    priceFrom: 0,
    imageUrl: null,
    organizerName: "Rasa Surabaya",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Events worth showing up for</p>
            <h1>Find your next great story.</h1>
            <p className="hero__lead">
              Discover concerts, workshops, meetups, and local experiences curated across Indonesia.
            </p>

            <form className="search-panel" action="#discover">
              <label>
                <span>What are you looking for?</span>
                <input name="search" type="search" placeholder="Try “design meetup”" />
              </label>
              <label>
                <span>City</span>
                <select name="city" defaultValue="">
                  <option value="">Everywhere</option>
                  <option>Jakarta</option>
                  <option>Bandung</option>
                  <option>Surabaya</option>
                </select>
              </label>
              <button className="button button--primary search-panel__submit" type="submit">
                Explore events
              </button>
            </form>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-art__sun" />
            <div className="hero-art__ticket">
              <span>ADMIT ONE</span>
              <strong>GOOD TIMES</strong>
              <small>JKT · BDG · SBY</small>
            </div>
            <div className="hero-art__spark">✦</div>
          </div>
        </div>
      </section>

      <section className="section shell" id="discover">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fresh picks</p>
            <h2>Happening soon</h2>
          </div>
          <Link className="text-link" href="/events">
            Browse all events <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="event-grid">
          {previewEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              accent={(["coral", "teal", "gold"] as const)[index] ?? "coral"}
            />
          ))}
        </div>
      </section>

      <section className="organizer-callout">
        <div className="shell organizer-callout__inner">
          <div>
            <p className="eyebrow">For organizers</p>
            <h2>Turn your idea into a full house.</h2>
          </div>
          <p>
            Create an event, offer flexible tickets and vouchers, then follow every registration
            from one focused dashboard.
          </p>
          <Link className="button button--light" href="/register?role=organizer">
            Start organizing
          </Link>
        </div>
      </section>
    </>
  );
}
