const express = require('express');

const userRoutes = require('./routes/userRoutes');

// Start express app
const app = express();

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