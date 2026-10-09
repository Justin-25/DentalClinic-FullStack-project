const express = require('express');
const authController = require('../controllers/authController');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

// Public Routes

// Doctor Schedule AND Availability
router.get('/:doctorId', scheduleController.getDoctorSchedule)
router.get('/:doctorId/availability', scheduleController.getAvailability);

// Protected Routes
router.use(authController.protect);

// Doctor Side Only
router.use(authController.restrictTo('doctor'));

// Doctor Routes
router.patch('/mySchedule', scheduleController.updateMySchedule)

module.exports = router;