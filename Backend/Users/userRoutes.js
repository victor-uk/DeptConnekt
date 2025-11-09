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
import parser from '../middlewares/uploadMiddleware.js'

const router = express.Router({ mergeParams: true })

router.use(verifyToken)
router.post('/upload', parser.single('image'), (req, res) => {
  res.send({
    message: 'Image uploaded successfully',
    imageUrl: req.file.path, // Cloudinary URL
    publicId: req.file.filename // Unique name in Cloudinary
  })
})
router
  .route('/me')
  .get(getMe)
  .patch(
    validateInput(updateMeSchema),
    updateMe
  )
router
  .route('/lecturers')
  .get(authoriseRoles('admin', 'courseAdviser', 'lecturer'), getAllLecturers)
router
  .route('/student')
  .get(
    authoriseRoles('admin', 'studentAdmin', 'lecturer', 'courseAdviser'),
    getStudentsByYear
  )
router
  .route('/lecturers/:id')
  .get(
    authoriseRoles(
      'admin',
      'lecturer',
      'courseAdviser',
      'studentAdmin',
      'student'
    ),
    getLecturerById
  )
  .delete(authoriseRoles('admin'), deleteLecturer)
  .put(
    authoriseRoles('admin'),
    validateInput(lecturerUpdateSchema),
    updateLecturer
  )
router
  .route('/students/:id')
  .get(
    authoriseRoles('admin', 'studentAdmin', 'lecturer', 'courseAdviser'),
    getStudentById
  )
  .delete(authoriseRoles('admin'), deleteStudent)
  .put(
    authoriseRoles('admin'),
    validateInput(studentUpdateSchema),
    updateStudent
  )

export default router
