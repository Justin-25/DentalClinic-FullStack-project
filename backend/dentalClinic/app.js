const express = require('express');

const userRoutes = require('./routes/userRoutes');

// Start express app
const app = express();

// ROUTES

app.use('/api/users', userRoutes);

module.exports = app;