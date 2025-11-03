import joi from 'joi'
import { checkYearIsValid } from '../helpers/checkValidYear.js'
import { BadRequestError } from '../utils/Error.js'
import jwt from 'jsonwebtoken'

// input validation for registerLecturer
export const regLecturerSchema = joi.object({
  firstName: joi.string().min(3).max(20).required(),
  lastName: joi.string().min(3).max(20).required(),
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required(),
  repeatPassword: joi.string().valid(joi.ref('password')), // compares password and repeated password
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required(),
  lecturerID: joi.string().required()
})

// extending regLecturerSchema for registerStudent
export const regStudentSchema = regLecturerSchema.keys({
  admissionYear: joi
    .number()
    .integer()
    .custom((value, helpers) => {
      // custom validator to validate admissionYear
      if (!checkYearIsValid(value)) {
        return helpers.message(`Admission year ${value} is not valid`)
      }
      return value
    })
    .required(),
  lecturerID: joi.string().optional(),
  matricNo: joi.string().required()
})

export const loginSchema = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required(),
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required(),
  //role: joi.string().valid('lecturer', 'student').required()

})

export const resetPasswordSchema = loginSchema.keys({
  password: joi.string().optional(),
  role: joi.string().optional()
})

export const verifyOtpSchema = joi.object({
  otp: joi.string()
        .alphanum()
        .length(6)
        .required()
})

export const changePasswordSchema = joi.object({
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required()
})

export const verifyPasswordToken = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}

export const validateInput = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      throw new BadRequestError(error)
    }
    next()
  }
}
