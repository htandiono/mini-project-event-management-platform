import { EventResourceManager } from "@/components/event-resource-manager";

interface EventResourcesPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventResourcesPage({ params }: EventResourcesPageProps) {
  const { eventId } = await params;
  return <EventResourceManager eventId={eventId} />;
}
