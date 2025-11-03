import { Router } from "express";
import { changePassword, login, registerLecturer, registerStudent, resetPassword, verifyOTP } from "./authController.js";
import { changePasswordSchema, loginSchema, regLecturerSchema, regStudentSchema, resetPasswordSchema, validateInput, verifyOtpSchema, verifyPasswordToken } from "../middlewares/authMiddleware.js";

const router = Router()

router.post('/register/lecturer', validateInput(regLecturerSchema), registerLecturer)
router.post('/register/student', validateInput(regStudentSchema), registerStudent)
router.post('/login', validateInput(loginSchema), login)
router.post('/reset-password', validateInput(resetPasswordSchema), resetPassword)
router.post('/verify-otp', validateInput(verifyOtpSchema), verifyOTP)
router.post('/change-password', validateInput(changePasswordSchema), verifyPasswordToken, changePassword)

export default router

