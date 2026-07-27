import type { TicketTypeSummary, TransactionSummary } from "@eventure/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCheckout, getCheckoutOptions } from "@/lib/api-client";

import { CheckoutForm } from "./checkout-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, createCheckout: vi.fn(), getCheckoutOptions: vi.fn() };
});

const ticket: TicketTypeSummary = {
  id: "ticket-1",
  name: "General Admission",
  description: null,
  price: 100_000,
  capacity: 20,
  availableSeats: 10,
  salesStartAt: null,
  salesEndAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCheckoutOptions).mockResolvedValue({ pointBalance: 0, coupons: [] });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("CheckoutForm", () => {
  it("submits the selected ticket quantity after confirmation", async () => {
    vi.mocked(createCheckout).mockResolvedValue({ id: "transaction-1" } as TransactionSummary);
    render(<CheckoutForm eventId="event-1" eventName="Community Day" tickets={[ticket]} />);

    fireEvent.click(screen.getByRole("button", { name: "Register for this event" }));
    const quantity = await screen.findByRole("combobox", { name: "General Admission quantity" });
    fireEvent.change(quantity, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));

    await waitFor(() =>
      expect(createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: "event-1",
          items: [{ ticketTypeId: "ticket-1", quantity: 2 }],
        }),
      ),
    );
    expect(push).toHaveBeenCalledWith("/transactions/transaction-1");
  });
});
