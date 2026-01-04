import { Router } from "express";
import {
  verifyToken,
  authoriseRoles,
  validateInput,
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../middlewares/authMiddleware.js";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  archiveAssignment,
  unarchiveAssignment,
} from "./AssignmentController.js";

const router = Router({ mergeParams: true });

// verifyToken middleware
router.use(verifyToken);

// assignment routes
/**
 * @swagger
 * /api/v1/assignments:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignments]
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
 *               - deadline
 *               - admissionYear
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               preview:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               admissionYear:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
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
 *         description: Filter by assignment title (search)
 *       - in: query
 *         name: admissionYear
 *         schema:
 *           type: integer
 *         description: Filter by admission year
 */
router
  .route("/assignments")
  .post(
    authoriseRoles({ roles: ["lecturer", "courseAdviser", "admin"] }),
    validateInput(createAssignmentSchema),
    createAssignment
  )
  .get(authoriseRoles({ roles: ["admin", "studentAdmin", "student", "lecturer", "courseAdviser"] }), getAssignments);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
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
 *         description: Assignment details
 *       404:
 *         description: Assignment not found
 *   patch:
 *     summary: Update an assignment
 *     tags: [Assignments]
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
 *         description: Assignment updated
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
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
 *         description: Assignment deleted
 */
router
  .route("/assignments/:id")
  .get(getAssignmentById)
  .patch(
    authoriseRoles({
      resourceName: "assignment",
      own: true,
      roles: ["admin"],
    }),
    validateInput(updateAssignmentSchema),
    updateAssignment
  )
  .delete(
    authoriseRoles({
      resourceName: "assignment",
      own: true,
      roles: ["admin"],
    }),
    deleteAssignment
  );

const ownerOrAdminRoles = authoriseRoles({ resourceName: "assignment", own: true, roles: ["admin"] });

/**
 * @swagger
 * /api/v1/assignments/{id}/archive:
 *   patch:
 *     summary: Archive an assignment
 *     tags: [Assignments]
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
 *         description: Assignment archived
 */
router.route("/assignments/:id/archive").patch(ownerOrAdminRoles, archiveAssignment);

/**
 * @swagger
 * /api/v1/assignments/{id}/unarchive:
 *   patch:
 *     summary: Unarchive an assignment
 *     tags: [Assignments]
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
 *         description: Assignment unarchived
 */
router.route("/assignments/:id/unarchive").patch(ownerOrAdminRoles, unarchiveAssignment);

export default router;