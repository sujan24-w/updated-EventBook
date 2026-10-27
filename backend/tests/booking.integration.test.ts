import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/config/database";

/**
 * Real HTTP + PostgreSQL booking tests.
 * Auth uses the same JWT payload and cookie name as login:
 *   jwt.sign({ userId, role }, JWT_SECRET) and Cookie "token".
 * Records are tagged with a unique run id so cleanup never touches other data.
 */

const runId = randomUUID();

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function insertUser(label: string): Promise<string> {
  const email = `booking-it-${runId}-${label}@eventbook.test`;
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'USER')
     RETURNING id`,
    [`IT User ${label}`, email, "integration-test-placeholder-hash"]
  );
  const id: string = result.rows[0].id;
  createdUserIds.push(id);
  return id;
}

async function insertEvent(totalSeats: number): Promise<{
  id: string;
  title: string;
  venue: string;
  starts_at: Date;
  total_seats: number;
}> {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(Date.now() + 26 * 60 * 60 * 1000);
  const title = `IT Booking Event ${runId}`;
  const venue = "Integration Test Venue";

  const result = await pool.query(
    `INSERT INTO events (
       title, description, starts_at, ends_at, venue, total_seats
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, venue, starts_at, total_seats`,
    [
      title,
      "Integration test event created only for booking.integration.test.ts",
      startsAt,
      endsAt,
      venue,
      totalSeats,
    ]
  );

  createdEventIds.push(result.rows[0].id);
  return result.rows[0];
}

async function insertActiveBooking(eventId: string, userId: string): Promise<string> {
  const result = await pool.query(
    `INSERT INTO bookings (event_id, user_id, status)
     VALUES ($1, $2, 'ACTIVE')
     RETURNING id`,
    [eventId, userId]
  );
  return result.rows[0].id;
}

function userCookie(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from .env.test.local");
  }

  const token = jwt.sign({ userId, role: "USER" }, secret, { expiresIn: "1d" });
  return `token=${token}`;
}

async function countActiveBookings(eventId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS active_bookings
     FROM bookings
     WHERE event_id = $1
       AND status = 'ACTIVE'`,
    [eventId]
  );
  return result.rows[0].active_bookings;
}

async function cleanupCreatedRows(): Promise<void> {
  if (createdUserIds.length > 0) {
    await pool.query(
      `DELETE FROM bookings
       WHERE user_id = ANY($1::uuid[])`,
      [createdUserIds]
    );
  }

  if (createdEventIds.length > 0) {
    await pool.query(
      `DELETE FROM bookings
       WHERE event_id = ANY($1::uuid[])`,
      [createdEventIds]
    );
    await pool.query(
      `DELETE FROM events
       WHERE id = ANY($1::uuid[])`,
      [createdEventIds]
    );
  }

  if (createdUserIds.length > 0) {
    await pool.query(
      `DELETE FROM users
       WHERE id = ANY($1::uuid[])`,
      [createdUserIds]
    );
  }

  createdUserIds.length = 0;
  createdEventIds.length = 0;
}

describe("Booking integration (real Express app + test database)", () => {
  jest.setTimeout(60000);
  afterEach(async () => {
    await cleanupCreatedRows();
  });

  afterAll(async () => {
    try {
      await cleanupCreatedRows();
    } finally {
      await pool.end();
    }
  });

  test("creates an active booking and reduces remaining seats", async () => {
    const userId = await insertUser("booker");
    const event = await insertEvent(3);

    const response = await request(app)
      .post(`/api/bookings/${event.id}`)
      .set("Cookie", userCookie(userId));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Booking successful");
    expect(response.body.booking.status).toBe("ACTIVE");
    expect(response.body.booking.event_id).toBe(event.id);
    expect(response.body.booking.user_id).toBe(userId);
    expect(response.body.event.seats_left).toBe(2);

    const stored = await pool.query(
      `SELECT id, event_id, user_id, status
       FROM bookings
       WHERE id = $1`,
      [response.body.booking.id]
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].status).toBe("ACTIVE");
    expect(stored.rows[0].event_id).toBe(event.id);
    expect(stored.rows[0].user_id).toBe(userId);

    expect(await countActiveBookings(event.id)).toBe(1);
  });

  test("rejects booking when the event has no remaining seats", async () => {
    const holderId = await insertUser("seat-holder");
    const requesterId = await insertUser("late-booker");
    const event = await insertEvent(1);

    await insertActiveBooking(event.id, holderId);
    expect(await countActiveBookings(event.id)).toBe(1);

    const response = await request(app)
      .post(`/api/bookings/${event.id}`)
      .set("Cookie", userCookie(requesterId));

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "This event is fully booked",
    });

    expect(await countActiveBookings(event.id)).toBe(1);

    const extra = await pool.query(
      `SELECT id
       FROM bookings
       WHERE event_id = $1
         AND user_id = $2`,
      [event.id, requesterId]
    );
    expect(extra.rows).toHaveLength(0);
  });

  test("cancels an active booking and frees the seat for the same user", async () => {
    const userId = await insertUser("canceller");
    const event = await insertEvent(1);
    const bookingId = await insertActiveBooking(event.id, userId);

    expect(await countActiveBookings(event.id)).toBe(1);

    const cancelResponse = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Cookie", userCookie(userId));

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.success).toBe(true);
    expect(cancelResponse.body.message).toBe("Booking cancelled successfully");
    expect(cancelResponse.body.booking.id).toBe(bookingId);
    expect(cancelResponse.body.booking.status).toBe("CANCELLED");

    const stored = await pool.query(
      `SELECT status
       FROM bookings
       WHERE id = $1`,
      [bookingId]
    );
    expect(stored.rows[0].status).toBe("CANCELLED");
    expect(await countActiveBookings(event.id)).toBe(0);

    const rebookResponse = await request(app)
      .post(`/api/bookings/${event.id}`)
      .set("Cookie", userCookie(userId));

    expect(rebookResponse.status).toBe(201);
    expect(rebookResponse.body.success).toBe(true);
    expect(rebookResponse.body.message).toBe("Booking successful");
    expect(rebookResponse.body.booking.status).toBe("ACTIVE");
    expect(rebookResponse.body.booking.event_id).toBe(event.id);
    expect(rebookResponse.body.booking.user_id).toBe(userId);
    expect(rebookResponse.body.event.seats_left).toBe(0);
    expect(await countActiveBookings(event.id)).toBe(1);
  });
});
