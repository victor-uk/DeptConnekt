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
router
  .route("/assignments")
  .post(
    authoriseRoles({ roles: ["lecturer", "courseAdviser", "admin"] }),
    validateInput(createAssignmentSchema),
    createAssignment
  )
  .get(authoriseRoles({ own: true, resourceName: "assignment", roles: ["admin", "studentAdmin", "student"] }), getAssignments);

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

router.route("/assignments/:id/archive").patch(ownerOrAdminRoles, archiveAssignment);
router.route("/assignments/:id/unarchive").patch(ownerOrAdminRoles, unarchiveAssignment);

export default router;