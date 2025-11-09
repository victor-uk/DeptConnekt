import { StatusCodes } from 'http-status-codes'
import { BadRequestError, PermissionDeniedError } from '../utils/Error.js'
import { generateJwt } from '../utils/generateJwt.js'
import StudentSchema from '../models/StudentSchema.js'
import LecturerSchema from '../models/LecturerSchema.js'
import { emailConfirmationHelper } from '../helpers/sendEmail.js'
import TokenSchema from '../models/TokenSchema.js'
import jwt from 'jsonwebtoken'
// import { getRandomBetween } from '../utils/generateRandMilli.js'
// import { sleep } from '../helpers/sleep.js'

/**
 * @desc Register a new lecturer
 * @route POST /api/v1/register/lecturer
 * @access Public
 */
export const registerLecturer = async (req, res) => {
  const { firstName, lastName, email, password, lecturerID } = req.body
  const lecturerExists = await LecturerSchema.findOne({ email: email }).lean()
  if (lecturerExists) {
    // to simulate a network delay so that hackers wont be able to detect an existing email
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'Registration request received. If your email is valid, you will receive an OTP.',
      data: {}
    })
  }
  const lecturer = new LecturerSchema({
    firstName,
    lastName,
    email,
    password,
    lecturerID
  })

  await emailConfirmationHelper(lecturer.id)
  await lecturer.save()
  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: 'Registration request received. If your email is valid, you will receive an OTP.',
    data: {}
  })
}

/**
 * @desc Register a new student
 * @route POST /api/v1/register/student
 * @access Public
 */
export const registerStudent = async (req, res) => {
  const { firstName, lastName, email, password, matricNo, admissionYear } =
    req.body
  const studentExists = await StudentSchema.findOne({ email }).lean()
  if (studentExists) {
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'Registration request received. If your email is valid, you will receive an OTP.',
      data: {}
    })
  }
  const student = new StudentSchema({
    firstName,
    lastName,
    email,
    password,
    admissionYear,
    matricNo
  })
  await emailConfirmationHelper(student.id)
  await student.save()
  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: 'Registration request received. If your email is valid, you will receive an OTP.',
    data: {}
  })
}

/**
 * @desc Authenticate a user and return a JWT
 * @route POST /api/v1/login
 * @access Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body
  const { role } = req.query
  if (!role || !['lecturer', 'student'].includes(role)) {
    throw new BadRequestError('A valid role (lecturer or student) is required as a query parameter.')
  }
  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  // check whether user exists. If it does,  compare password
  const user = await schema.findOne({ email }).select('lastName password role')

  if (!user) {
    throw new PermissionDeniedError('Invalid email or password')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new BadRequestError('Invalid email or password')
  }
  const token = await generateJwt(user.id, user.role)
  res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: 'Login successful',
    data: { name: user.lastName, token }
  })
}

/**
 * @desc Initiate password reset process for a user
 * @route POST /api/v1/reset-password
 * @access Public
 */
export const resetPassword = async (req, res) => {
  const { email } = req.body
  const { role } = req.query
  if (!role || !['lecturer', 'student'].includes(role)) {
    throw new BadRequestError('A valid role (lecturer or student) is required as a query parameter.')
  }
  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  const user = await schema.findOne({ email }).lean()
  if (!user) {
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    return res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'If a user with that email exists, a password reset OTP will be sent.',
      data: {}
    })
  }
  
  await emailConfirmationHelper(user._id)
  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: 'If a user with that email exists, a password reset OTP will be sent.',
    data: {}
  })
}

/**
 * @desc Verify an OTP and return a short-lived JWT for password change
 * @route POST /api/v1/verify-otp
 * @access Public
 */
export const verifyOTP = async (req, res) => {
  // having sanitised the input by the auth middleware, we query the token collection
  // check if the token is there, if it is used and if it is for the user (to prevent another email's token from being used)
  // note user id will be gooten from req.query
  // compare the tokens
  const { otp } = req.body
  const { id } = req.query
  if (!id) {
    throw new BadRequestError('User ID is required as a query parameter.')
  }
  const token = await TokenSchema.findOne({ userId: id })

  if (!token || token.used === true) {
    throw new PermissionDeniedError('Token is invalid')
  }
  const isMatch = await token.compareToken(otp)
  
  if (!isMatch) {
    throw new PermissionDeniedError('Token doesn\'t match')
  }
  // Mark token as used to prevent reuse
  token.used = true;
  await token.save();

  const jwtToken = jwt.sign({id: id, tokenUser: token.userId.toString()}, process.env.JWT_SECRET, { expiresIn: '10m' })
  return res
    .status(StatusCodes.ACCEPTED)
    .json({ success: true, message: 'OTP verified successfully', data: {token: jwtToken} })
}

/**
 * @desc Change the user's password after OTP verification
 * @route POST /api/v1/change-password
 * @access Private (Requires short-lived token from OTP verification)
 */
export const changePassword = async (req, res) => {
  const { id, role } = req.query
  const { password } = req.body
  const { tokenUser } = req.user

  if (!role || !['lecturer', 'student'].includes(role)) {
    throw new BadRequestError('A valid role (lecturer or student) is required as a query parameter.')
  }
  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  
  if (id != tokenUser) {
    throw new PermissionDeniedError("Invalid token")
  }
  const user = await schema.findOne({ _id: id }).select('password')
  user.password = password
  await user.save()
  return res.status(StatusCodes.OK).json({success: true, message: "Password has been reset successfully", data: {}})
}
