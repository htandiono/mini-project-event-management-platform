import type {
  ApiFailure,
  ApiSuccess,
  CategorySummary,
  EventDetail,
  EventListQuery,
  EventReviews,
  EventSummary,
  PaginatedData,
} from "@eventure/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: ApiFailure["errors"] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : undefined),
      ...init.headers,
    },
  });
  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !body.success) {
    const failure = body as ApiFailure;
    throw new ApiClientError(failure.message || "Request failed", response.status, failure.errors);
  }

  return body.data;
}

export function buildEventQuery(query: EventListQuery): string {
  const parameters = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      parameters.set(key, String(value));
    }
  }

  const serialized = parameters.toString();
  return serialized ? `?${serialized}` : "";
}

export function getEvents(
  query: EventListQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedData<EventSummary>> {
  return apiRequest(`/events${buildEventQuery(query)}`, { signal });
}

export function getCategories(signal?: AbortSignal): Promise<CategorySummary[]> {
  return apiRequest("/events/categories", { signal });
}

export function getEvent(slug: string, signal?: AbortSignal): Promise<EventDetail> {
  return apiRequest(`/events/${encodeURIComponent(slug)}`, { signal });
}

export function getEventReviews(slug: string, signal?: AbortSignal): Promise<EventReviews> {
  return apiRequest(`/events/${encodeURIComponent(slug)}/reviews`, { signal });
}
