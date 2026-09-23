const express = require('express');
const limiter = require('../utils/limiter');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

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

// User Side
router.get('/myAccount', userController.myAccount);
router.patch('/myAccount', userController.updateMyAccount);
router.delete('/myAccount', userController.deleteMyAccount);

// Admin Side
router.use(authController.restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUser);
router.patch('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;