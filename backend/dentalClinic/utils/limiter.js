const { rateLimit } = require('express-rate-limit');
const AppError = require('./appError');

const rateLimitHandler = (req, res, next, options) => {
  next(new AppError('Too many requests, Please try again later...', options.statusCode));
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2400,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 5,
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 3,
  standardHeaders: false,
  legacyHeaders: false,
  handler: rateLimitHandler
});

module.exports = ({ globalLimiter, loginLimiter, forgotPasswordLimiter });