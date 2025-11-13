import paginator from "../helpers/paginator"
import { generatePreview } from "../helpers/generatePreview"
import AssignmentSchema from "../models/AssignmentSchema"
import { StatusCodes } from "http-status-codes";
import { ResourceNotFoundError } from "../utils/Error.js";

export const createAssignment = async (req, res) => {
  const { title, description, deadline, image, attachments, admissionYear } =
    req.body
  const { id, role } = req.user
  const userModel =
    role === 'lecturer' || role === 'courseAdviser' ? 'Lecturer' : 'Student'

  const preview = generatePreview(description)

  const assignment = await AssignmentSchema.create({
    title,
    description,
    preview,
    deadline,
    image,
    attachments,
    admissionYear,
    createdBy: id,
    createdByModel: userModel
  })

  const populated = await assignment.populate('createdBy', 'fullName')
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Assignment created',
    data: populated
  })
}

export const getAssignments = async (req, res) => {
  const { page, limit, title, createdBy, timeRemaining, admissionYear } = req.query
  const { skip, queryLimit } = paginator(page, limit)
  const filter = {}
  if (title) filter.title = { $regex: title, $options: 'i' }
  if (createdBy) filter.createdBy = createdBy
  if (timeRemaining) filter.timeRemaining = timeRemaining
  if (admissionYear) filter.admissionYear = admissionYear
  const assignments = await AssignmentSchema.find(filter)
    .skip(skip)
    .limit(queryLimit)
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean()

  if (assignments.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'No assignments found',
      data: []
    })
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Assignments fetched',
    data: assignments
  })
}

export const getAssignmentById = async (req, res) => {
  const { id } = req.params
  const assignment = await AssignmentSchema.findById(id).populate('createdBy', 'fullName')
  if (!assignment) throw new ResourceNotFoundError('Assignment not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Assignment fetched',
    data: assignment
  })
}

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
  });

  if (!assignment) throw new ResourceNotFoundError('Assignment not found');

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Assignment updated',
    data: assignment,
  });
}

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findByIdAndDelete(id);
  if (!assignment) throw new ResourceNotFoundError('Assignment not found');
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Assignment deleted',
    data: {},
  });
}

export const archiveAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findById(id);
  if (!assignment) throw new ResourceNotFoundError('Assignment not found');
  await assignment.archive();
  res.status(StatusCodes.OK).json({ success: true, message: 'Assignment archived', data: assignment });
}

export const unarchiveAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await AssignmentSchema.findById(id);
  if (!assignment) throw new ResourceNotFoundError('Assignment not found');
  await assignment.unarchive();
  res.status(StatusCodes.OK).json({ success: true, message: 'Assignment unarchived', data: assignment });
}
