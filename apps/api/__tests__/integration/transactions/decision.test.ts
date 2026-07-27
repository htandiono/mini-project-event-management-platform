import { prisma } from "@eventure/database";
import bcrypt from "bcryptjs";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../../src/app.js";

const app = createApp({ frontendUrl: "http://localhost:3000" });

describe("PATCH /api/v1/organizer/transactions/:id/accept, reject, attend", () => {
  const orgEmail = `org_dec_${Date.now()}@example.com`;
  const custEmail = `cust_dec_${Date.now()}@example.com`;
  let orgCookie: string[] = [];
  let orgId = "";
  let custId = "";
  let eventId = "";
  let ticketTypeId = "";
  let txAcceptId = "";
  let txRejectId = "";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const org = await prisma.user.create({
      data: {
        email: orgEmail,
        passwordHash,
        name: "Organizer Dec",
        role: "ORGANIZER",
        referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "ACTIVE",
      },
    });
    orgId = org.id;

    const cust = await prisma.user.create({
      data: {
        email: custEmail,
        passwordHash,
        name: "Customer Dec",
        role: "CUSTOMER",
        referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "ACTIVE",
      },
    });
    custId = cust.id;

    const orgLogin = await request(app).post("/api/v1/auth/login").send({
      email: orgEmail,
      password: "Password123!",
    });
    orgCookie = orgLogin.headers["set-cookie"] || [];

    const category = await prisma.category.create({
      data: {
        name: `Cat Dec ${Date.now()}`,
        slug: `cat-dec-${Date.now()}`,
      },
    });

    const now = new Date();
    const event = await prisma.event.create({
      data: {
        organizerId: org.id,
        categoryId: category.id,
        name: "Test Event Dec",
        slug: `test-event-dec-${Date.now()}`,
        description: "Test description",
        venue: "Test venue",
        address: "Test address",
        city: "Jakarta",
        province: "DKI Jakarta",
        startsAt: new Date(now.getTime() - 4 * 3600 * 1000), // Started 4 hours ago
        endsAt: new Date(now.getTime() - 2 * 3600 * 1000), // Ended 2 hours ago
        capacity: 100,
        availableSeats: 98,
        status: "PUBLISHED",
      },
    });
    eventId = event.id;

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: "Regular",
        price: 100000,
        capacity: 100,
        availableSeats: 98,
      },
    });
    ticketTypeId = ticketType.id;

    const tx1 = await prisma.transaction.create({
      data: {
        invoiceNumber: `INV-ACC-${Date.now()}`,
        customerId: cust.id,
        eventId: event.id,
        status: "WAITING_FOR_CONFIRMATION",
        subtotal: 100000,
        total: 100000,
        paymentDeadline: new Date(now.getTime() + 24 * 3600 * 1000),
        organizerDeadline: new Date(now.getTime() + 72 * 3600 * 1000),
        items: {
          create: [
            {
              ticketTypeId: ticketType.id,
              quantity: 1,
              unitPrice: 100000,
              subtotal: 100000,
            },
          ],
        },
      },
    });
    txAcceptId = tx1.id;

    const tx2 = await prisma.transaction.create({
      data: {
        invoiceNumber: `INV-REJ-${Date.now()}`,
        customerId: cust.id,
        eventId: event.id,
        status: "WAITING_FOR_CONFIRMATION",
        subtotal: 100000,
        total: 100000,
        paymentDeadline: new Date(now.getTime() + 24 * 3600 * 1000),
        organizerDeadline: new Date(now.getTime() + 72 * 3600 * 1000),
        items: {
          create: [
            {
              ticketTypeId: ticketType.id,
              quantity: 1,
              unitPrice: 100000,
              subtotal: 100000,
            },
          ],
        },
      },
    });
    txRejectId = tx2.id;
  });

  afterAll(async () => {
    await prisma.transactionItem.deleteMany({
      where: { transaction: { eventId } },
    });
    await prisma.transaction.deleteMany({
      where: { eventId },
    });
    await prisma.ticketType.deleteMany({
      where: { eventId },
    });
    await prisma.event.deleteMany({
      where: { id: eventId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [orgId, custId] } },
    });
  });

  it("accepts an order waiting for confirmation", async () => {
    const res = await request(app)
      .patch(`/api/v1/organizer/transactions/${txAcceptId}/accept`)
      .set("Cookie", orgCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("DONE");
  });

  it("rejects an order waiting for confirmation and restores seats", async () => {
    const res = await request(app)
      .patch(`/api/v1/organizer/transactions/${txRejectId}/reject`)
      .set("Cookie", orgCookie)
      .send({ reason: "Invalid payment transfer proof" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("REJECTED");
    expect(res.body.data.cancellationReason).toBe("Invalid payment transfer proof");

    const updatedEvent = await prisma.event.findUnique({ where: { id: eventId } });
    expect(updatedEvent?.availableSeats).toBe(99); // Initial 98 + 1 restored
  });

  it("marks attendance for a DONE order after event has ended", async () => {
    const res = await request(app)
      .patch(`/api/v1/organizer/transactions/${txAcceptId}/attend`)
      .set("Cookie", orgCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAttended).toBe(true);
  });
});
