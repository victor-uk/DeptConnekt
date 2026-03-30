import { CustomError } from '../utils/Error.js'
import { StatusCodes } from 'http-status-codes'
import { ResourceNotFoundError } from '../utils/Error.js'

// errorhandler middleware takes in 4 args
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.errorCode || StatusCodes.INTERNAL_SERVER_ERROR
  let message = err.message || 'Something went wrong'

  if (err.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST
    message = Object.values(err.errors)
      .map(item => item.message)
      .join(', ')
  }

  if (err.name === 'CastError') {
    statusCode = StatusCodes.NOT_FOUND
    message = `Resource not found with id: ${err.value}`
  }

  console.error(`ERROR [${req.method} ${req.path}]: ${message}`)

  if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR || process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  return res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  })
}

export const notFound = (req, res, next) => {
  throw new ResourceNotFoundError("Route not found")
}


