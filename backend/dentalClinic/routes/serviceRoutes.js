const express = require('express');
const serviceController = require('../controllers/serviceController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Routes
// Client Side
router.get('/', serviceController.getAllServices);
router.get('/:slug', serviceController.getService);

// Protected Routes
router.use(authController.protect);

// Admin Side Only
router.use(authController.restrictTo('admin'));

router.post('/', serviceController.createService);
router.patch('/:serviceId', serviceController.updateService);
router.delete('/:serviceId', serviceController.deleteService);

module.exports = router;