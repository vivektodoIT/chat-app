// routes/system.js
const express = require('express');
const systemController = require('../controllers/systemController');

const router = express.Router();

/**
 * @route   GET /status
 * @desc    Get comprehensive server status
 * @access  Public
 */
router.get('/status', systemController.getServerStatus);

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', systemController.healthCheck);

/**
 * @route   GET /api
 * @desc    API documentation and information
 * @access  Public
 */
router.get('/api', systemController.getApiInfo);

module.exports = router;