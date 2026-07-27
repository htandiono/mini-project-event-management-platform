import { describe, expect, it } from "vitest";

import { formatCountdown, validatePaymentProofFile } from "./transaction-details";

describe("formatCountdown", () => {
  it("formats the payment window in hours and minutes", () => {
    expect(formatCountdown(90 * 60_000)).toBe("1h 30m remaining");
    expect(formatCountdown(0)).toBe("Deadline reached");
  });
});

describe("validatePaymentProofFile", () => {
  it("accepts supported images within the upload limit", () => {
    const file = new File(["proof"], "proof.jpg", { type: "image/jpeg" });

    expect(validatePaymentProofFile(file)).toBeNull();
  });

  it("rejects unsupported files and oversized images", () => {
    const document = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "proof.png", {
      type: "image/png",
    });

    expect(validatePaymentProofFile(document)).toMatch(/JPEG/);
    expect(validatePaymentProofFile(oversized)).toMatch(/5 MB/);
  });
});
