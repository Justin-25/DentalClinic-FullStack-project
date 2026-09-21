const express = require('express');
const helmet = require('helmet');

const limiter = require('./utils/limiter');
const userRoutes = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const ErrorCodes = require('./utils/errorCodes');

// Start express app
const app = express();

// injects security headers into every response
app.use(helmet());

// Global Limiter
app.use('/api', limiter.globalLimiter);

// Body parser - reads incoming JSON and converts to req.body
app.use(express.json({ limit: '10kb' }));

// ROUTES
app.use('/api/users', userRoutes);

// 404 route
app.use((req, res, next) => {
  next(new AppError(`Url not found ${req.originalUrl}...`, 404, ErrorCodes.ROUTE_NOT_FOUND));
});

// Global Error Handler
app.use((err, req, res, next) => {
  errorController(err, req, res, next);
});

module.exports = app;