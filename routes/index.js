// routes/index.js
const express = require('express');

// Import all route modules
const authRoutes = require('./auth');
const messageRoutes = require('./messages');
const userRoutes = require('./users');
const systemRoutes = require('./system');
const pageRoutes = require('./pages');

// Import controllers for legacy routes
const authController = require('../controllers/authController');
const messageController = require('../controllers/messageController');
const userController = require('../controllers/userController');
const systemController = require('../controllers/systemController');

const router = express.Router();

// ===== PAGE ROUTES =====
router.use('/', pageRoutes);

// ===== API ROUTES =====

// Authentication routes
router.use('/auth', authRoutes);

// Message routes (both /messages and /send for backward compatibility)
router.use('/messages', messageRoutes);

// User routes
router.use('/users', userRoutes);

// System routes
router.use('/', systemRoutes);

// ===== LEGACY ROUTES FOR BACKWARD COMPATIBILITY =====

/**
 * Legacy routes to maintain compatibility with existing frontend
 */

// Legacy login route (POST /login instead of POST /auth/login)
router.post('/login', authController.login);

// Legacy send route (POST /send instead of POST /messages/send)
router.post('/send', messageController.sendMessage);

// Legacy validate-email route (POST /validate-email instead of POST /users/validate-email)
router.post('/validate-email', userController.validateEmail);

// ===== ERROR HANDLING =====

// 404 handler for unmatched routes
router.use('*', systemController.notFound);

module.exports = router;