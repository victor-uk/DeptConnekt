import { Router } from "express";
import {
  verifyToken,
  authoriseRoles,
  validateInput,
  createEventSchema,
  updateEventSchema,
} from "../middlewares/authMiddleware.js";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  archiveEvent,
  unarchiveEvent,
} from "./EventController.js";

const router = Router({ mergeParams: true });

// All event routes require a valid token
router.use(verifyToken);

router
  .route("/events")
  .post(
    authoriseRoles({ roles: ["lecturer", "courseAdviser", "admin", "studentAdmin"] }),
    validateInput(createEventSchema),
    createEvent
  )
  .get(getEvents);

router
  .route("/events/:id")
  .get(getEventById)
  .patch(
    authoriseRoles({
      resourceName: "event",
      own: true,
      roles: ["admin"],
    }),
    validateInput(updateEventSchema),
    updateEvent
  )
  .delete(
    authoriseRoles({
      resourceName: "event",
      own: true,
      roles: ["admin"],
    }),
    deleteEvent
  );

const ownerOrAdminRoles = authoriseRoles({ resourceName: "event", own: true, roles: ["admin"] });

router.route("/events/:id/archive").patch(ownerOrAdminRoles, archiveEvent);
router.route("/events/:id/unarchive").patch(ownerOrAdminRoles, unarchiveEvent);

export default router;