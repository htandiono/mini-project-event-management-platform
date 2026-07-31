import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.eventure.cloud/api/v1";

interface HealthBody {
  data: { status: string; timestamp: string };
}

interface EventsBody {
  data: {
    data: Array<{ city: string; name: string }>;
    total: number;
  };
}

export async function GET() {
  const startedAt = performance.now();

  try {
    const [healthResponse, eventsResponse] = await Promise.all([
      fetch(`${API_URL}/health`, { cache: "no-store" }),
      fetch(`${API_URL}/events?limit=24`, { cache: "no-store" }),
    ]);

    if (!healthResponse.ok || !eventsResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Production API returned ${healthResponse.status}/${eventsResponse.status}`,
        },
        { status: 502 },
      );
    }

    const health = (await healthResponse.json()) as HealthBody;
    const events = (await eventsResponse.json()) as EventsBody;
    const cities = [...new Set(events.data.data.map((event) => event.city))].sort();

    return NextResponse.json({
      success: true,
      message: "Production API is healthy",
      data: {
        cities,
        eventCount: events.data.total,
        firstEvent: events.data.data[0]?.name ?? "No upcoming events",
        health: health.data.status,
        latency: Math.round(performance.now() - startedAt),
        timestamp: health.data.timestamp,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "The production API could not be reached." },
      { status: 502 },
    );
  }
}
