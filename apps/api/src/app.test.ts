import request from "supertest";

import vercelHandler, { createApp } from "./app.js";

interface HealthResponseBody {
  data: {
    timestamp: unknown;
  };
}

describe("API application", () => {
  const app = createApp({ frontendUrl: "http://localhost:3000" });

  it("exports a serverless handler for Vercel", () => {
    expect(vercelHandler).toBeTypeOf("function");
  });

  it("returns the health contract", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Eventure API is healthy",
      data: { status: "ok" },
    });
    const body = response.body as HealthResponseBody;
    expect(typeof body.data.timestamp).toBe("string");
  });

  it("uses the standard response for unknown routes", async () => {
    const response = await request(app).get("/api/v1/not-real");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route GET /api/v1/not-real was not found",
      errors: [],
    });
  });

  it("rejects malformed JSON without exposing implementation details", async () => {
    const response = await request(app)
      .post("/api/v1/not-real")
      .set("Content-Type", "application/json")
      .send('{"invalid"');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Malformed JSON payload",
      errors: [],
    });
  });
});
