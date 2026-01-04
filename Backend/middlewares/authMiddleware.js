import joi from 'joi'
import { checkYearIsValid } from '../helpers/checkValidYear.js'
import {
  BadRequestError,
  PermissionDeniedError,
  ResourceNotFoundError
} from '../utils/Error.js'
import jwt from 'jsonwebtoken'
import AnnouncementSchema from '../models/AnnouncementSchema.js'
import { validateUrl } from '../helpers/urlValidator.js'
import AssignmentSchema from '../models/AssignmentSchema.js'
import EventSchema from '../models/EventSchema.js'
import TimetableSchema from '../models/TimetableSchema.js'
export const resourceModel = {
  announcement: AnnouncementSchema,
  assignment: AssignmentSchema,
  event: EventSchema,
  timetable: TimetableSchema
}

/**
 * *********************************************
 * Authentication Middleware
 * *********************************************
 */
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

export const resetPasswordSchema = loginSchema
  .fork(
    ['password'], // fields to modify
    field => field.optional()
  )
  .keys({
    role: joi.string().optional()
  })

export const verifyOtpSchema = joi.object({
  otp: joi.string().alphanum().length(6).required()
})

export const changePasswordSchema = joi.object({
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,20}$')).required()
})

/**
 * *********************************************
 * User Middleware
 * *********************************************
 */
export const updateMeSchema = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .optional(),
  profileImg: joi
    .string()
    .optional()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
      return value
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
  year: joi.number().integer().optional().min(2000), // Custom year validation (e.g., checkYearIsValid) would be applied in the controller or Mongoose model
  status: joi.string().valid('pending', 'approved', 'rejected').optional()
})

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
  admissionYear: joi.number().integer().optional().min(2000),
  role: joi.string().valid('student', 'studentAdmin').optional(),
  adviser: joi.string().trim().optional(), // Assuming student role is fixed to 'student'
  status: joi.string().valid('pending', 'approved', 'rejected').optional()
})

/**
 * *********************************************
 * Announcement Middleware
 * *********************************************
 */
export const announcementSchema = joi.object({
  title: joi.string().trim().required().min(3).max(150),
  body: joi.string().trim().required().min(3).max(500),
  preview: joi.string().trim().required().min(3).max(150),
  category: joi
    .string()
    .valid('general', 'academic', 'event', 'alert', 'other')
    .required(),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
    })
    .optional(),
  admissionYear: joi
    .array()
    .items(
      joi.number().integer().custom((value, helpers) => {
        if (!checkYearIsValid(value)) {
          return helpers.message(`Admission year ${value} is not valid`)
        }
        return value
      })
    )
    .required(),
  attachments: joi
    .array()
    .items(
      joi.object({
        fileName: joi.string().required(),
        fileUrl: joi
          .string()
          .custom((value, helpers) => {
            if (!validateUrl(value)) {
              return helpers.message('Invalid attachment URL')
            }
            return value
          })
          .required(),
        fileType: joi.string(),
        size: joi.number()
      })
    )
    .optional()
})

export const updateAnnouncementSchema = joi.object({
  title: joi.string().trim().min(3).max(150),
  body: joi.string().trim().min(3).max(500),
  category: joi
    .string()
    .valid('general', 'academic', 'event', 'alert', 'other'),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
    })
    .optional(),
  attachments: joi
    .array()
    .items(
      joi.object({
        fileName: joi.string().required(),
        fileUrl: joi
          .string()
          .custom((value, helpers) => {
            if (!validateUrl(value)) {
              return helpers.message('Invalid attachment URL')
            }
            return value
          })
          .required(),
        fileType: joi.string(),
        size: joi.number()
      })
    )
    .optional()
})

/**
 * *********************************************
 * Assignment Middleware
 * *********************************************
 */
export const createAssignmentSchema = joi.object({
  title: joi.string().trim().required().min(3).max(150),
  description: joi.string().trim().required().min(10),
  deadline: joi.date().iso().required(),
  admissionYear: joi.array().items(joi.number().min(2000)).required(),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
      return value
    })
    .optional(),
  attachments: joi
    .array()
    .items(
      joi.object({
        fileName: joi.string().required(),
        fileUrl: joi
          .string()
          .custom((value, helpers) => {
            if (!validateUrl(value)) {
              return helpers.message('Invalid attachment URL')
            }
            return value
          })
          .required(),
        fileType: joi.string(),
        size: joi.number()
      })
    )
    .optional()
})

export const updateAssignmentSchema = joi.object({
  title: joi.string().trim().min(3).max(150).optional(),
  description: joi.string().trim().min(10).optional(),
  deadline: joi.date().iso().optional(),
  admissionYear: joi.array().items(joi.number().min(2000)).optional(),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
      return value
    })
    .optional()
})

/**
 * *********************************************
 * Event Middleware
 * *********************************************
 */
export const createEventSchema = joi.object({
  title: joi.string().trim().required().min(3).max(150),
  description: joi.string().trim().required().min(10),
  preview: joi.string().trim().required().min(3).max(150),
  eventDate: joi.date().iso().required(),
  location: joi.string().trim().optional(),
  admissionYear: joi.array().items(joi.number().min(2000)).optional(),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
      return value
    })
    .optional(),
  attachments: joi
    .array()
    .items(
      joi.object({
        fileName: joi.string().required(),
        fileUrl: joi
          .string()
          .custom((value, helpers) => {
            if (!validateUrl(value)) {
              return helpers.message('Invalid attachment URL')
            }
            return value
          })
          .required(),
        fileType: joi.string(),
        size: joi.number()
      })
    )
    .optional()
})

export const updateEventSchema = joi.object({
  title: joi.string().trim().min(3).max(150).optional(),
  description: joi.string().trim().min(10).optional(),
  eventDate: joi.date().iso().optional(),
  location: joi.string().trim().optional(),
  admissionYear: joi.array().items(joi.number().min(2000)).optional(),
  image: joi
    .string()
    .custom((value, helpers) => {
      if (!validateUrl(value)) {
        return helpers.message('Invalid image URL')
      }
      return value
    })
    .optional()
})
/**
 * *********************************************
 * Timetable Middleware
 * *********************************************
 */
export const createTimetableSchema = joi.object({
  admissionYear: joi.number().integer().min(2000).required(),
  semester: joi.string().valid('First', 'Second').required(),
  level: joi.number().integer().min(100).max(500).required()
})

export const updateTimetableSchema = joi.object({
  admissionYear: joi.number().integer().min(2000).optional(),
  semester: joi.string().valid('First', 'Second').optional(),
  level: joi.number().integer().min(100).max(500).optional()
})

export const addClassSchema = joi
  .object({
    day: joi
      .string()
      .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
      .required(),
    classData: joi
      .object({
        courseCode: joi.string().required(),
        courseTitle: joi.string().required(),
        venue: joi.string().required(),
        startTime: joi.string().required(),
        endTime: joi.string().required()
      })
      .required()
  })
  .custom((obj, helpers) => {
    if (obj.startTime >= obj.endTime) {
      return helpers.message('endTime must be after startTime')
    }
    return obj
  })
/**
 * *********************************************
 * Token Middleware
 * *********************************************
 */
export const verifyToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Authorization header required' })
    }
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Token required' })
    }
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

/**
 * *********************************************
 * Input Validation Middleware
 * *********************************************
 */
export const validateInput = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      console.log(error);
      throw new BadRequestError(error)
    }

    next()
  }
}

/**
 * *********************************************
 * Authorization Middleware
 * *********************************************
 */
export const authoriseRoles = ({
  resourceName = '',
  own = false,
  roles = []
}) => {
  return async (req, res, next) => {
    const { role, id } = req.user

    if (own) {
      const resource = await resourceModel[resourceName].findById(req.params.id)
      if (!resource) throw new ResourceNotFoundError('Resource not found')
      if (resource.createdBy.toString() !== id && !roles.includes(role)) {
        throw new PermissionDeniedError('Access denied')
      }
      return next()
    }
    if (!roles.includes(role)) throw new PermissionDeniedError('Access denied')
    return next()
  }
}
