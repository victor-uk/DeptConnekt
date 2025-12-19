import { StatusCodes } from 'http-status-codes'
import TimetableSchema from '../models/TimetableSchema.js'
import paginator from '../helpers/paginator.js'
import { BadRequestError, PermissionDeniedError, ResourceNotFoundError } from '../utils/Error.js'
import { getUser } from '../helpers/getUser.js'

export const createTimetable = async (req, res) => {
  const { admissionYear, semester, level } = req.body
  const { id: userId } = req.user
  
  // The model for a student creating a timetable should be 'Student'
  const timetable = await TimetableSchema.create({
    admissionYear,
    semester,
    level,
    createdBy: userId,
    createdByModel: 'Lecturer'
  })
  res
    .status(StatusCodes.CREATED)
    .json({
      success: true,
      message: 'Timetable created successfully',
      data: timetable
    })
}

export const getTimetables = async (req, res) => {
  const { admissionYear, semester, level, page, limit, archived } = req.query
  const { skip, queryLimit } = paginator(page, limit)
  const { role, id: userId } = req.user
  const user = await getUser(role, userId)
  const filter = {}

  if (admissionYear) filter.admissionYear = admissionYear
  if (semester) filter.semester = semester
  if (level) filter.level = level
  filter.archived = archived === 'true' ? true : false
  if (user?.admissionYear) {  // Add optional chaining
    filter.admissionYear = user.admissionYear 
  }

  const timetables = await TimetableSchema.find(filter)
    .limit(queryLimit)
    .skip(skip)
    .sort({ createdAt: -1 })
    .lean()

  if (timetables.length === 0)
    return res
      .status(StatusCodes.OK)
      .json({ success: false, message: 'No timetables found', data: [] })

  res
    .status(StatusCodes.OK)
    .json({
      success: true,
      message: 'Timetables fetched successfully',
      data: timetables
    })
}

export const getTimetableById = async (req, res) => {
  const { id } = req.params
  const timetable = await TimetableSchema.findById(id).lean()
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Timetable fetched successfully',
    data: timetable
  })
}

export const updateTimetable = async (req, res) => {
  const { id } = req.params
  const { admissionYear, semester, level } = req.body
  const updatedDoc = {}

  if (admissionYear) updatedDoc.admissionYear = admissionYear
  if (semester) updatedDoc.semester = semester
  if (level) updatedDoc.level = level

  const timetable = await TimetableSchema.findByIdAndUpdate(id, updatedDoc, {
    new: true,
    runValidators: true
  }).lean()
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Timetable updated successfully',
    data: timetable
  })
}

export const deleteTimetable = async (req, res) => {
  const { id } = req.params
  const timetable = await TimetableSchema.findByIdAndDelete(id)
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Timetable deleted successfully',
    data: {}
  })
}

export const addClass = async (req, res) => {
  const { id } = req.params
  const { id: lecturerId } = req.user // Correctly get the ID from the token payload
  if (!lecturerId) throw new BadRequestError('Lecturer ID is required')

  let timetable = await TimetableSchema.findById(id)
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')

  timetable = await timetable.addClassToDay(req.body.day, {
    ...req.body.classData,
    lecturer: lecturerId
  })

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Class added to timetable successfully',
    data: timetable
  })
}

export const deleteClass = async (req, res) => {
  const { id } = req.params
  const { dayName, courseCode } = req.query
  if (!dayName || !courseCode) throw new BadRequestError("Day and course code is required")
  const timetable = await TimetableSchema.findById(id)
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')

  const classToDelete = await timetable.removeClassFromDay(dayName, courseCode)
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Class removed from timetable successfully',
    data: classToDelete
  })
}

export const archiveTimetable = async (req, res) => {
  const { id } = req.params
  const timetable = await TimetableSchema.findById(id)
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')
  await timetable.archive()
  res
    .status(StatusCodes.OK)
    .json({ success: true, message: 'Timetable archived', data: timetable })
}

export const unarchiveTimetable = async (req, res) => {
  const { id } = req.params
  const timetable = await TimetableSchema.findById(id)
  if (!timetable) throw new ResourceNotFoundError('Timetable not found')
  await timetable.unarchive()
  res.status(StatusCodes.OK).json({ success: true, message: 'Timetable unarchived', data: timetable })
}
