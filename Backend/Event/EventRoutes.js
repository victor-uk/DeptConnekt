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

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - preview
 *               - eventDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               preview:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               admissionYear:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by event title (search)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by event location
 *       - in: query
 *         name: admissionYear
 *         schema:
 *           type: integer
 *         description: Filter by admission year
 *       - in: query
 *         name: archived
 *         schema:
 *           type: boolean
 *         description: Filter by archived status
 *       - in: query
 *         name: eventDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by event date
 *     responses:
 *       200:
 *         description: List of events
 */
router
  .route("/events")
  .post(
    authoriseRoles({ roles: ["lecturer", "courseAdviser", "admin", "studentAdmin"] }),
    validateInput(createEventSchema),
    createEvent
  )
  .get(getEvents);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
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

/**
 * @swagger
 * /api/v1/events/{id}/archive:
 *   patch:
 *     summary: Archive an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event archived
 */
router.route("/events/:id/archive").patch(ownerOrAdminRoles, archiveEvent);

/**
 * @swagger
 * /api/v1/events/{id}/unarchive:
 *   patch:
 *     summary: Unarchive an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event unarchived
 */
router.route("/events/:id/unarchive").patch(ownerOrAdminRoles, unarchiveEvent);

export default router;