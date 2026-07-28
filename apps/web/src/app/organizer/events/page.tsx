import type { Metadata } from "next";

import { OrganizerEventManager } from "@/components/organizer-event-manager";

export const metadata: Metadata = { title: "Manage events" };

export default function OrganizerEventsPage() {
  return <OrganizerEventManager />;
}
