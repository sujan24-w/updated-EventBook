
import bcrypt from "bcrypt";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/config/database";

describe("EventBook Backend Business Rules & Endpoints", () => {
  let userId: string;
  let userCookie: string;

  const email = `app-test-${Date.now()}@eventbook.test`;
  const password = "TestPassword123!";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id`,
      ["App Integration Test User", email, passwordHash]
    );

    userId = result.rows[0].id;
  });

  afterAll(async () => {
    try {
      if (userId) {
        await pool.query("DELETE FROM bookings WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      }
    } finally {
      await pool.end();
    }
  });

  test("GET /api/events returns a paginated event list", async () => {
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
  });

  test("POST /api/auth/login authenticates the test user and returns a cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();

    const cookies = res.headers["set-cookie"];
    userCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(userCookie).toContain("token=");
  });

  test("GET /api/admin/dashboard rejects a regular user with 403", async () => {
    expect(userCookie).toBeDefined();

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Cookie", userCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
