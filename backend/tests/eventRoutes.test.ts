import request from "supertest";
import app from "../src/app";
import { pool } from "../src/config/database";

jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("GET /api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns events and pagination successfully", async () => {
    const mockEvent = {
      id: "event-123",
      title: "Test Event",
      available_seats: 20,
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [mockEvent] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] });

    const response = await request(app)
      .get("/api/events")
      .query({ page: 1, limit: 10, sort: "soonest" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.events).toEqual([mockEvent]);
    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    );
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});