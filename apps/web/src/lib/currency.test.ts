import { formatIdr } from "./currency";

describe("formatIdr", () => {
  it("formats whole rupiah values without fractional digits", () => {
    const result = formatIdr(150_000);

    expect(result).toContain("150.000");
    expect(result).not.toContain(",00");
  });
});
