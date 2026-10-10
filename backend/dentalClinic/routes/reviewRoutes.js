const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Public Routes
router.get('/', reviewController.getAllReviews);
router.get('/mine', authController.protect, authController.restrictTo('patient'), reviewController.getMyReviews);
router.get('/:id', reviewController.getReview);

// Protected Routes
router.use(authController.protect);

router.post('/', authController.restrictTo('patient'), reviewController.createReview);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;