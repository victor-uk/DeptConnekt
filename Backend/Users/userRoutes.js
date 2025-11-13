import express from 'express'
import {
  deleteLecturer,
  deleteStudent,
  getAllLecturers,
  getLecturerById,
  getMe,
  getStudentById,
  getStudentsByYear,
  updateLecturer,
  updateMe,
  updateStudent
} from './userController.js'
import {
  authoriseRoles,
  lecturerUpdateSchema,
  studentUpdateSchema,
  updateMeSchema,
  validateInput,
  verifyToken
} from '../middlewares/authMiddleware.js'
import { parser, attachmentParser } from '../middlewares/uploadMiddleware.js'
import LecturerSchema from '../models/LecturerSchema.js'
import { StatusCodes } from 'http-status-codes'
import StudentSchema from '../models/StudentSchema.js'
import { PermissionDeniedError } from '../utils/Error.js'

const router = express.Router({ mergeParams: true })

// verifying jwt
router.use(verifyToken)

// the parser.single('image') is used to parse the image file from the request
// the image is uploaded to cloudinary and the url is returned
// the image is saved in the database and the url is returned
router.post('/upload', parser.single('image'), (req, res) => {
  res.send({
    message: 'Image uploaded successfully',
    imageUrl: req.file.path, // Cloudinary URL
    publicId: req.file.filename // Unique name in Cloudinary
  })
})

// the attachmentParser.single('attachment') is used to parse the attachment file from the request
// the attachment is uploaded to cloudinary and the url is returned
// the attachment is saved in the database and the url is returned
router.post('/attachments/upload', attachmentParser.array('attachments', 3), (req, res) => {
  res.send({
    success: true,
    message: 'Attachment uploaded successfully',
      attachments: req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      fileName: file.originalname
    }))
  })
})

router.patch('/lecturers/approve/:id', authoriseRoles({ roles: ['admin'] }), async (req, res) => {
  const { id } = req.params
  const lecturer = await LecturerSchema.findById(id).select('status')
  if (!lecturer) {
    return res.status(404).json({ message: 'Lecturer not found' })
  }
  lecturer.status = 'approved'
  await lecturer.save()
  res.status(StatusCodes.OK).json({success: true, message: 'Lecturer approved successfully', data: {lecturer}})
})

router.patch('/students/approve/:id', authoriseRoles({ roles: ['courseAdviser'] }), async (req, res) => {
  const { id: studentId } = req.params
  const { id } = req.user
  const student = await StudentSchema.findById(studentId).select('status admissionYear adviser')
  const lecturer = await LecturerSchema.findById(id).select('year')
  if (!student) {
    return res.status(404).json({ success: false, message: 'Lecturer not found', data: {}})
  }
  if (student.admissionYear !== lecturer.year) throw new PermissionDeniedError('You can only approve students from your admission year')
  student.status = 'approved'
  student.adviser = lecturer._id
  await student.save()
  res.status(StatusCodes.OK).json({success: true, message: 'Student approved successfully', data: {student}})
})

router.route('/me').get(getMe).patch(validateInput(updateMeSchema), updateMe)

router
  .route('/lecturers')
  .get(authoriseRoles({ roles: ['admin', 'courseAdviser', 'lecturer'] }), getAllLecturers)

router
  .route('/students')
  .get(
    authoriseRoles({ roles: ['admin', 'studentAdmin', 'lecturer', 'courseAdviser'] }),
    getStudentsByYear
  )

router
  .route('/lecturers/:id')
  .get(
    authoriseRoles(
      { roles: ['admin', 'studentAdmin', 'lecturer', 'courseAdviser', 'student'] }
    ),
    getLecturerById
  )
  .delete(authoriseRoles({ roles: ['admin'] }), deleteLecturer)
  .put(
    authoriseRoles({ roles: ['admin'] }),// only the admin should have access to the full details
    validateInput(lecturerUpdateSchema),
    updateLecturer
  )

router
  .route('/students/:id')
  .get(
    authoriseRoles({
      roles: ['admin', 'studentAdmin', 'lecturer', 'courseAdviser']
    }),
    getStudentById
  )
  .delete(authoriseRoles({ roles: ['admin'] }), deleteStudent)
  .put(
    authoriseRoles({ roles: ['admin'] }),
    validateInput(studentUpdateSchema),
    updateStudent
  )

export default router
