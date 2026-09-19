const ErrorCodes = require('./errorCodes');
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code || ErrorCodes.UNSPECIFIED_ERROR;
    this.isOperational = true;
  }
}

module.exports = AppError;