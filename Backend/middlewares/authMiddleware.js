import {
  BadRequestError,
  PermissionDeniedError,
  ResourceNotFoundError
} from '../utils/Error.js'
import jwt from 'jsonwebtoken'
import AnnouncementSchema from '../models/AnnouncementSchema.js'
import AssignmentSchema from '../models/AssignmentSchema.js'
import EventSchema from '../models/EventSchema.js'
import TimetableSchema from '../models/TimetableSchema.js'
import { getUser } from '../helpers/getUser.js'

export const resourceModel = {
  announcement: AnnouncementSchema,
  assignment: AssignmentSchema,
  event: EventSchema,
  timetable: TimetableSchema
}

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
    req.user = jwt.verify(token, process.env.JWT_SECRET)
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

export const verifyApprovedUser = async (req, res, next) => {
  const { id, role } = req.user
  const user = await getUser(role, id)
  if (!user) throw new ResourceNotFoundError('User not found')
  if (user.status !== 'approved') throw new PermissionDeniedError('Access denied. Your account has not been approved yet')
  return next()
}
