import { Router } from "express";
import {
  authMiddleware,
} from "../middlewares/authMiddleware";

import {
  adminMiddleware,
} from "../middlewares/adminMiddleware";

import { createEventSchema, 
  updateEventSchema } from "../validation/eventValidation";

import { validate } from "../middlewares/zodMiddleware";
import { cancelEvent, 
    createEvent,
     updateEvent,
     softDeleteEvent,
  restoreEvent,
  hardDelete,
  getAllAdminEvents
    } from "../controllers/eventController";

import {uploadImage} from "../config/uploadImage";

import { getEventBookings } from "../controllers/bookingController";
import { getAdminDashboard } from "../controllers/adminDashboard";
const router = Router();

router.use(authMiddleware, adminMiddleware);
router.post("/", uploadImage.single("image"),validate(createEventSchema), createEvent);
router.get("/events", getAllAdminEvents);
router.get("/events/:eventId/bookings", getEventBookings);

router.patch("/:id/cancel", cancelEvent);
router.patch("/:id/restore", restoreEvent);
router.delete("/harddelete/:id", hardDelete);
router.delete("/:id", softDeleteEvent);

router.patch("/:id",uploadImage.single("image"), validate(updateEventSchema), updateEvent);
 router.get("/dashboard", getAdminDashboard);

export default router;