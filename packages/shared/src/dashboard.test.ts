import { describe, expect, it } from "vitest";

import { dashboardQuerySchema } from "./dashboard.js";

describe("dashboardQuerySchema", () => {
  it("accepts an ordered date range", () => {
    expect(dashboardQuerySchema.parse({ startDate: "2026-07-01", endDate: "2026-07-31" })).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  });

  it("rejects invalid and reversed dates", () => {
    expect(() => dashboardQuerySchema.parse({ startDate: "2026-02-31" })).toThrow();
    expect(() =>
      dashboardQuerySchema.parse({ startDate: "2026-08-01", endDate: "2026-07-01" }),
    ).toThrow();
  });
});
