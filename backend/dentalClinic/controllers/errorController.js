const AppError = require("../utils/appError");
const ErrorCodes = require('../utils/errorCodes');

const handleCastError = err => {
  const message = `Invalid value for ${err.path}. Please check your input.`;
  return new AppError(message, 400);
}

const handleJsonWebTokenError = () => {
  const message = 'Invalid token. Please log in again.';
  return new AppError(message, 401);
}

const handleTokenExpiredError = () => {
  const message = 'Your session has expired. Please log in again.';
  return new AppError(message, 401);
}

const handleValidationError = err => {
  const messages = Object.values(err.errors).map(el => el.message).join(' | ');
  const message = `Invalid input data. ${messages}`;
  return new AppError(message, 400);
}

const handleBodyParserFailedError = () => {
  const message = 'The request body contains invalid JSON. Please check the format and try again.';
  return new AppError(message, 400);
}

const handleBodyParserLargeError = () => {
  const message = 'The request body is too large. Please send less data and try again.';
  return new AppError(message, 413);
}

module.exports = (err, req, res, next) => {
  let error = err;
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
  if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();
  if (err.type === 'entity.parse.failed') error = handleBodyParserFailedError();
  if (err.type === 'entity.too.large') error = handleBodyParserLargeError();

  // Status Code defaults to 500
  error.statusCode = error.statusCode || 500;
  error.status = `${error.statusCode}`.startsWith('4') ? 'fail' : 'error';

  // if NODE_ENV is 'development': send status, message, the error. and stack
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      status: error.status,
      code: error.isOperational ? error.code : ErrorCodes.INTERNAL_ERROR,
      message: error.message,
      error: err,
      stack: err.stack
    })
  } else {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        code: error.code,
        message: error.message
      })
    } else {
      console.error('Error...', error);
      res.status(500).json({
        status: 'error',
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Something went wrong!'
      })
    }
  }
}

