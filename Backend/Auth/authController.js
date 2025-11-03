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

export const registerLecturer = async (req, res) => {
  const { firstName, lastName, email, password, lecturerID } = req.body
  const lecturerExists = await LecturerSchema.findOne({ email: email }).lean()
  if (lecturerExists) {
    // to simulate a network delay so that hackers wont be able to detect an existing email
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'If successful, an email will be sent to you',
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
  // The purpose of this 2FA is to make sure that user enumeration doesn't happen
  // generate otp
  await emailConfirmationHelper(lecturer.id)
  await lecturer.save()
  return res.status(StatusCodes.ACCEPTED).json({
    successful: true,
    message: 'Check email for otp',
    data: {}
  })
}

export const registerStudent = async (req, res) => {
  const { firstName, lastName, email, password, matricNo, admissionYear } =
    req.body
  const studentExists = await StudentSchema.findOne({ email }).lean()
  if (studentExists) {
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'If successful, an email will be sent to you',
      data: ''
    })
  }
  const student = new StudentSchema({
    firstName,
    lastName,
    email,
    admissionYear,
    matricNo,
    password
  })
  await emailConfirmationHelper(student.id)
  await student.save()
  return res.status(StatusCodes.ACCEPTED).json({
    successful: true,
    message: 'Check email for otp',
    data: {}
  })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const { role } = req.query
  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  // check whether user exists. If it does,  compare password
  const user = await schema.findOne({ email }).select('lastName password status')

  if (!user) {
    throw new PermissionDeniedError('Invalid email or password')
  }

  if (user.status !== "approved") throw new PermissionDeniedError("Access Denied")
  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new BadRequestError('Invalid email or password')
  }
  const token = await generateJwt(user.id. user.role)
  res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: 'Login successful',
    data: { name: user.lastName, token }
  })
}

export const resetPassword = async (req, res) => {
  const { email } = req.body
  const { role } = req.query
  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  const user = await schema.findOne({ email }).lean()
  if (!user) {
    await fetch('https://httpbin.org/delay/5').then(r => r.json())
    return res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'If successful, an email will be sent to you',
      data: {}
    })
  }
  
  await emailConfirmationHelper(user._id)
  return res.status(StatusCodes.ACCEPTED).json({
    successful: true,
    message: 'Check email for otp',
    data: {}
  })
}

export const verifyOTP = async (req, res) => {
  // having sanitised the input by the auth middleware, we query the token collection
  // check if the token is there, if it is used and if it is for the user (to prevent another email's token from being used)
  // note user id will be gooten from req.query
  // compare the tokens
  const { otp } = req.body
  const { id } = req.query
  const token = await TokenSchema.findOne({ userId: id })
  console.log(token);
  
  if (!token || token.used === true) {
    throw new PermissionDeniedError('Token is invalid')
  }
  const isMatch = await token.compareToken(otp)
  
  if (!isMatch) {
    throw new PermissionDeniedError('Token doesn\'t match')
  }
  const jwtToken = jwt.sign({id: id, tokenUser: token.userId}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
  return res
    .status(StatusCodes.ACCEPTED)
    .json({ success: true, message: 'otp is verified', data: {token: jwtToken} })
}

export const changePassword = async (req, res) => {
  const { id, role } = req.query
  const { password } = req.body
  const { tokenUser } = req.user

  const schema = role === 'lecturer' ? LecturerSchema : StudentSchema
  
  if (id != tokenUser) {
    throw new PermissionDeniedError("Invalid token")
  }
  const user = await schema.findOne({ _id: id }).select('password')
  console.log(user);
  
  user.password = password
  await user.save()
  return res.status(200).json({success: true, message: "Password reset complete", data: {}})
}
