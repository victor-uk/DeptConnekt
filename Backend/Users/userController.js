import { StatusCodes } from 'http-status-codes'
import { getSchema } from '../helpers/getSchema.js'
import {
  BadRequestError,
  PermissionDeniedError,
  ResourceNotFoundError
} from '../utils/Error.js'
import LecturerSchema from '../models/LecturerSchema.js'
import StudentSchema from '../models/StudentSchema.js'
import paginator from '../helpers/paginator.js'

/**
 * @desc Get profile of the currently logged-in user
 * @route GET /api/v1/users/me
 * @access Private (Lecturer, Student)
 */
export const getMe = async (req, res) => {
  const { role, id } = req.user
  const schema = getSchema(role)
  const user = await schema
    .findOne({ _id: id })
    .lean()
  if (!user || user.status !== 'approved') {
    throw new PermissionDeniedError('Access Denied')
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile gotten',
    data: user
  })
}

/**
 * @desc Update profile of the currently logged-in user
 * @route PATCH /api/v1/users/me
 * @access Private (Lecturer, Student)
 */
export const updateMe = async (req, res) => {
  const { email, profileImg } = req.body
  const { id, role } = req.user
  const schema = getSchema(role)
  const user = await schema.findOne({ _id: id })
  if (!user || user.status !== 'approved') {
    throw new PermissionDeniedError('Access Denied')
  }
  if (email) user.email = email
  if (profileImg) user.profileImg = profileImg
  await user.save()
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  })
}

/**
 * @desc Update profile of a lecturer by admin
 * @route PULL ap1/v1/lecturer/:id
 * @access private (admin)
 */
export const updateLecturer = async (req, res) => {
  const { id: userId } = req.params
  const lecturer = await LecturerSchema.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true
  })
  if (!lecturer) throw new ResourceNotFoundError('Lecturer not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lecturer updated successfully',
    data: lecturer
  })
}

/**
 * @desc Update profile of a student by admin
 * @route PULL api/v1/student/:id
 * @access private(admin)
 */
export const updateStudent = async (req, res) => {
  const { id: userId } = req.params
  const student = await StudentSchema.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true
  })
  if (!student) throw new ResourceNotFoundError('Student not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Student updated successfully',
    data: student
  })
}

/**
 * @desc Delete a lecturer by ID
 * @route DELETE /api/v1/users/lecturer/:id
 * @access Private (Admin role)
 */
export const deleteLecturer = async (req, res) => {
  const { role } = req.user
  const { id: userId } = req.params

  const user = await LecturerSchema.deleteOne({ _id: userId })
  if (!user) throw new ResourceNotFoundError('User not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'User deleted',
    data: {}
  })
}

/**
 * @desc Delete a student by ID
 * @route DELETE /api/v1/users/student/:id
 * @access Private (Admin role)
 */
export const deleteStudent = async (req, res) => {
  const { role } = req.user
  const { id: userId } = req.params

  const user = await StudentSchema.deleteOne({ _id: userId })
  if (!user) throw new ResourceNotFoundError('User not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'User deleted',
    data: {}
  })
}

/**
 * @desc Get all lecturers with optional filtering and pagination
 * @route GET /api/v1/users/lecturer
 * @access Private (Lecturer, Admin)
 */
export const getAllLecturers = async (req, res) => {
  const { role: lecturerRole, page, limit } = req.query
  const { skip, queryLimit } = paginator(page, limit)
  const filter = {}
  if (lecturerRole === 'courseAdviser') {
    filter.role = 'courseAdviser'
  }
  const lecturers = await LecturerSchema.find(filter)
    .select('fullName createdAt')
    .sort('fullName')
    .skip(skip)
    .limit(queryLimit)
  if (lecturers.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'No lecturers found',
      data: []
    })
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lecturers gotten',
    data: lecturers
  })
}

/**
 * @desc Get a single lecturer by ID
 * @route GET /api/v1/users/lecturer/:id
 * @access Private
 */
export const getLecturerById = async (req, res) => {
  const { id } = req.params

  const lecturer = await LecturerSchema.findOne({ _id: id }).lean()
  if (!lecturer) throw new ResourceNotFoundError('Lecturer not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lecturer gotten',
    data: lecturer
  })
}

/**
 * @desc Get all students for a specific admission year
 * @route GET /api/v1/users/student
 * @access Private
 */
export const getStudentsByYear = async (req, res) => {
  const { admissionYear } = req.query
  if (!admissionYear)
    throw new BadRequestError('Admission year query parameter is required')
  const students = await StudentSchema.find({ admissionYear }).lean()
  if (students.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'No student found',
      data: []
    })
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Students gotten',
    data: students
  })
}

/**
 * @desc Get a single student by ID
 * @route GET /api/v1/users/student/:id
 * @access Private
 */
export const getStudentById = async (req, res) => {
  const { id } = req.params

  const student = await StudentSchema.findOne({ _id: id }).lean()
  if (!student) throw new ResourceNotFoundError('Student not found')
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Student gotten',
    data: student
  })
}
/**
 * @desc Placeholder for getting admin profile
 * @route GET /api/v1/users/admin (example route)
 * @access Private (Admin)
 */
export const getAdmin = (req, res) => {
  res.send('Admin profile gotten')
}
