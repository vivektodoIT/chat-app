// routes/users.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @route   GET /users
 * @desc    Get all users (simple list for backward compatibility)
 * @access  Public
 */
router.get('/', userController.getUsers);

/**
 * @route   GET /users/conversations
 * @desc    Get users with conversation information
 * @access  Public
 */
router.get('/conversations', userController.getUsersWithConversations);

/**
 * @route   GET /users/connected
 * @desc    Get currently connected users
 * @access  Public
 */
router.get('/connected', userController.getConnectedUsers);

/**
 * @route   POST /users/validate-email
 * @desc    Validate and sanitize email address
 * @access  Public
 */
router.post('/validate-email', userController.validateEmail);

/**
 * @route   GET /users/:userKey/info
 * @desc    Get detailed information about a specific user
 * @access  Public
 */
router.get('/:userKey/info', userController.getUserInfo);

/**
 * @route   GET /users/:userKey/exists
 * @desc    Check if user exists
 * @access  Public
 */
router.get('/:userKey/exists', userController.checkUserExists);

module.exports = router;