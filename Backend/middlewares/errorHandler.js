import { CustomError } from '../utils/Error.js'
import { StatusCodes } from 'http-status-codes'
import { ResourceNotFoundError } from '../utils/Error.js'

// errorhandler middleware takes in 4 args
export const errorHandler = (err, req, res, next) => {
  if (err instanceof CustomError) {
    return res
      .status(err.errorCode)
      .json({ success: false, message: err.message, stack: err.stack })
  }

  const message = err?.message || 'Something went wrong'
  console.error(err.stack)
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ success: false, message: message, stack: err.stack })
}

export const notFound = (req, res, next) => {
    throw new ResourceNotFoundError("Route not found")
}


