// routes/pages.js
const express = require('express');
const systemController = require('../controllers/systemController');

const router = express.Router();

/**
 * @route   GET /
 * @desc    Serve landing/login page
 * @access  Public
 */
router.get('/', systemController.serveLandingPage);

/**
 * @route   GET /admin
 * @desc    Serve admin panel page
 * @access  Public
 */
router.get('/admin', systemController.serveAdminPage);

/**
 * @route   GET /user
 * @desc    Serve user chat page
 * @access  Public
 */
router.get('/user', systemController.serveUserPage);

module.exports = router;