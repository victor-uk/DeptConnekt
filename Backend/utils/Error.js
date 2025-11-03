class CustomError extends Error {
  
    constructor (message, errorCode) {
      super(message)
      this.errorCode = errorCode
      Object.setPrototypeOf(this, new.target.prototype)
  
      // capture stack trace so it points to *where* you threw the error
      Error.captureStackTrace(this, this.constructor)
    }
  }
  
  class AlreadyExistsError extends CustomError {
    constructor (message) {
      super(message, 409)
    }
  }
  
  class BadRequestError extends CustomError {
    constructor (message) {
      super(message, 400)
    }
  }
  
  class PermissionDeniedError extends CustomError {
    constructor (message) {
      super(message, 403)
    }
  }
  
  class ResourceNotFoundError extends CustomError {
    constructor (message) {
      super(message, 404)
    }
  }
  
  class InternalServerError extends CustomError {
    constructor (message) {
      super(message, 500)
    }
  }
  
  export {
    CustomError,
    AlreadyExistsError,
    BadRequestError,
    PermissionDeniedError,
    ResourceNotFoundError,
    InternalServerError
  }
  