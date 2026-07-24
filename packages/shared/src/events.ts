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

export interface EventListQuery {
  search?: string;
  category?: string;
  city?: string;
  sort?: "startsAt" | "price" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
