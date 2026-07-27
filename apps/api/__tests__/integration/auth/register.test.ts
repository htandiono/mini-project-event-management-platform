import { prisma } from "@eventure/database";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("POST /api/v1/auth/register", () => {
  const testEmail1 = `test_reg_1_${Date.now()}@example.com`;
  const testEmail2 = `test_reg_2_${Date.now()}@example.com`;
  const referrerEmail = `referrer_${Date.now()}@example.com`;
  let referrerCode = "";
  let referrerId = "";

  beforeAll(async () => {
    const referrer = await prisma.user.create({
      data: {
        email: referrerEmail,
        passwordHash: "hashed",
        name: "Referrer User",
        role: "CUSTOMER",
        referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "ACTIVE",
      },
    });
    referrerCode = referrer.referralCode;
    referrerId = referrer.id;
  });

  afterAll(async () => {
    await prisma.userCoupon.deleteMany({
      where: { user: { email: { in: [testEmail1, testEmail2, referrerEmail] } } },
    });
    await prisma.pointLedger.deleteMany({
      where: { user: { email: { in: [testEmail1, testEmail2, referrerEmail] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail1, testEmail2, referrerEmail] } },
    });
  });

  it("registers a new user successfully without referral code", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: testEmail1,
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "John Doe",
      role: "CUSTOMER",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail1.toLowerCase());
    expect(res.body.data.name).toBe("John Doe");
    expect(res.body.data.role).toBe("CUSTOMER");
    expect(res.body.data.referralCode).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("registers a new user with a valid referral code and awards points and coupon", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: testEmail2,
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "Jane Smith",
      role: "CUSTOMER",
      referralCode: referrerCode,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.referredById).toBe(referrerId);

    const points = await prisma.pointLedger.findMany({
      where: { userId: referrerId, type: "CREDIT" },
    });
    expect(points.length).toBeGreaterThan(0);
    expect(points[0]!.amount).toBe(10000);

    const coupons = await prisma.userCoupon.findMany({
      where: { userId: res.body.data.id },
    });
    expect(coupons.length).toBe(1);
  });

  it("fails registration with duplicate email", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: testEmail1,
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "John Doe",
      role: "CUSTOMER",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("fails registration with invalid referral code", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `invalid_ref_${Date.now()}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
        name: "Test User",
        role: "CUSTOMER",
        referralCode: "INVALID-CODE",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
