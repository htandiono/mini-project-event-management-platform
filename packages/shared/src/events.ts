export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  city: string;
  venue: string;
  startsAt: string;
  priceFrom: number;
  imageUrl: string | null;
  organizerName: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface TicketTypeSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  availableSeats: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
}

export interface PublicVoucherSummary {
  code: string;
  name: string;
  discountPercent: number | null;
  discountAmount: number | null;
  endsAt: string;
}

export interface EventDetail extends EventSummary {
  description: string;
  address: string;
  province: string;
  endsAt: string;
  capacity: number;
  availableSeats: number;
  ticketTypes: TicketTypeSummary[];
  vouchers: PublicVoucherSummary[];
}

export interface EventListQuery {
  search?: string;
  category?: string;
  city?: string;
  sort?: "startsAt" | "price" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface EventInput {
  categoryId: string;
  name: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  province: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isFree: boolean;
  thumbnailUrl?: string | null;
  status: "DRAFT" | "PUBLISHED";
}

export interface OrganizerEventSummary {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  city: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  availableSeats: number;
  isFree: boolean;
  status: "DRAFT" | "PUBLISHED" | "CANCELED" | "COMPLETED";
  ticketTypeCount: number;
}

export interface TicketTypeInput {
  name: string;
  description?: string | null;
  price: number;
  capacity: number;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
}

export interface VoucherInput {
  code: string;
  name: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  usageLimit: number;
  startsAt: string;
  endsAt: string;
}
