const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protected Routes
router.use(authController.protect);

// Public Routes
router.get('/myAppointments', appointmentController.getMyAppointments);
router.get('/:id', appointmentController.getAppointment);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

// Patient Only
// Create Appointment
router.post('/', authController.restrictTo('patient'), appointmentController.createAppointment);

// Admin Only
// Get All Appointments
router.get('/', authController.restrictTo('admin'), appointmentController.getAllAppointments);

module.exports = router;