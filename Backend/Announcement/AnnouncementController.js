import { StatusCodes } from 'http-status-codes'
import AnnouncementSchema from '../models/AnnouncementSchema.js'
import { generatePreview } from '../helpers/generatePreview.js'
import paginator from '../helpers/paginator.js'
import { PermissionDeniedError, ResourceNotFoundError } from '../utils/Error.js'
import { buildFilter } from '../helpers/filterHelper.js'
import { getSchema } from '../helpers/getSchema.js'
import mongoose from 'mongoose'
import { getIO } from '../config/connectWebsocket.js'
/**
 * @desc Create a new announcement
 * @route POST /api/v1/announcements
 * @access Private (Lecturer, Admin)
 */
export const createAnnouncement = async (req, res) => {
  const { title, body, image, attachments, category, admissionYear } = req.body
  const { id, role } = req.user
  const preview = generatePreview(body)

  // Determine which model to reference based on the user's role
  const userModel = (role === 'lecturer' || role === 'courseAdviser') ? 'Lecturer' : 'Student'

  let announcement = await AnnouncementSchema.create({
    title,
    body,
    preview,
    image,
    attachments,
    category,
    admissionYear,
    createdBy: id,
    createdByModel: userModel // createdBy refs createdByModel through ref path
  })
  announcement = await AnnouncementSchema.findById(announcement._id).populate('createdBy', 'lastName _id')
  getIO()
    .to(`role:lecturer`)
    .to(`role:courseAdviser`)
    .to(`role:admin`)
    .to(`admissionYear:${admissionYear}`)
    .emit('newAnnouncement', { title, preview, category, admissionYear })

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Annoucement created',
    data: announcement
  })
}

/**
 * @desc 
 */
export const getAnnouncements = async (req, res) => {
  const { timeline, page, limit } = req.query
  const { skip, queryLimit } = paginator(page, limit)
  const { role, id } = req.user
  const schema = getSchema(role)

  const user = await schema.findById(id).lean()
  // console.log(user, id, role);

  // Use the reusable filter builder
  const filter = buildFilter(req.query, ['title', 'category'])

  // prevents students from acessing other level's resouces
  if (user.admissionYear) {
    filter.admissionYear = user.admissionYear
  }
  if (timeline) {
    const timelineMs = timeline * 24 * 60 * 60 * 1000
    filter.createdAt = { $gte: new Date(Date.now() - timelineMs) }
  }
  const announcements = await AnnouncementSchema.find(filter)
    .sort('-createdAt')
    .select('-body -attachments')
    .skip(skip)
    .limit(queryLimit)
    .populate('createdBy', 'lastName id')
    .lean()

  if (announcements.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'No announcements found',
      data: []
    })
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucements fetched',
    data: announcements
  })
}
export const getAnnouncementById = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findById(id).populate('createdBy', 'lastName id').lean()
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement fetched',
    data: announcement
  })
}
export const updateAnnouncement = async (req, res) => {
  const { title, body, image, category, attachments } = req.body
  const { id } = req.params
  const updatedDoc = {}
  if (title) updatedDoc.title = title
  if (image) updatedDoc.image = image
  if (category) updatedDoc.category = category
  if (attachments) updatedDoc.attachments = attachments
  if (body) {
    const preview = generatePreview(body)
    updatedDoc.body = body
    updatedDoc.preview = preview
  }
  const announcement = await AnnouncementSchema.findByIdAndUpdate(id, updatedDoc, {
    new: true,
    runValidators: true
  }).populate('createdBy', 'lastName id')
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')

  // Emit update events
  getIO()
    .to(`role:lecturer`)
    .to(`role:courseAdviser`)
    .to(`role:admin`)
    .to(`admissionYear:${announcement.admissionYear}`)
    .emit('updateAnnouncement', announcement)
  

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement updated',
    data: announcement
  })
}
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findByIdAndDelete(id)
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')

  // Emit delete events
  getIO()
    .to("role:admin")
    .to(`user:${announcement.createdBy._id}`)
    .emit("deleteAnnouncement", { id });

  if (announcement.admissionYear) {
    getIO().to(`admissionYear:${announcement.admissionYear}`).emit('deleteAnnouncement', { id })
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement deleted',
    data: {}
  })
}

export const archiveAnnouncement = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findById(id).populate('createdBy', 'lastName id')
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
  await announcement.archive()

  // Emit archive events (Staff only as students shouldn't see archived ones usually)
  getIO()
    .to("role:admin")
    .to(`user:${announcement.createdBy._id}`)
    .emit("updateAnnouncement", announcement);

  if (announcement.admissionYear) {
    // For students, this might mean removing it from their active view if they don't see archives
    getIO().to(`admissionYear:${announcement.admissionYear}`).emit('deleteAnnouncement', { id: announcement._id })
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement archived',
    data: announcement
  })
}

export const unarchiveAnnouncement = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findById(id).populate('createdBy', 'lastName id')
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
  await announcement.unarchive()

  // Emit unarchive events
  getIO()
    .to("role:admin")
    .to(`user:${announcement.createdBy._id}`)
    .emit("updateAnnouncement", announcement);

  if (announcement.admissionYear) {
    getIO().to(`admissionYear:${announcement.admissionYear}`).emit('newAnnouncement', announcement)
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement unarchived',
    data: announcement
  })
}
