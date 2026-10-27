import { describe, expect, test, beforeAll, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../src/middlewares/authMiddleware";

const JWT_SECRET = "test-secret-for-auth-middleware";

describe("Actual authMiddleware", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  function createMocks(token?: string) {
    const req = {
      cookies: token ? { token } : {},
    } as unknown as AuthenticatedRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    return { req, res, next };
  }

  test("rejects a request with no token", () => {
    const { req, res, next } = createMocks();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("accepts a valid USER token", () => {
    const token = jwt.sign(
      { userId: "test-user-123", role: "USER" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { req, res, next } = createMocks(token);

    authMiddleware(req, res, next);

    expect(req.user).toEqual({
      userId: "test-user-123",
      role: "USER",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("rejects an invalid token", () => {
    const { req, res, next } = createMocks("invalid-token");

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects an expired token", () => {
    const token = jwt.sign(
      { userId: "test-user-123", role: "USER" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const { req, res, next } = createMocks(token);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});