const express = require('express');
const helmet = require('helmet');
const limiter = require('./utils/limiter');

const userRoutes = require('./routes/userRoutes');

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

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;