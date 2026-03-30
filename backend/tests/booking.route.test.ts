import request from "supertest";
import { app } from "../src/server";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as bookingService from "../src/services/bookingService";
import { AppError, HttpStatusCode } from "../src/lib/utils";

vi.mock("../src/services/bookingService", () => ({
  createBooking: vi.fn(),
  deleteBooking: vi.fn(),
  getBookingsByEmail: vi.fn(),
  loadBookings: vi.fn(),
}));

describe("POST /api/booking", () => {
  const validBookings = {
    email: "test@example.com",
    barberId: "barber-1",
    date: "2025-12-12",
    time: "11:00",
  };

  const createdBooking = {
    ...validBookings,
    id: "booking-1",
  };

  beforeAll(() => {
    process.env.API_KEY = "test-api-key";
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create a booking successfully", async () => {
    (bookingService.createBooking as any).mockResolvedValue(createdBooking);

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdBooking);
    expect(bookingService.createBooking).toHaveBeenCalledWith(validBookings);
  });

  it("should return 400 for invalid email", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Invalid email", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid email" });
  });

  it("should return 400 for invalid barberId", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Invalid barberId", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid barberId" });
  });

  it("should return 400 for invalid datetime", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Invalid datetime", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid datetime" });
  });

  it("should return 400 for past date booking", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Cannot book for past date", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Cannot book for past date" });
  });

  it("should return 400 for holidays booking", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Cannot book on holidays", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Cannot book on holidays" });
  });

  it("should return 400 for Sundays booking", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Cannot book on Sundays", HttpStatusCode.BadRequest)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Cannot book on Sundays" });
  });

  it("should return 404 for barbers not found", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Barber not found", HttpStatusCode.NotFound)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Barber not found" });
  });

  it("should return 409 if time slot is already booked", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Time slot already booked", HttpStatusCode.Conflict)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "Time slot already booked" });
  });

  it("should return 500 for internal server error", async () => {
    (bookingService.createBooking as any).mockRejectedValue(
      new AppError("Internal server error", HttpStatusCode.InternalServerError)
    );

    const response = await request(app)
      .post("/api/booking")
      .set({ "x-api-key": "test-api-key" })
      .send(validBookings);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error" });
  });
});

describe("GET - email /api/booking", () => {
  beforeAll(() => {
    process.env.API_KEY = "test-api-key";
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should retun booking by email", async () => {
    const bookings = [
      {
        id: "booking-1",
        email: "test@example.com",
        barberId: "barber-1",
        date: "2025-12-12",
        time: "11:00",
      },
    ];

    (bookingService.getBookingsByEmail as any).mockResolvedValue(bookings);

    const response = await request(app)
      .get("/api/booking?email=test@example.com")
      .set({
        "x-api-key": "test-api-key",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(bookings);
    expect(bookingService.getBookingsByEmail).toHaveBeenCalledWith(
      "test@example.com"
    );
  });

  it("should return 400 if email is missing", async () => {
    (bookingService.getBookingsByEmail as any).mockRejectedValue(
      new AppError("Email or barberId query parameter is required", HttpStatusCode.BadRequest)
    );

    const response = await request(app).get("/api/booking").set({
      "x-api-key": "test-api-key",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Email or barberId query parameter is required",
    });
  });

  it("should return 500 for internal server error", async () => {
    (bookingService.getBookingsByEmail as any).mockRejectedValue(
      new AppError("Internal server error", HttpStatusCode.InternalServerError)
    );

    const response = await request(app)
      .get("/api/booking?email=test@example.com")
      .set({
        "x-api-key": "test-api-key",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error" });
  });
});

describe("GET - barberID /api/booking", () => {
  beforeAll(() => {
    process.env.API_KEY = "test-api-key";
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return bookings by barberId", async () => {
    const bookings = [
      {
        id: "booking-1",
        email: "test@example.com",
        barberId: "barber-1",
        date: "2025-12-12",
        time: "11:00",
      },
    ];

    (bookingService.loadBookings as any).mockResolvedValue(bookings);

    const response = await request(app)
      .get("/api/booking?barberId=barber-1")
      .set({
        "x-api-key": "test-api-key",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(bookings);
  });

  it("should return 500 for internal server error", async () => {
    (bookingService.getBookingsByEmail as any).mockRejectedValue(
      new AppError("Internal server error", HttpStatusCode.InternalServerError)
    );

    const response = await request(app)
      .get("/api/booking?barberId=barber-1")
      .set({
        "x-api-key": "test-api-key",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error" });
  });
});

describe("DELETE =api/booking:id", () => {
  beforeAll(() => {
    process.env.API_KEY = "test-api-key";
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete booking successfully", async () => {
    (bookingService.deleteBooking as any).mockResolvedValue();

    const response = await request(app).delete("/api/booking/booking-1").set({
      "x-api-key": "test-api-key",
    });

    expect(response.status).toBe(204);
    expect(bookingService.deleteBooking).toHaveBeenCalledWith("booking-1");
  });

  it("should return 404 if the id is missing", async () => {
    const response = await request(app)
      .delete("/api/booking/")
      .set({
        "x-api-key": "test-api-key",
      });

    expect(response.status).toBe(404);
  });

  it("should return 404 if booking not found", async () => {
    (bookingService.deleteBooking as any).mockRejectedValue(
      new AppError("Booking not found", HttpStatusCode.NotFound)
    );

    const response = await request(app).delete("/api/booking/booking-4").set({
      "x-api-key": "test-api-key",
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Booking not found" });
  });
});
