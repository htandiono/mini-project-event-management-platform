import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, buildEventQuery } from "./api-client";

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
});
