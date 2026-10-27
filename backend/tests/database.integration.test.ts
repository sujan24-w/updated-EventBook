
import { pool } from "../src/config/database";

describe("Database integration", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("has the expected application tables", async () => {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'events', 'bookings')
      ORDER BY table_name
    `);

    expect(result.rows.map((row) => row.table_name)).toEqual([
      "bookings",
      "events",
      "users",
    ]);
  });
});
