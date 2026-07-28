import { describe, expect, it } from "vitest";

import { resolveMailTransport } from "./email.service.js";

describe("resolveMailTransport", () => {
  it("uses the native Resend API key as an implicit TLS SMTP credential", () => {
    expect(resolveMailTransport({ RESEND_API_KEY: "re_test" })).toEqual({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: "re_test" },
    });
  });

  it("keeps supporting explicit SMTP credentials", () => {
    expect(
      resolveMailTransport({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: 587,
        SMTP_USER: "user",
        SMTP_PASS: "pass",
      }),
    ).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "user", pass: "pass" },
    });
  });

  it("rejects incomplete fallback SMTP credentials", () => {
    expect(() => resolveMailTransport({ SMTP_HOST: "smtp.example.com" })).toThrow(
      "Complete SMTP credentials are required when Resend is not configured",
    );
  });
});
