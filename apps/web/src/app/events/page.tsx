import type { Metadata } from "next";

import { EventBrowser } from "@/components/event-browser";

export const metadata: Metadata = {
  title: "Discover events",
  description: "Search and filter upcoming events across Indonesia.",
};

interface EventsPageProps {
  searchParams: Promise<{ search?: string; city?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const query = await searchParams;
  return <EventBrowser initialSearch={query.search} initialCity={query.city} />;
}
