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

// Start express app
const app = express();

// On Render the app sits behind a proxy: trust its X-Forwarded-For header so the rate
// limiters count each visitor's own IP instead of the proxy's.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

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