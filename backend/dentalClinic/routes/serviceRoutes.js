const express = require('express');
const serviceController = require('../controllers/serviceController');
const authController = require('../controllers/authController');
const upload = require('../utils/upload');

const router = express.Router();

// Admin Side Only
router.get('/admin', authController.protect, authController.restrictTo('admin'), serviceController.getAllServicesAdmin);
router.get('/admin/:serviceId', authController.protect, authController.restrictTo('admin'), serviceController.getServiceAdmin);
router.patch('/admin/restore/:serviceId', authController.protect, authController.restrictTo('admin'), serviceController.restoreService);

// Public Routes
// Client Side
router.get('/', serviceController.getAllServices);
router.get('/:slug', serviceController.getService);

// Protected Routes
router.use(authController.protect);

// Admin Side Only
router.use(authController.restrictTo('admin'));

router.post('/', upload.uploadServiceCover, upload.resizeServiceCover, serviceController.createService);
router.patch('/:serviceId', upload.uploadServiceCover, upload.resizeServiceCover, serviceController.updateService);
router.delete('/:serviceId', serviceController.deleteService);

module.exports = router;