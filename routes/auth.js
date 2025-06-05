// routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /auth/logout  
 * @desc    User logout
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /auth/check
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/check', authController.checkAuth);

module.exports = router;