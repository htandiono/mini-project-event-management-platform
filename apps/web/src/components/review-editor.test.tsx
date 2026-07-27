import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createReview } from "@/lib/api-client";

import { ReviewEditor } from "./review-editor";

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, createReview: vi.fn(), deleteReview: vi.fn(), updateReview: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("ReviewEditor", () => {
  it("publishes a confirmed attendee review", async () => {
    const onChange = vi.fn();
    vi.mocked(createReview).mockResolvedValue({
      id: "review-1",
      rating: 5,
      comment: "A welcoming event.",
      customerName: "Bima",
      customerAvatarUrl: null,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });
    render(<ReviewEditor transactionId="transaction-1" review={null} onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Comment" }), {
      target: { value: "A welcoming event." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish review" }));

    await waitFor(() =>
      expect(createReview).toHaveBeenCalledWith("transaction-1", {
        rating: 5,
        comment: "A welcoming event.",
      }),
    );
    expect(onChange).toHaveBeenCalledOnce();
  });
});
