import { prisma } from "@eventure/database";
import bcrypt from "bcryptjs";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("GET /api/v1/dashboard/statistics", () => {
  const orgEmail = `org_stats_${Date.now()}@example.com`;
  const custEmail = `cust_stats_${Date.now()}@example.com`;
  let orgCookie: string[] = [];
  let custCookie: string[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.createMany({
      data: [
        {
          email: orgEmail,
          passwordHash,
          name: "Organizer User",
          role: "ORGANIZER",
          referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "ACTIVE",
        },
        {
          email: custEmail,
          passwordHash,
          name: "Customer User",
          role: "CUSTOMER",
          referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "ACTIVE",
        },
      ],
    });

    const orgLogin = await request(app).post("/api/v1/auth/login").send({
      email: orgEmail,
      password: "Password123!",
    });
    orgCookie = orgLogin.headers["set-cookie"] || [];

    const custLogin = await request(app).post("/api/v1/auth/login").send({
      email: custEmail,
      password: "Password123!",
    });
    custCookie = custLogin.headers["set-cookie"] || [];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [orgEmail, custEmail] } },
    });
  });

  it("retrieves zeroed statistics for an organizer with no events", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/statistics")
      .set("Cookie", orgCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalRevenue).toBe(0);
    expect(res.body.data.summary.totalEvents).toBe(0);
    expect(Array.isArray(res.body.data.revenueByMonth)).toBe(true);
  });

  it("denies access to a CUSTOMER role", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/statistics")
      .set("Cookie", custCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
