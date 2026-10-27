
import { describe, expect, test, jest } from "@jest/globals";
import type { Response, NextFunction } from "express";
import {
  adminMiddleware,
} from "../src/middlewares/adminMiddleware";
import type {
  AuthenticatedRequest,
} from "../src/middlewares/authMiddleware";

describe("Actual adminMiddleware", () => {
  function createMocks(role?: "USER" | "ADMIN") {
    const req = {
      user: role
        ? { userId: "test-user-123", role }
        : undefined,
    } as AuthenticatedRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    return { req, res, next };
  }

  test("rejects a regular USER with 403", () => {
    const { req, res, next } = createMocks("USER");

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Admin access required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("allows an ADMIN to continue", () => {
    const { req, res, next } = createMocks("ADMIN");

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("rejects a request without an authenticated user", () => {
    const { req, res, next } = createMocks();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
