import { prisma } from "@eventure/database";
import bcrypt from "bcryptjs";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("POST /api/v1/auth/login", () => {
  const activeEmail = `login_active_${Date.now()}@example.com`;
  const suspendedEmail = `login_susp_${Date.now()}@example.com`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.createMany({
      data: [
        {
          email: activeEmail,
          passwordHash,
          name: "Active User",
          role: "CUSTOMER",
          referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "ACTIVE",
        },
        {
          email: suspendedEmail,
          passwordHash,
          name: "Suspended User",
          role: "CUSTOMER",
          referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "SUSPENDED",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [activeEmail, suspendedEmail] } },
    });
  });

  it("logs in successfully with valid credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: activeEmail,
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(activeEmail.toLowerCase());
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("fails login with incorrect password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: activeEmail,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("fails login with non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: `non_existent_${Date.now()}@example.com`,
        password: "Password123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("fails login when account is suspended", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: suspendedEmail,
      password: "Password123!",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
