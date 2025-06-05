// controllers/messageController.js
const messageService = require('../services/messageService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

class MessageController {
  // Send a new message
  async sendMessage(req, res) {
    try {
      const { userKey, text, sender, imageBase64 } = req.body;
      
      logger.info('Send message request received', { 
        userKey, 
        sender: sender || 'user',
        hasText: !!text,
        hasImage: !!imageBase64
      });

      const result = await messageService.sendMessage({
        userKey,
        text,
        sender: sender || 'user',
        imageBase64
      });

      if (result.success) {
        // Broadcast message via Socket.IO
        socketService.broadcastMessage(userKey, result.messageData);
        
        logger.success('Message sent successfully', { 
          userKey, 
          messageId: result.messageId 
        });
        
        res.status(200).json({ 
          success: true,
          message: 'Message sent successfully!',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to send message' 
        });
      }
    } catch (error) {
      logger.error('Error in sendMessage controller', { 
        userKey: req.body.userKey, 
        error: error.message 
      });
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get messages for a specific user
  async getMessages(req, res) {
    try {
      const { userKey } = req.params;
      
      logger.info('Get messages request', { userKey });

      const messages = await messageService.getMessages(userKey);
      
      logger.success('Messages retrieved successfully', { 
        userKey, 
        count: messages.length 
      });
      
      res.status(200).json(messages);
    } catch (error) {
      logger.error('Error in getMessages controller', { 
        userKey: req.params.userKey, 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get all messages (admin view)
  async getAllMessages(req, res) {
    try {
      logger.info('Get all messages request');

      const messages = await messageService.getAllMessages();
      
      logger.success('All messages retrieved successfully', { 
        count: messages.length 
      });
      
      res.status(200).json(messages);
    } catch (error) {
      logger.error('Error in getAllMessages controller', { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: 'Failed to load messages' 
      });
    }
  }

  // Get conversation summary for a user
  async getConversationSummary(req, res) {
    try {
      const { userKey } = req.params;
      
      logger.info('Get conversation summary request', { userKey });

      const summary = await messageService.getConversationSummary(userKey);
      
      logger.success('Conversation summary retrieved', { 
        userKey,
        totalMessages: summary.totalMessages
      });
      
      res.status(200).json(summary);
    } catch (error) {
      logger.error('Error in getConversationSummary controller', { 
        userKey: req.params.userKey, 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Delete a message (future feature)
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      
      // This would be implemented when you add message deletion feature
      logger.info('Delete message request', { messageId });
      
      res.status(501).json({ 
        success: false,
        error: 'Message deletion not implemented yet' 
      });
    } catch (error) {
      logger.error('Error in deleteMessage controller', { 
        messageId: req.params.messageId, 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = new MessageController();