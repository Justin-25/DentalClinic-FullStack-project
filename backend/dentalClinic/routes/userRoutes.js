const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// PUBLIC ROUTES

// Authentication
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);

// PROTECTED ROUTES
// Protect all this routes after this middleware
router.use(authController.protect);

// Authentication
router.patch('/updateMyPassword', authController.updatePassword);


module.exports = router;