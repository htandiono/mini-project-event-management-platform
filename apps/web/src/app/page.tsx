import Link from "next/link";

import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents } from "@/lib/api-client";

export default async function HomePage() {
  const upcoming = await getEvents({ sort: "startsAt", order: "asc", page: 1, limit: 3 })
    .then((result) => result.data)
    .catch(() => []);

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

            <form className="search-panel" action="/events">
              <label>
                <span>What are you looking for?</span>
                <input name="search" type="search" placeholder="Try design meetup" />
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

        {upcoming.length > 0 ? (
          <div className="event-grid">
            {upcoming.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                accent={(["coral", "teal", "gold"] as const)[index] ?? "coral"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Events are being prepared"
            description="Browse again shortly or start planning your own event."
          />
        )}
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
          <Link className="button button--light" href="/organizer/events">
            Start organizing
          </Link>
        </div>
      </section>
    </>
  );
}
