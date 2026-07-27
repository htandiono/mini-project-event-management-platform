import type {
  ApiFailure,
  ApiSuccess,
  CategorySummary,
  CheckoutInput,
  CheckoutOptions,
  EventDetail,
  EventListQuery,
  EventInput,
  EventReviews,
  EventSummary,
  OrganizerEventDetail,
  OrganizerEventSummary,
  OrganizerVoucherSummary,
  PaginatedData,
  ReviewInput,
  ReviewSummary,
  TransactionSummary,
  TicketTypeInput,
  TicketTypeSummary,
  VoucherInput,
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
  const responseText = await response.text();

  if (!responseText) {
    if (response.ok) return undefined as T;
    throw new ApiClientError("Request failed", response.status);
  }

  const body = JSON.parse(responseText) as ApiSuccess<T> | ApiFailure;

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

export function getCheckoutOptions(): Promise<CheckoutOptions> {
  return apiRequest("/transactions/options");
}

export function createCheckout(input: CheckoutInput): Promise<TransactionSummary> {
  return apiRequest("/transactions", { method: "POST", body: JSON.stringify(input) });
}

export function getTransactions(signal?: AbortSignal): Promise<TransactionSummary[]> {
  return apiRequest("/transactions", { signal });
}

export function getTransaction(id: string, signal?: AbortSignal): Promise<TransactionSummary> {
  return apiRequest(`/transactions/${encodeURIComponent(id)}`, { signal });
}

export function cancelTransaction(id: string): Promise<void> {
  return apiRequest(`/transactions/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export function createReview(transactionId: string, input: ReviewInput): Promise<ReviewSummary> {
  return apiRequest(`/transactions/${encodeURIComponent(transactionId)}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateReview(transactionId: string, input: ReviewInput): Promise<ReviewSummary> {
  return apiRequest(`/transactions/${encodeURIComponent(transactionId)}/review`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteReview(transactionId: string): Promise<void> {
  return apiRequest(`/transactions/${encodeURIComponent(transactionId)}/review`, {
    method: "DELETE",
  });
}

export function getOrganizerEvents(signal?: AbortSignal): Promise<OrganizerEventSummary[]> {
  return apiRequest("/organizer/events", { signal });
}

export function getOrganizerEvent(id: string): Promise<OrganizerEventDetail> {
  return apiRequest(`/organizer/events/${encodeURIComponent(id)}`);
}

export function createOrganizerEvent(input: EventInput): Promise<OrganizerEventSummary> {
  return apiRequest("/organizer/events", { method: "POST", body: JSON.stringify(input) });
}

export function updateOrganizerEvent(
  id: string,
  input: EventInput,
): Promise<OrganizerEventSummary> {
  return apiRequest(`/organizer/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteOrganizerEvent(id: string): Promise<void> {
  return apiRequest(`/organizer/events/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getEventTickets(eventId: string): Promise<TicketTypeSummary[]> {
  return apiRequest(`/organizer/events/${encodeURIComponent(eventId)}/tickets`);
}

export function createEventTicket(
  eventId: string,
  input: TicketTypeInput,
): Promise<TicketTypeSummary> {
  return apiRequest(`/organizer/events/${encodeURIComponent(eventId)}/tickets`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEventTicket(
  eventId: string,
  ticketId: string,
  input: TicketTypeInput,
): Promise<TicketTypeSummary> {
  return apiRequest(
    `/organizer/events/${encodeURIComponent(eventId)}/tickets/${encodeURIComponent(ticketId)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function deleteEventTicket(eventId: string, ticketId: string): Promise<void> {
  return apiRequest(
    `/organizer/events/${encodeURIComponent(eventId)}/tickets/${encodeURIComponent(ticketId)}`,
    { method: "DELETE" },
  );
}

export function getEventVouchers(eventId: string): Promise<OrganizerVoucherSummary[]> {
  return apiRequest(`/organizer/events/${encodeURIComponent(eventId)}/vouchers`);
}

export function createEventVoucher(
  eventId: string,
  input: VoucherInput,
): Promise<OrganizerVoucherSummary> {
  return apiRequest(`/organizer/events/${encodeURIComponent(eventId)}/vouchers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEventVoucher(
  eventId: string,
  voucherId: string,
  input: VoucherInput,
): Promise<OrganizerVoucherSummary> {
  return apiRequest(
    `/organizer/events/${encodeURIComponent(eventId)}/vouchers/${encodeURIComponent(voucherId)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function deleteEventVoucher(eventId: string, voucherId: string): Promise<void> {
  return apiRequest(
    `/organizer/events/${encodeURIComponent(eventId)}/vouchers/${encodeURIComponent(voucherId)}`,
    { method: "DELETE" },
  );
}
