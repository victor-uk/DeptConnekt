import { StatusCodes } from "http-status-codes";
import { generatePreview } from "../helpers/generatePreview.js";
import paginator from "../helpers/paginator.js";
import EventSchema from "../models/EventSchema.js";
import { BadRequestError, ResourceNotFoundError } from "../utils/Error.js";
import { getIO } from "../config/connectWebsocket.js";

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
    createdByModel: userModel,
  });

  const populated = await event.populate("createdBy", "lastName");

  // Emit events to staff
  const roles = ["lecturer", "courseAdviser", "admin"];
  roles.forEach((r) => getIO().to(`role:${r}`).emit("newEvent", populated));

  // Emit to target admission years
  if (populated.admissionYear && populated.admissionYear.length > 0) {
    populated.admissionYear.forEach((year) => {
      getIO().to(`admissionYear:${year}`).emit("newEvent", populated);
    });
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Event created successfully",
    data: populated,
  });
};

export const getEvents = async (req, res) => {
  const { page, limit, title, location, archived, admissionYear, eventDate } = req.query;
  const { skip, queryLimit } = paginator(page, limit);

  const filter = {};
  if (title) filter.title = { $regex: title, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (admissionYear) filter.admissionYear = admissionYear;
  if (eventDate) {
    if (isNaN(new Date(eventDate).getTime())) {
      throw new BadRequestError("Invalid event date");
    }
    filter.eventDate = eventDate
  }
  filter.archived = archived === 'true' ? true : false;

  const events = await EventSchema.find(filter)
    .skip(skip)
    .limit(queryLimit)
    .populate("createdBy", "lastName")
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
  const event = await EventSchema.findById(id).populate("createdBy", "lastName");
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
  }).populate("createdBy", "lastName");

  if (!event) throw new ResourceNotFoundError("Event not found");

  // Emit updates
  const roles = ["lecturer", "courseAdviser", "admin"];
  roles.forEach((r) => getIO().to(`role:${r}`).emit("updateEvent", event));
  if (event.admissionYear && event.admissionYear.length > 0) {
    event.admissionYear.forEach((year) => {
      getIO().to(`admissionYear:${year}`).emit("updateEvent", event);
    });
  }

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

  // Emit delete
  getIO().to("role:admin").emit("deleteEvent", { id });
  getIO().to(`user:${event.createdBy}`).emit("deleteEvent", { id });

  if (event.admissionYear && event.admissionYear.length > 0) {
    event.admissionYear.forEach((year) => {
      getIO().to(`admissionYear:${year}`).emit("deleteEvent", { id });
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Event deleted successfully",
    data: {},
  });
};

export const archiveEvent = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findById(id).populate("createdBy", "lastName");
  if (!event) throw new ResourceNotFoundError("Event not found");
  await event.archive();

  // Emit updates
  getIO().to("role:admin").emit("updateEvent", event);
  getIO().to(`user:${event.createdBy}`).emit("updateEvent", event);

  if (event.admissionYear && event.admissionYear.length > 0) {
    event.admissionYear.forEach((year) => {
      getIO().to(`admissionYear:${year}`).emit("deleteEvent", { id: event._id });
    });
  }

  res.status(StatusCodes.OK).json({ success: true, message: 'Event archived', data: event });
};

export const unarchiveEvent = async (req, res) => {
  const { id } = req.params;
  const event = await EventSchema.findById(id).populate("createdBy", "lastName");
  if (!event) throw new ResourceNotFoundError("Event not found");
  await event.unarchive();

  // Emit updates
  getIO().to("role:admin").emit("updateEvent", event);
  getIO().to(`user:${event.createdBy._id || event.createdBy}`).emit("updateEvent", event);

  if (event.admissionYear && event.admissionYear.length > 0) {
    event.admissionYear.forEach((year) => {
      getIO().to(`admissionYear:${year}`).emit("newEvent", event);
    });
  }

  res.status(StatusCodes.OK).json({ success: true, message: 'Event unarchived', data: event });
}