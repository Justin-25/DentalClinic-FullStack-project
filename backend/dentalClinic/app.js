const express = require('express');
const helmet = require('helmet');
const path = require('path');

const limiter = require('./utils/limiter');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const ErrorCodes = require('./utils/errorCodes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const authController = require('./controllers/authController');

// Start express app
const app = express();

// In production the app sits behind proxies: Render's own, plus Vercel's when the site is
// opened through Vercel. TRUST_PROXY is how many of them to trust, so the rate limiters
// count each visitor's own IP instead of a proxy's (all visitors would share one limit).
if (process.env.NODE_ENV === 'production') app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

// injects security headers into every response; blob: lets the pages preview a photo
// before it's uploaded (profile and service images)
app.use(helmet({
  contentSecurityPolicy: {
    directives: { 'img-src': ["'self'", 'data:', 'blob:'] }
  }
}));

// Global Limiter
app.use('/img', express.static(path.join(__dirname, 'public', 'img')))
app.use('/api', limiter.globalLimiter);

// Body parser - reads incoming JSON and converts to req.body
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});

// ROUTES
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);

// TEMPORARY, admin only: shows how a request reached the server (the caller's own IP as
// each proxy reported it), to set TRUST_PROXY correctly behind Render and Vercel.
// Header values are shown only for the forwarding headers below; other headers by name only.
const FORWARDING_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip',
  'x-vercel-forwarded-for', 'x-vercel-id', 'forwarded', 'x-forwarded-proto', 'x-forwarded-host', 'via'];
app.get('/api/debug/forwarding', authController.protect, authController.restrictTo('admin'), (req, res) => {
  res.json({
    ip: req.ip,
    ips: req.ips,
    socket: req.socket.remoteAddress,
    trustProxy: app.get('trust proxy'),
    forwarding: Object.fromEntries(FORWARDING_HEADERS.filter((h) => req.headers[h]).map((h) => [h, req.headers[h]])),
    headerNames: Object.keys(req.headers)
  });
});

// In production this server also serves the built React app (frontend/dist), so the
// whole site is one service on one URL and the API needs no CORS.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  // Vite puts a hash in these file names, so browsers may keep them for a long time
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(clientDist));
  // any other page address (e.g. /admin/users) is a React Router page: send the app
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/img')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 route
app.use((req, res, next) => {
  next(new AppError(`Url not found ${req.originalUrl}...`, 404, ErrorCodes.ROUTE_NOT_FOUND));
});

// Global Error Handler
app.use((err, req, res, next) => {
  errorController(err, req, res, next);
});

module.exports = app;