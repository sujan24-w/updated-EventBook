
import { z } from "zod";

 const getEventsSchema = z.object({
     query: z.object({
        search: z.string().trim().optional().default(""),

       page: z.coerce.number().int().min(1).optional().default(1),

      limit: z.coerce.number().int().min(1).max(50).optional().default(6),

    sort: z
      .enum([
        "soonest",
        "latest",
        "shortest",
        "longest",
        "seats_high",
        "seats_low",
      ])
      .optional()
      .default("soonest"),

    availability: z
      .enum(["all", "available", "soldout", "cancelled","completed", "upcoming","ongoing"])
      .optional()
      .default("all"),

      includeCancelled: z.enum(["true", "false"])
        .optional()
         .default("false")
         .transform((value) => value === "true"),
  }),
});

 const eventFieldSchema = z.object({
    title: z.string().trim().min(3,"Title must be at least 3 characters").max(255,"Title cannot Exceed 225 characters"),
    description: z.string().trim().min(10,"Description must be at least 10 characters"),
    starts_at: z.coerce.date({
      message: "Please provide a valid event start date",
    }),
    ends_at: z.coerce.date({
      message: "Please provide a valid event end date",
    }),
    venue: z.string().trim().min(4,"Venue must be at least 4 characters").max(255,"Venue cannot exceed 255 characters"),
    total_seats: z.coerce.number().int().positive(),
    image_url: z.string().url().optional().nullable(),
  });



  const createEventSchema=  eventFieldSchema.refine(
    (data) => new Date(data.starts_at) >new Date(),{
      message: "Event start time must be in future",
      path: ["starts_at"]}
     ).refine(
    (data) =>new Date(data.ends_at) >  new Date(data.starts_at),{
      message: "End time must be after start time",
      path: ["ends_at"]}
  );

const updateEventSchema= eventFieldSchema
.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update an event",
    })
  .refine(
    (data) => {
      if (data.starts_at && data.ends_at) {
        return new Date(data.ends_at) > new Date(data.starts_at);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["ends_at"],
    }
  );
    

export {getEventsSchema,createEventSchema,updateEventSchema}
