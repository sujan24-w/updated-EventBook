
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { pool } from "../src/config/database";

jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

describe("POST /api/bookings/:eventId", () => {
  const mockClientQuery = jest.fn();
  const mockRelease = jest.fn();

  const eventId = "event-123";
  const userId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "jest-test-secret";

    (pool.connect as jest.Mock).mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    });

    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "ROLLBACK" || sql === "COMMIT") {
        return { rows: [] };
      }

      if (sql.includes("FROM events")) {
        return {
          rows: [
            {
              id: eventId,
              title: "Test Event",
              venue: "Butwal",
              starts_at: new Date(Date.now() + 86400000),
              total_seats: 10,
              is_cancelled: false,
            },
          ],
        };
      }

      if (
        sql.includes("FROM bookings") &&
        sql.includes("user_id = $2")
      ) {
        return {
          rows: [{ id: "existing-booking-123" }],
        };
      }

      return { rows: [] };
    });
  });

  it("rejects a duplicate active booking", async () => {
    const token = jwt.sign(
      { userId, role: "USER" },
      "jest-test-secret"
    );

    const response = await request(app)
      .post(`/api/bookings/${eventId}`)
      .set("Cookie", `token=${token}`);

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      success: false,
      message: "You have already booked this event",
    });

    expect(
        mockClientQuery.mock.calls.some(([sql]) =>
          sql.includes("INSERT INTO bookings")
        )
      ).toBe(false);

    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
  it("creates a booking successfully", async () => {
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (
        sql === "BEGIN" ||
        sql === "COMMIT" ||
        sql === "ROLLBACK"
      ) {
        return { rows: [] };
      }
  
      if (sql.includes("FROM events")) {
        return {
          rows: [
            {
              id: eventId,
              title: "Test Event",
              venue: "Butwal",
              starts_at: new Date(Date.now() + 86400000),
              total_seats: 10,
              is_cancelled: false,
            },
          ],
        };
      }
  
      if (
        sql.includes("FROM bookings") &&
        sql.includes("user_id = $2")
      ) {
        return { rows: [] };
      }
  
      if (sql.includes("COUNT(*)")) {
        return { rows: [{ active_bookings: 2 }] };
      }
  
      if (sql.includes("INSERT INTO bookings")) {
        return {
          rows: [
            {
              id: "booking-123",
              event_id: eventId,
              user_id: userId,
              status: "ACTIVE",
            },
          ],
        };
      }
  
      return { rows: [] };
    });
  
    const token = jwt.sign(
      { userId, role: "USER" },
      "jest-test-secret"
    );
  
    const response = await request(app)
      .post(`/api/bookings/${eventId}`)
      .set("Cookie", `token=${token}`);
  
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Booking successful");
    expect(response.body.booking.id).toBe("booking-123");
    expect(response.body.event.seats_left).toBe(7);
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
  it("rejects booking when the event is fully booked", async () => {
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (
        sql === "BEGIN" ||
        sql === "COMMIT" ||
        sql === "ROLLBACK"
      ) {
        return { rows: [] };
      }
  
      if (sql.includes("FROM events")) {
        return {
          rows: [
            {
              id: eventId,
              title: "Test Event",
              venue: "Butwal",
              starts_at: new Date(Date.now() + 86400000),
              total_seats: 10,
              is_cancelled: false,
            },
          ],
        };
      }
  
      if (
        sql.includes("FROM bookings") &&
        sql.includes("user_id = $2")
      ) {
        return { rows: [] };
      }
  
      if (sql.includes("COUNT(*)")) {
        return {
          rows: [{ active_bookings: 10 }],
        };
      }
  
      if (sql.includes("INSERT INTO bookings")) {
        throw new Error("Booking should not be inserted");
      }
  
      return { rows: [] };
    });
  
    const token = jwt.sign(
      { userId, role: "USER" },
      "jest-test-secret"
    );
  
    const response = await request(app)
      .post(`/api/bookings/${eventId}`)
      .set("Cookie", `token=${token}`);
  
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "This event is fully booked",
    });
  
    expect(
      mockClientQuery.mock.calls.some(([sql]) =>
        sql.includes("INSERT INTO bookings")
      )
    ).toBe(false);
  
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

});



describe("PATCH /api/bookings/:bookingId/cancel", () => {
    const bookingId = "booking-123";
    const userId = "user-123"; 
  
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.JWT_SECRET = "jest-test-secret";
    });
  it("cancels an active booking successfully", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: bookingId,
            status: "ACTIVE",
            starts_at: new Date(Date.now() + 86400000),
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: bookingId,
            event_id: "event-123",
            status: "CANCELLED",
            updated_at: new Date(),
          },
        ],
      });

    const token = jwt.sign(
      { userId, role: "USER" },
      "jest-test-secret"
    );

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Cookie", `token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Booking cancelled successfully"
    );
    expect(response.body.booking.status).toBe("CANCELLED");
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
