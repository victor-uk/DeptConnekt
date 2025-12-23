import paginator from "../helpers/paginator.js";
import { generatePreview } from "../helpers/generatePreview.js";
import AssignmentSchema from "../models/AssignmentSchema.js";
import { StatusCodes } from "http-status-codes";
import {
  PermissionDeniedError,
  ResourceNotFoundError,
} from "../utils/Error.js";
import { getSchema } from "../helpers/getSchema.js";
import { buildFilter } from "../helpers/filterHelper.js";
import { getIO } from "../config/connectWebsocket.js";

export const createAssignment = async (req, res) => {
  const { title, description, deadline, image, attachments, admissionYear } =
    req.body;
  const { id, role } = req.user;
  const userModel =
    role === "lecturer" || role === "courseAdviser" ? "Lecturer" : "Student";

  const preview = generatePreview(description);

  const assignment = await AssignmentSchema.create({
    title,
    description,
    preview,
    deadline,
    image,
    attachments,
    admissionYear,
    createdBy: id,
    createdByModel: userModel,
  });

  const populated = await assignment.populate("createdBy", "lastName");

  // Emit events
  getIO()
    .to(`user:${populated.createdBy}`)
    .to(`role:admin`)
    .to(`admissionYear:${populated.admissionYear}`)
    .emit("newAssignment", { assignment: populated });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Assignment created",
    data: populated,
  });
};

export const getAssignments = async (req, res) => {
  const { page, limit, admissionYear, title } = req.query;
  const { role, id } = req.user;
  const { skip, queryLimit } = paginator(page, limit);

  const schema = getSchema(role);
  const user = await schema.findById(id);
  const filter = buildFilter(req.query, ["title"]);

  if (role === "lecturer" || role === "courseAdviser") {
    filter.createdBy = id;
  }
  // prevents students from acessing other level's resouces
  if (user?.admissionYear) {
    filter.admissionYear = user.admissionYear;
  }

  const assignments = await AssignmentSchema.find(filter)
    .skip(skip)
    .limit(queryLimit)
    .populate("createdBy", "lastName")
    .sort({ createdAt: -1 })
    .lean();

  if (assignments.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No assignments found",
      data: [],
    });
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Assignments fetched",
    data: assignments,
  });
};

export const getAssignmentById = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findById(id).populate(
    "createdBy",
    "lastName"
  );
  if (!assignment) throw new ResourceNotFoundError("Assignment not found");
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Assignment fetched",
    data: assignment,
  });
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, image, admissionYear } = req.body;

  const updatedDoc = {};
  if (title) updatedDoc.title = title;
  if (deadline) updatedDoc.deadline = deadline;
  if (image) updatedDoc.image = image;
  if (admissionYear) updatedDoc.admissionYear = admissionYear;
  if (description) {
    updatedDoc.description = description;
    updatedDoc.preview = generatePreview(description);
  }

  const assignment = await AssignmentSchema.findByIdAndUpdate(id, updatedDoc, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "lastName");

  if (!assignment) throw new ResourceNotFoundError("Assignment not found");

  // Emit update
  getIO()
    .to(`user:${assignment.createdBy._id}`)
    .to(`role:admin`)
    .to(`admissionYear:${assignment.admissionYear}`)
    .emit("updateAssignment", assignment);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Assignment updated",
    data: assignment,
  });
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findByIdAndDelete(id);
  if (!assignment) throw new ResourceNotFoundError("Assignment not found");

  // Emit delete
  getIO()
    .to(`user:${assignment.createdBy._id}`)
    .to(`role:admin`)
    .emit("deleteAssignment", { id });

  if (assignment.admissionYear) {
    getIO()
      .to(`admissionYear:${assignment.admissionYear}`)
      .emit("deleteAssignment", { id });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Assignment deleted",
    data: {},
  });
};

export const archiveAssignment = async (req, res) => {
  const { id } = req.params;

  const assignment = await AssignmentSchema.findById(id).populate(
    "createdBy",
    "lastName"
  );

  if (!assignment) throw new ResourceNotFoundError("Assignment not found");
  await assignment.archive();

  // Emit updates
  getIO()
    .to(`user:${assignment.createdBy._id}`)
    .to(`role:admin`)
    .emit("updateAssignment", assignment);

  if (assignment.admissionYear) {
    getIO()
      .to(`admissionYear:${assignment.admissionYear}`)
      .emit("deleteAssignment", { id: assignment._id });
  }

  res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Assignment archived", data: assignment });
};

export const unarchiveAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findById(id).populate(  
    "createdBy",
    "lastName"
  );
  if (!assignment) throw new ResourceNotFoundError("Assignment not found");
  await assignment.unarchive();

  // Emit updates
  getIO()
    .to(`user:${assignment.createdBy._id}`)
    .to(`role:admin`)
    .emit("updateAssignment", assignment);

  if (assignment.admissionYear) {
    getIO()
      .to(`admissionYear:${assignment.admissionYear}`)
      .emit("newAssignment", assignment);
  }

  res
    .status(StatusCodes.OK)
    .json({
      success: true,
      message: "Assignment unarchived",
      data: assignment,
    });
};
