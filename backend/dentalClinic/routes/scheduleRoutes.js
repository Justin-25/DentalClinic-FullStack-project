const express = require('express');
const authController = require('../controllers/authController');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

// Public Routes
// patients need this to see availability when booking
router.get('/:doctorId', scheduleController.getDoctorSchedule)

// Protected Routes
router.use(authController.protect);

// Doctor Side Only
router.use(authController.restrictTo('doctor'));

// Doctor Routes
router.patch('/mySchedule', scheduleController.updateMySchedule)

module.exports = router;