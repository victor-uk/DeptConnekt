import { StatusCodes } from "http-status-codes";
import { generatePreview } from "../helpers/generatePreview.js";
import paginator from "../helpers/paginator.js";
import EventSchema from "../models/EventSchema.js";
import { BadRequestError, ResourceNotFoundError } from "../utils/Error.js";

export const createEvent = async (req, res) => {
  const { id, role } = req.user;
  const { description } = req.body;

  // Determine the model for createdBy based on user role
  const userModel =
    role === "lecturer" || role === "courseAdviser" ? "Lecturer" : "Student";

  const preview = generatePreview(description);

  const event = await EventSchema.create({
    ...req.body,
    preview,
    createdBy: id,
    onModel: userModel,
  });

  const populated = await event.populate("createdBy", "fullName");
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Event created successfully",
    data: populated,
  });
};

export const getEvents = async (req, res) => {
  const { page, limit, title, location, archived, targetGroups, eventDate } = req.query;
  const { skip, queryLimit } = paginator(page, limit);

  const filter = {};
  if (title) filter.title = { $regex: title, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (targetGroups) filter.targetGroups = targetGroups;
  if (eventDate) {
    if (isNaN(new Date (eventDate).getTime())) {
      throw new BadRequestError("Invalid event date");
    }
    filter.eventDate = eventDate
  }
  filter.archived = archived === 'true' ? true : false;

  const events = await EventSchema.find(filter)
    .skip(skip)
    .limit(queryLimit)
    .populate("createdBy", "fullName")
    .sort({ eventDate: 1 }) // Sort by upcoming events
    .lean();

  if (events.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No events found",
      data: [],
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Events fetched successfully",
    data: events,
  });
};

export const getEventById = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findById(id).populate("createdBy", "fullName");
  if (!event) throw new ResourceNotFoundError("Event not found");

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Event fetched successfully",
    data: event,
  });
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  const updatedDoc = { ...req.body };
  if (description) {
    updatedDoc.preview = generatePreview(description);
  }

  const event = await EventSchema.findByIdAndUpdate(id, updatedDoc, {
    new: true,
    runValidators: true,
  });

  if (!event) throw new ResourceNotFoundError("Event not found");

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Event updated successfully",
    data: event,
  });
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findByIdAndDelete(id);
  if (!event) throw new ResourceNotFoundError("Event not found");
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Event deleted successfully",
    data: {},
  });
};

export const archiveEvent = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findById(id);
  if (!event) throw new ResourceNotFoundError("Event not found");
  await event.archive();
  res.status(StatusCodes.OK).json({ success: true, message: 'Event archived', data: event });
};

export const unarchiveEvent = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findById(id);
  if (!event) throw new ResourceNotFoundError("Event not found");
  await event.unarchive();
  res.status(StatusCodes.OK).json({ success: true, message: 'Event unarchived', data: event });
}