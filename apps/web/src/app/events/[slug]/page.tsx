import type { EventDetail, EventReviews } from "@eventure/shared";
import { notFound } from "next/navigation";

import { EventDetails } from "@/components/event-details";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiClientError, getEvent, getEventReviews } from "@/lib/api-client";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

const emptyReviews: EventReviews = { averageRating: 0, reviewCount: 0, reviews: [] };

type EventPageData =
  | { status: "ready"; event: EventDetail; reviews: EventReviews }
  | { status: "not-found" }
  | { status: "error" };

async function loadEventPage(slug: string): Promise<EventPageData> {
  try {
    const [event, reviews] = await Promise.all([
      getEvent(slug),
      getEventReviews(slug).catch(() => emptyReviews),
    ]);
    return { status: "ready", event, reviews };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return { status: "not-found" };
    return { status: "error" };
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const result = await loadEventPage(slug);

  if (result.status === "not-found") notFound();

  if (result.status === "error") {
    return (
      <section className="section shell">
        <EmptyState
          title="Event details are unavailable"
          description="Please refresh the page or return to event discovery."
        />
      </section>
    );
  }

  return <EventDetails event={result.event} reviewData={result.reviews} />;
}
