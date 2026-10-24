import { Request , Response } from "express";
import {pool } from "../config/database";

 const getEvents= async (req:Request, res:Response)
:
Promise<void>=>{

    try{
      const  { search,
      page,
      limit,
      sort,
      availability,
      includeCancelled } =
        res.locals.validatedQuery;

const offset = (page - 1) * limit;


const  sortOptions: Record<string,string>= {

     soonest: "e.starts_at ASC",
     latest: "e.starts_at DESC",
      shortest: "(e.ends_at - e.starts_at) ASC",
      longest: "(e.ends_at - e.starts_at) DESC",
      seats_high: "available_seats DESC",
      seats_low: "available_seats ASC",
    };

const conditions: string[] = [
     "e.title ILIKE $1",
    "e.is_deleted = FALSE",];
if (availability === "cancelled") {
  conditions.push("e.is_cancelled = TRUE");
} 
else if (availability === "upcoming") {
      conditions.push("e.is_cancelled = FALSE AND NOW() < e.starts_at");
    }
else if (availability === "available") {
      conditions.push("e.is_cancelled = FALSE AND NOW() < e.starts_at");
      conditions.push(
        "GREATEST(e.total_seats - COALESCE(b.active_bookings, 0), 0) > 0"
      );
    }
    else if (availability === "completed") {
      conditions.push("e.is_cancelled = FALSE AND NOW() > e.ends_at");
    }
    else if (availability === "soldout") {
      conditions.push("e.is_cancelled = FALSE AND NOW() < e.starts_at");
      conditions.push(
        "GREATEST(e.total_seats - COALESCE(b.active_bookings, 0), 0) = 0"
      );
} 
else if (!includeCancelled) {
  conditions.push("e.is_cancelled = FALSE");
}
  

    const fromClause = `
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS active_bookings
        FROM bookings
        WHERE status = 'ACTIVE'
        GROUP BY event_id
      ) b ON b.event_id = e.id
    `;

    const whereClause = conditions.join(" AND ");

    // Fetch the current page of events.
    const eventsResult = await pool.query(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.starts_at,
          e.ends_at,
          e.venue,
          e.total_seats,
          e.image_url,
          e.is_cancelled,
          (
        e.created_at >= NOW() - INTERVAL '15 hours'
        AND e.is_cancelled= FALSE
        AND NOW() < e.ends_at
         ) AS is_new,
          CASE
          WHEN e.is_cancelled = TRUE THEN 'CANCELLED'
          WHEN NOW() < e.starts_at THEN 'UPCOMING'
          WHEN NOW() < e.ends_at THEN 'ONGOING'
          ELSE 'COMPLETED'
          END AS event_status,
          COALESCE(b.active_bookings, 0)::INT AS booked_seats,
          GREATEST(
            e.total_seats - COALESCE(b.active_bookings, 0),
            0
          )::INT AS available_seats,
          (
            GREATEST(
              e.total_seats - COALESCE(b.active_bookings, 0),
              0
            ) = 0
          ) AS is_sold_out
        ${fromClause}
        WHERE ${whereClause}
        ORDER BY ${sortOptions[sort]|| "e.starts_at ASC"}, e.id ASC
        LIMIT $2 OFFSET $3
      `,
      [`%${search}%`, limit, offset]
    );

    // Count all matching events for pagination.
    const countResult = await pool.query(
      `
        SELECT COUNT(*)::INT AS total
        ${fromClause}
        WHERE ${whereClause}
      `,
      [`%${search}%`]
    );

    const total: number = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      events: eventsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }); 

    }catch(error){
         console.error("Get events failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
    }
};


const getEventById =async (req:Request, res:Response)
:
Promise<void>=>{

    try{
  const {id} = req.params;

  if(!id){
     res.status(400).json({
        success:false,
        message:" Event   id is missing "
     });
     return
  };

   const result = await pool.query(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.starts_at,
          e.ends_at,
          e.venue,
          e.total_seats,
          e.image_url,
          e.is_cancelled,
          e.created_at,
          COALESCE(b.active_bookings, 0)::INT AS booked_seats,
          GREATEST(
            e.total_seats - COALESCE(b.active_bookings, 0),
            0
          )::INT AS available_seats,
          (
            e.created_at >= NOW() - INTERVAL '15 hours'
          ) AS is_new,
          CASE
            WHEN e.is_cancelled THEN 'CANCELLED'
            WHEN NOW() < e.starts_at THEN 'UPCOMING'
            WHEN NOW() < e.ends_at THEN 'ONGOING'
            ELSE 'COMPLETED'
          END AS event_status
        FROM events e
        LEFT JOIN (
          SELECT event_id, COUNT(*) AS active_bookings
          FROM bookings
          WHERE status = 'ACTIVE'
          GROUP BY event_id
        ) b ON b.event_id = e.id
        WHERE e.id = $1 AND
        e.is_deleted = FALSE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return
    }
      res.status(200).json({
      success: true,
      event: result.rows[0],
    });

    }catch(error){
     console.error("Get events failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
    }


};



const createEvent = async (req:Request ,
     res:Response ):Promise<void>=>{
     
     try{
       const {
      title,
      description,
      starts_at,
      ends_at,
      venue,
      total_seats,
      image_url,
    } = req.body;

     const result = await pool.query(
      `
        INSERT INTO events (
          title,
          description,
          starts_at,
          ends_at,
          venue,
          total_seats,
          image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        title,
        description,
        starts_at,
        ends_at,
        venue,
        total_seats,
        image_url ?? null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: result.rows[0],
    });

    }catch(error){
      console.error("Create event failed:", error);
      res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
   }


}


const updateEvent= async(
 req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const toUpdate = req.body;

    const existingResult = await pool.query(
      `SELECT starts_at, ends_at FROM events 
      WHERE id = $1 AND is_deleted =FALSE`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    const existingEvent = existingResult.rows[0];

   if (!toUpdate ||typeof toUpdate !== "object"
     || Array.isArray(toUpdate) ||
      Object.keys(toUpdate).length === 0)
       {
        await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }
    const allowedFields = [
      "title",
      "description",
      "starts_at",
      "ends_at",
      "venue",
      "total_seats",
      "image_url",
    ];
    const validFields = Object.keys(toUpdate).filter((field) =>
      allowedFields.includes(field)
    );

    if (validFields.length === 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
      return;
    }

    const startsAt = toUpdate.starts_at ?? existingEvent.starts_at;
    const endsAt = toUpdate.ends_at ?? existingEvent.ends_at;

     const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

     if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
       await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        message: "Invalid event date or time",
      });
      return;
    }
     if (endDate <= startDate) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
      return;
    }
      // 5. Prevent reducing seats below active bookings
    if (toUpdate.total_seats !== undefined) {
      const activeBookingsResult = await pool.query(
        `
          SELECT COUNT(*)::int AS active_bookings
          FROM bookings
          WHERE event_id = $1
            AND status = 'ACTIVE'
        `,
        [id]
      );
      const activeBookings =
        activeBookingsResult.rows[0].active_bookings;

      if (toUpdate.total_seats < activeBookings) {
         await client.query("ROLLBACK");
        res.status(409).json({
          success: false,
          message: `Total seats cannot be less than the ${activeBookings} active bookings`,
        });
        return;
      }
    }


    const fields = Object.keys(toUpdate);

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    // 6. Build the update query with correct placeholders
    const setClauses = validFields.map(
      (field, index) => `${field} = $${index + 1}`
    );

    const values = validFields.map(
      (field) => toUpdate[field]
    );

    values.push(id);
  //update non deleated event
    const result = await pool.query(
      `
        UPDATE events
        SET ${setClauses.join(", ")},
            updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `,
      values
    );
      if (result.rows.length === 0) {
         await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }
    //commit after all checks and update 
 await client.query("COMMIT");
    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: result.rows[0],
    });
  } catch (error) {
     try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
       console.error("Update event rollback failed:", rollbackError);
    }
    console.error("Update event failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }finally {
    client.release();
  }
};

 const cancelEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE events
        SET is_cancelled = TRUE,
            updated_at = NOW()
        WHERE id = $1
          AND is_cancelled = FALSE
           AND is_deleted = FALSE
        RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const existingEvent = await pool.query(
        `SELECT id, is_cancelled FROM events WHERE id = $1`,
        [id]
      );

      if (existingEvent.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "Event is already cancelled",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Cancel event failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel event",
    });
  }
};


 const softDeleteEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE events
        SET is_deleted = TRUE,
            updated_at = NOW()
        WHERE id = $1
          AND is_deleted = FALSE
        RETURNING id, title, is_deleted
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const existingEvent = await pool.query(
        `SELECT id FROM events WHERE id = $1`,
        [id]
      );

      if (existingEvent.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "Event is already deleted",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Soft-delete event failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

 const restoreEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE events
        SET is_deleted = FALSE,
            updated_at = NOW()
        WHERE id = $1
          AND is_deleted = TRUE
        RETURNING id, title, is_deleted
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const existingEvent = await pool.query(
        `SELECT id FROM events WHERE id = $1`,
        [id]
      );

      if (existingEvent.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "Event is not deleted",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event restored successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Restore event failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to restore event",
    });
  }
};




const   hardDelete =  async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Lock the event so it cannot be deleted concurrently.
    const eventResult = await client.query(
      `SELECT id FROM events WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    // Check whether this event has any bookings.
    const bookingResult = await client.query(
      `SELECT 1 FROM bookings WHERE event_id = $1 LIMIT 1`,
      [id]
    );

    if (bookingResult.rows.length > 0) {
      await client.query("ROLLBACK");

      res.status(409).json({
        success: false,
        message:
          "Cannot permanently delete an event that has bookings. Try Soft Delete",
      });
      return;
    }

    // Permanently delete the event only when no bookings exist.
    await client.query(
      `DELETE FROM events WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Event permanently deleted",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Hard delete event error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to permanently delete event",
    });
  } finally {
    client.release();
  }
};

const getAllAdminEvents = async (req: Request, res: Response): Promise<void> => {
  try {
const limit = parseInt(req.query.limit as string) || 15;
const page = parseInt(req.query.page as string) || 1;
const offset = (page - 1) * limit; 

const countResult = await pool.query(`SELECT COUNT(*) FROM events`);
const totalEvents = parseInt(countResult.rows[0].count, 10);
const totalPages = Math.ceil(totalEvents / limit);

const result = await pool.query(`
      SELECT 
        e.*,
      CASE
      WHEN e.is_cancelled = TRUE THEN 'CANCELLED'
      WHEN NOW() < e.starts_at THEN 'UPCOMING'
      WHEN NOW() < e.ends_at THEN 'ONGOING'
      ELSE 'COMPLETED'
    END AS event_status,
        (e.total_seats - COALESCE((
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.event_id = e.id AND b.status = 'ACTIVE'
        ), 0))::int AS available_seats
      FROM events e
      ORDER BY e.created_at DESC
      LIMIT $1 OFFSET $2
    `,[limit, offset]);

    res.status(200).json({
      success: true,
      events: result.rows,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch admin events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin events",
    });
  }
};

export {getEvents, 
    getEventById,
    createEvent,
    updateEvent,
    cancelEvent,
    softDeleteEvent,
  restoreEvent,
  hardDelete,
  getAllAdminEvents
  };