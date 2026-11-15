const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const AppError = require('./appError');
const ErrorCodes = require('./errorCodes');

// Who is this visitor? On the live site requests pass through Vercel and Cloudflare, and the
// usual X-Forwarded-For can carry an address the visitor made up. Vercel and Cloudflare each
// add their own header with the real address, so count by those, else by req.ip (local
// development). Checked live: a made-up X-Forwarded-For no longer escapes the limits anywhere.
// Known gap: a faked x-vercel-forwarded-for still can (Vercel doesn't always replace it, and
// it can be sent straight to Render). Closing that needs a secret header only Vercel sends.
const visitorIp = (req) =>
  (req.get('x-vercel-forwarded-for') || req.get('cf-connecting-ip') || req.ip).split(',')[0].trim();
const keyGenerator = (req) => ipKeyGenerator(visitorIp(req));

const rateLimitHandler = (req, res, next, options) => {
  next(new AppError('Too many requests, Please try again later...', options.statusCode, ErrorCodes.RATE_LIMITED));
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2400,
  keyGenerator,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler
});

const signUpLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 5,
  keyGenerator,
  standardHeaders: false,
  legacyHeaders: false,
  handler: rateLimitHandler
})

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 5,
  keyGenerator,
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 3,
  keyGenerator,
  standardHeaders: false,
  legacyHeaders: false,
  handler: rateLimitHandler
});

module.exports = ({ globalLimiter, signUpLimiter, loginLimiter, forgotPasswordLimiter });