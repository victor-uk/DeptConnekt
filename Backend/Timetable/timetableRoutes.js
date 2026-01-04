import { Router } from "express";
import {
  verifyToken,
  authoriseRoles,
  validateInput,
  createTimetableSchema,
  updateTimetableSchema,
  addClassSchema,
} from "../middlewares/authMiddleware.js";
import {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
  addClass,
  deleteClass,
  archiveTimetable,
  unarchiveTimetable,
} from "./timetableController.js";

const router = Router({ mergeParams: true });

// All timetable routes require a valid token
router.use(verifyToken);

const canCreateRoles = authoriseRoles({ roles: ["courseAdviser", "lecturer"] });
const canModifyRoles = authoriseRoles({ resourceName: "timetable", own: true, roles: ["admin"] });

/**
 * @swagger
 * /api/v1/timetables:
 *   post:
 *     summary: Create a new timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admissionYear
 *               - semester
 *               - level
 *             properties:
 *               admissionYear:
 *                 type: number
 *               semester:
 *                 type: string
 *                 enum: ["First", "Second"]
 *               level:
 *                 type: string
 *                 enum: ["100", "200", "300", "400", "500"]
 *     responses:
 *       201:
 *         description: Timetable created
 *   get:
 *     summary: Get all timetables
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: admissionYear
 *         schema:
 *           type: number
 *         description: Filter by admission year
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: ["First", "Second"]
 *         description: Filter by semester
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: ["100", "200", "300", "400", "500"]
 *         description: Filter by level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: archived
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of timetables
 */
router
  .route("/timetables")
  .post(
    canCreateRoles,
    validateInput(createTimetableSchema),
    createTimetable
  )
  .get(authoriseRoles({ roles: ["admin", "lecturer", "courseAdviser", "student", "studentAdmin"] }), getTimetables);

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   get:
 *     summary: Get timetable by ID
 *     tags: [Timetables]
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
 *         description: Timetable details
 *   patch:
 *     summary: Update a timetable
 *     tags: [Timetables]
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
 *               semester:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timetable updated
 *   delete:
 *     summary: Delete a timetable
 *     tags: [Timetables]
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
 *         description: Timetable deleted
 */
router
  .route("/timetables/:id")
  .get(authoriseRoles({ roles: ["admin", "lecturer", "courseAdviser", "student", "studentAdmin"] }), getTimetableById)
  .patch(
    canModifyRoles,
    validateInput(updateTimetableSchema),
    updateTimetable
  )
  .delete(canModifyRoles, deleteTimetable);

/**
 * @swagger
 * /api/v1/timetables/{id}/classes:
 *   post:
 *     summary: Add a class to a timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - day
 *               - classData
 *             properties:
 *               day:
 *                 type: string
 *               classData:
 *                 type: object
 *                 required:
 *                   - courseCode
 *                   - courseTitle
 *                   - lecturer
 *                   - venue
 *                   - startTime
 *                   - endTime
 *                 properties:
 *                   courseCode:
 *                     type: string
 *                   courseTitle:
 *                     type: string
 *                   lecturer:
 *                     type: string
 *                   venue:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *     responses:
 *       201:
 *         description: Class added successfully
 */
router
  .route("/timetables/:id/classes")
  .post(
    canCreateRoles,
    validateInput(addClassSchema),
    addClass
  );

/**
 * @swagger
 * /api/v1/timetables/{id}/classes/{classId}:
 *   delete:
 *     summary: Remove a class from a timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: classId
 *         required: true
 *       - in: query
 *         name: dayName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the day (e.g., Monday)
 *       - in: query
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Code of the course to remove
 *     responses:
 *       200:
 *         description: Class removed
 */
router
  .route("/timetables/:id/classes/:classId")
  .delete(canModifyRoles, deleteClass);

/**
 * @swagger
 * /api/v1/timetables/{id}/archive:
 *   patch:
 *     summary: Archive a timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Timetable archived
 */
router.route("/timetables/:id/archive").patch(canModifyRoles, archiveTimetable)

/**
 * @swagger
 * /api/v1/timetables/{id}/unarchive:
 *   patch:
 *     summary: Unarchive a timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Timetable unarchived
 */
router.route("/timetables/:id/unarchive").patch(canModifyRoles, unarchiveTimetable)

export default router;