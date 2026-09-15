const { rateLimit } = require('express-rate-limit');
const AppError = require('./appError');

const rateLimitHandler = (req, res, next, options) => {
  next(new AppError('Too many requests, Please try again later...', options.statusCode));
};

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: rateLimitHandler
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: true,
  ipv6Subnet: 56,
  handler: rateLimitHandler
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: true,
  ipv6Subnet: 56,
  handler: rateLimitHandler
});

module.exports = ({ globalLimiter, loginLimiter, forgotPasswordLimiter });