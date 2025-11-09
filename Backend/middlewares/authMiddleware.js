import joi from 'joi'
import { checkYearIsValid } from '../helpers/checkValidYear.js'
import { BadRequestError, PermissionDeniedError } from '../utils/Error.js'
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
    password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required()
    //role: joi.string().valid('lecturer', 'student').required()
  })
  
  export const resetPasswordSchema = loginSchema.fork(
    ['password'], // fields to modify
    (field) => field.optional()
  ).keys({
    role: joi.string().optional(),
  })
  
  export const verifyOtpSchema = joi.object({
    otp: joi.string().alphanum().length(6).required()
  })
  
  export const changePasswordSchema = joi.object({
    password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required()
})

export const updateMeSchema = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
  image: joi
  .string()
  .optional()
  .custom((value, helpers) => {
      const allowedHosts = ['res.cloudinary.com', 'cdn.yourapp.com']
      const imageUrl = new URL(value)
      if (!allowedHosts.includes(imageUrl.hostname) && !imageUrl.pathname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return helpers.message('Invalid image URL')
      }
    })
})

/**
 * Joi schema for validating lecturer update data by an admin.
 * All fields are optional as it's an update operation.
 */
export const lecturerUpdateSchema = joi.object({
  firstName: joi.string().trim().optional(),
  lastName: joi.string().trim().optional(),
  email: joi.string().email().lowercase().optional(),
  password: joi.string().min(6).optional(),
  lecturerID: joi.string().optional(), // Uniqueness check should be handled in the controller/service layer // Assuming profileImage is a URL
  role: joi.string().valid('lecturer', 'courseAdviser').optional(),
  year: joi.number().integer().optional(), // Custom year validation (e.g., checkYearIsValid) would be applied in the controller or Mongoose model
  status: joi.string().valid('pending', 'approved', 'rejected').optional(),
});

/**
 * Joi schema for validating student update data by an admin.
 * All fields are optional as it's an update operation.
 * Inferred fields based on StudentRegister OpenAPI schema and common user attributes.
 */
export const studentUpdateSchema = joi.object({
  firstName: joi.string().trim().optional(),
  lastName: joi.string().trim().optional(),
  email: joi.string().email().lowercase().optional(),
  password: joi.string().min(6).optional(),
  matricNo: joi.string().optional(), // Uniqueness check should be handled in the controller/service layer
  admissionYear: joi.number().integer().optional(),
  role: joi.string().valid('student', 'studentAdmin').optional(),
  adviser: joi.string().trim().optional(), // Assuming student role is fixed to 'student'
  status: joi.string().valid('pending', 'approved', 'rejected').optional(),
});

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    res.status(500).json({ message: 'Something went wrong' })
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

export const authoriseRoles = (own = false, ...roles) => {
  return (req, res, next) => {
    // check if the params includes the user role
    const { role } = req.user
    if (!roles.includes(role)) {
      throw new PermissionDeniedError('Access denied')
    }
    next()
  }
}

// let's say a lecturer tries to delete a post that he didn't make
// the system from 
