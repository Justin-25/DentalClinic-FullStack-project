const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protected Routes
router.use(authController.protect);

// Patient Only
router.use(authController.restrictTo('patient'))

// Appointment
router.post('/', appointmentController.createAppointment);

module.exports = router;