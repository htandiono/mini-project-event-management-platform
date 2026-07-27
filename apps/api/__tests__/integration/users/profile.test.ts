import { prisma } from "@eventure/database";
import bcrypt from "bcryptjs";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("GET & PATCH /api/v1/users/me", () => {
  const userEmail = `profile_user_${Date.now()}@example.com`;
  let cookie: string[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash,
        name: "Initial Name",
        role: "CUSTOMER",
        referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "ACTIVE",
      },
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: userEmail,
      password: "Password123!",
    });
    cookie = loginRes.headers["set-cookie"] || [];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: userEmail },
    });
  });

  it("retrieves the profile with point balance", async () => {
    const res = await request(app).get("/api/v1/users/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(userEmail.toLowerCase());
    expect(res.body.data.name).toBe("Initial Name");
    expect(res.body.data.pointBalance).toBe(0);
  });

  it("updates profile name successfully", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Cookie", cookie)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("fails profile access without authentication cookie", async () => {
    const res = await request(app).get("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
