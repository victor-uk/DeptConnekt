import { StatusCodes } from 'http-status-codes'
import AnnouncementSchema from '../models/AnnouncementSchema.js'
import { generatePreview } from '../helpers/generatePreview.js'
import paginator from '../helpers/paginator.js'
import { ResourceNotFoundError } from '../utils/Error.js'

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
    onModel: userModel // createdBy refs onModel through ref path
  })
  announcement = await AnnouncementSchema.findById(announcement._id).populate('createdBy', 'fullName _id')
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
  const { title, createdBy, category, admissionYear, timeline, page, limit } = req.query
  const { skip, queryLimit } = paginator(page, limit)
  const filter = {}
  if (title) {
    filter.title = { $regex: title, $options: 'i' }
  }
  if (createdBy) {
    filter.createdBy = createdBy
  }
  if (category) {
    filter.category = category
  }
  if (admissionYear) filter.admissionYear = admissionYear
  if (timeline) {
    const timelineMs = timeline * 24 * 60 * 60 * 1000
    filter.createdAt = { $gte: new Date(Date.now() - timelineMs) }
  }
  const announcements = await AnnouncementSchema.find(filter)
    .sort('-createdAt')
    .select('-body -attachments')
    .skip(skip)
    .limit(queryLimit)
    .populate('createdBy', 'fullName id')
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
  const announcement = await AnnouncementSchema.findById(id).populate('createdBy', 'fullName id').lean()
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
  })
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
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
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement deleted',
    data: {}
  })  
}

export const archiveAnnouncement = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findById(id)
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
  await announcement.archive()
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement archived',
    data: announcement
  })
}

export const unarchiveAnnouncement = async (req, res) => {
  const { id } = req.params
  const announcement = await AnnouncementSchema.findById(id)
  if (!announcement) throw new ResourceNotFoundError('Annoucement not found')
  await announcement.unarchive()
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Annoucement unarchived',
    data: announcement
  })
}
