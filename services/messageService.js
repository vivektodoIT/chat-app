// services/messageService.js
const firebaseService = require('./firebaseService');
const { isValidMessage, sanitizeInput, isValidUserKey } = require('../utils/validator');
const logger = require('../utils/logger');

class MessageService {
  // Send a message (handles both user and admin messages)
  async sendMessage({ userKey, text, sender = 'user', imageBase64 }) {
    try {
      // Validate inputs
      if (!isValidUserKey(userKey)) {
        throw new Error('Invalid or missing userKey');
      }

      const validation = isValidMessage(text, imageBase64);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Sanitize text input
      const sanitizedText = sanitizeInput(text);

      // Create message object
      const messageData = {
        text: sanitizedText || '',
        sender,
        timestamp: new Date().toISOString(),
        imageBase64: imageBase64 || ''
      };

      // Save to Firebase
      const messageRef = await firebaseService.saveMessage(userKey, messageData);

      logger.success('Message sent successfully', { 
        userKey, 
        sender, 
        messageId: messageRef.key,
        hasText: !!sanitizedText,
        hasImage: !!imageBase64
      });

      return {
        success: true,
        messageId: messageRef.key,
        messageData: {
          ...messageData,
          userKey // Include userKey for socket emission
        }
      };
    } catch (error) {
      logger.error('Failed to send message', { 
        userKey, 
        sender, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get messages for a specific user
  async getMessages(userKey) {
    try {
      if (!isValidUserKey(userKey)) {
        throw new Error('Invalid or missing userKey');
      }

      return await firebaseService.getMessages(userKey);
    } catch (error) {
      logger.error('Failed to get messages', { 
        userKey, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get all messages (admin view)
  async getAllMessages() {
    try {
      return await firebaseService.getAllMessages();
    } catch (error) {
      logger.error('Failed to get all messages', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Get conversation summary for admin dashboard
  async getConversationSummary(userKey) {
    try {
      if (!isValidUserKey(userKey)) {
        throw new Error('Invalid or missing userKey');
      }

      const messages = await firebaseService.getMessages(userKey);
      const userMessages = messages.filter(msg => msg.sender === 'user');
      const adminMessages = messages.filter(msg => msg.sender === 'admin');
      const lastMessage = messages[messages.length - 1] || null;

      return {
        userKey,
        email: userKey.replace(/,/g, '.'),
        totalMessages: messages.length,
        userMessages: userMessages.length,
        adminMessages: adminMessages.length,
        lastMessage,
        lastActivity: lastMessage ? lastMessage.timestamp : null
      };
    } catch (error) {
      logger.error('Failed to get conversation summary', { 
        userKey, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new MessageService();