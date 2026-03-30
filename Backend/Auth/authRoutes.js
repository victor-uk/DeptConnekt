import { Router } from 'express'
import {
  changePassword,
  login,
  registerLecturer,
  registerStudent,
  resetPassword,
  verifyOTP
} from './authController.js'
import {
  changePasswordSchema,
  loginSchema,
  regLecturerSchema,
  regStudentSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../middlewares/schemaValidation.js'
import {
  verifyToken,
  validateInput,
} from '../middlewares/authMiddleware.js'

const router = Router()

/**
 * @swagger
 * /api/v1/auth/register/lecturer:
 *   post:
 *     summary: Register a new lecturer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - lecturerID
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               lecturerID:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lecturer registered successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/register/lecturer',
  validateInput(regLecturerSchema),
  registerLecturer
)

/**
 * @swagger
 * /api/v1/auth/register/student:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - matricNo
 *               - admissionYear
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               matricNo:
 *                 type: string
 *               admissionYear:
 *                 type: number
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/register/student',
  validateInput(regStudentSchema),
  registerStudent
)

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lecturer, student]
 *         description: Role of the user logging in
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', validateInput(loginSchema), login)

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lecturer, student]
 *         description: Role of the user requesting reset
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post(
  '/reset-password',
  validateInput(resetPasswordSchema),
  resetPassword
)

/**
 * @swagger
 * /api/v1/auth/verify-otp/{id}:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid OTP
 */
router.post('/verify-otp/:id', validateInput(verifyOtpSchema), verifyOTP)

/**
 * @swagger
 * /api/v1/auth/change-password/{id}:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lecturer, student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/change-password/:id',
  validateInput(changePasswordSchema),
  verifyToken,
  changePassword
)

export default router
