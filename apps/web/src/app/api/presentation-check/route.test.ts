import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/presentation-check", () => {
  it("aggregates public production health and catalog data", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { status: "ok", timestamp: "2026-07-31T08:00:00.000Z" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              data: [
                { city: "Jakarta", name: "Jakarta Creative Conference" },
                { city: "Bandung", name: "Bandung Design Week" },
              ],
              total: 39,
            },
          }),
          { status: 200 },
        ),
      );

    const response = await GET();
    const body = (await response.json()) as {
      success: boolean;
      data: { cities: string[]; eventCount: number; firstEvent: string; health: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      cities: ["Bandung", "Jakarta"],
      eventCount: 39,
      firstEvent: "Jakarta Creative Conference",
      health: "ok",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/health");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/events?limit=24");
  });

  it("returns a gateway error when either upstream request fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await GET();
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(502);
    expect(body).toEqual({
      success: false,
      message: "Production API returned 503/200",
    });
  });
});
