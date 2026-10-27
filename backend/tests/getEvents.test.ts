
import { Request, Response } from "express";
import { pool } from "../src/config/database";
import { getEvents } from "../src/controllers/eventController";

jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("GET events controller", () => {
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
      .mockResolvedValueOnce({
        rows: [mockEvent],
      })
      .mockResolvedValueOnce({
        rows: [{ total: 1 }],
      });

    const req = {} as Request;

    const res = {
      locals: {
        validatedQuery: {
          search: "",
          page: 1,
          limit: 10,
          sort: "soonest",
          availability: undefined,
          includeCancelled: false,
        },
      },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        events: [mockEvent],
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      })
    );

    expect(pool.query).toHaveBeenCalledTimes(2);
  });

it("returns 500 when the database query fails", async () => {
    (pool.query as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    const req = {} as Request;

    const res = {
      locals: {
        validatedQuery: {
          search: "",
          page: 1,
          limit: 10,
          sort: "soonest",
          availability: undefined,
          includeCancelled: false,
        },
      },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to fetch events",
    });
  });
});
