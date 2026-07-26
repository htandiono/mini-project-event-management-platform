import type { EventDetail, EventReviews } from "@eventure/shared";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { EventDetails } from "./event-details";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const event: EventDetail = {
  id: "event-1",
  slug: "community-day",
  name: "Community Day",
  categoryName: "Community",
  city: "Bandung",
  venue: "Town Hall",
  address: "Jalan Merdeka 1",
  province: "West Java",
  startsAt: "2026-10-01T03:00:00.000Z",
  endsAt: "2026-10-01T06:00:00.000Z",
  description: "A useful gathering for the community.",
  priceFrom: 100_000,
  imageUrl: null,
  organizerName: "Eventure",
  capacity: 50,
  availableSeats: 40,
  ticketTypes: [
    {
      id: "ticket-1",
      name: "General Admission",
      description: null,
      price: 100_000,
      capacity: 50,
      availableSeats: 40,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  vouchers: [],
};
const reviews: EventReviews = {
  averageRating: 5,
  reviewCount: 1,
  reviews: [
    {
      id: "review-1",
      rating: 5,
      comment: "Helpful and welcoming.",
      customerName: "Bima",
      customerAvatarUrl: null,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    },
  ],
};

describe("EventDetails", () => {
  it("shows ticket availability and attendee review context", () => {
    render(<EventDetails event={event} reviewData={reviews} />);

    expect(screen.getByRole("heading", { name: "Community Day" })).toBeInTheDocument();
    expect(screen.getByText("40 seats remaining")).toBeInTheDocument();
    expect(screen.getByText(/5.0 out of 5/)).toBeInTheDocument();
  });
});
