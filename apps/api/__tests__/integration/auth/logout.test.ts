import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("POST /api/v1/auth/logout", () => {
  it("clears auth cookies on logout", async () => {
    const res = await request(app).post("/api/v1/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();

    const cookies: string[] = res.headers["set-cookie"] || [];
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie).toContain("Expires=Thu, 01 Jan 1970");
  });
});
