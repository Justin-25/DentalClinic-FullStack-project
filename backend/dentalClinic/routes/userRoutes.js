const express = require('express');
const authController = require('../controllers/authController');
const limiter = require('../utils/limiter');

const router = express.Router();

// PUBLIC ROUTES

// Authentication
router.post('/signup', authController.signup);

router.post('/login', limiter.loginLimiter, authController.login);
router.post('/forgotPassword', limiter.forgotPasswordLimiter, authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

// PROTECTED ROUTES
// Protect all this routes after this middleware
router.use(authController.protect);

// Authentication
router.patch('/updateMyPassword', authController.updatePassword);


module.exports = router;