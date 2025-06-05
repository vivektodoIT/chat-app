// routes/messages.js
const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router();

/**
 * @route   POST /messages/send
 * @desc    Send a new message
 * @access  Public
 */
router.post('/send', messageController.sendMessage);

/**
 * @route   GET /messages
 * @desc    Get all messages (admin view)
 * @access  Public
 */
router.get('/', messageController.getAllMessages);

/**
 * @route   GET /messages/:userKey
 * @desc    Get messages for a specific user
 * @access  Public
 */
router.get('/:userKey', messageController.getMessages);

/**
 * @route   GET /messages/:userKey/summary
 * @desc    Get conversation summary for a user
 * @access  Public
 */
router.get('/:userKey/summary', messageController.getConversationSummary);

/**
 * @route   DELETE /messages/:messageId
 * @desc    Delete a specific message (future feature)
 * @access  Admin
 */
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;