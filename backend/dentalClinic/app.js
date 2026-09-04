const express = require('express');

const userRoutes = require('./routes/userRoutes');

// Start express app
const app = express();

// Body parser - reads incoming JSON and converts to req.body
app.use(express.json({ limit: '10kb' }));

// ROUTES
app.use('/api/users', userRoutes);

module.exports = app;