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

router
  .route("/timetables")
  .post(
    canCreateRoles,
    validateInput(createTimetableSchema),
    createTimetable
  )
  .get(authoriseRoles({ roles: ["admin", "lecturer", "courseAdviser", "student", "studentAdmin"]}), getTimetables);

router
  .route("/timetables/:id")
  .get(authoriseRoles({ roles: ["admin", "lecturer", "courseAdviser", "student", "studentAdmin"]}), getTimetableById)
  .patch(
    canModifyRoles,
    validateInput(updateTimetableSchema),
    updateTimetable
  )
  .delete(canModifyRoles, deleteTimetable);

router
  .route("/timetables/:id/classes")
  .post(
    canCreateRoles,
    validateInput(addClassSchema),
    addClass
  );

router
  .route("/timetables/:id/classes/:classId")
  .delete(canModifyRoles, deleteClass);


router.route("/timetables/:id/archive").patch(canModifyRoles, archiveTimetable)

router.route("/timetables/:id/unarchive").patch(canModifyRoles, unarchiveTimetable)

export default router;