import { describe, expect, it } from "vitest";

import { formatCountdown } from "./transaction-details";

describe("formatCountdown", () => {
  it("formats the payment window in hours and minutes", () => {
    expect(formatCountdown(90 * 60_000)).toBe("1h 30m remaining");
    expect(formatCountdown(0)).toBe("Deadline reached");
  });
});
