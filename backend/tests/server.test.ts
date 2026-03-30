import request from "supertest";
import { app } from "../src/server";

describe("Health check", () => {
  it("should return status ok", async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body.status).toBe('ok')
    expect(response.body.service).toBe('book a barber backend')
  })
})