import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, buildEventQuery, uploadTransactionPaymentProof } from "./api-client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildEventQuery", () => {
  it("serializes defined event filters", () => {
    expect(buildEventQuery({ search: "design meetup", category: "", page: 2, limit: 9 })).toBe(
      "?search=design+meetup&page=2&limit=9",
    );
  });
});

describe("apiRequest", () => {
  it("returns data from the shared success envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "ok", data: { id: "1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest<{ id: string }>("/test")).resolves.toEqual({ id: "1" });
  });

  it("throws a typed error from the failure envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "Not found", errors: [] }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/missing")).rejects.toEqual(
      expect.objectContaining({ message: "Not found", status: 404 }),
    );
  });

  it("supports successful no-content responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest<void>("/test", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("lets the browser set the multipart boundary for payment proof uploads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "uploaded",
          data: {
            transactionId: "transaction-1",
            status: "WAITING_FOR_CONFIRMATION",
            paymentUploadedAt: "2026-07-28T10:00:00.000Z",
            organizerDeadline: "2026-07-31T10:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const file = new File(["proof"], "proof.jpg", { type: "image/jpeg" });

    await uploadTransactionPaymentProof("transaction-1", file);

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.body).toBeInstanceOf(FormData);
    expect(request?.headers).not.toHaveProperty("Content-Type");
  });
});
