// services/userService.js
const firebaseService = require('./firebaseService');
const { emailToKey, keyToEmail } = require('../utils/emailSanitizer');
const { isValidEmail } = require('../utils/validator');
const logger = require('../utils/logger');

class UserService {
  // Get all users who have sent messages
  async getUsers() {
    try {
      const userKeys = await firebaseService.getAllUsers();
      const users = userKeys.map(key => ({
        userKey: key,
        email: keyToEmail(key)
      }));
      
      logger.info('Users retrieved by UserService', { count: users.length });
      return users;
    } catch (error) {
      logger.error('Failed to get users', { error: error.message });
      throw error;
    }
  }

  // Get users with additional conversation info (for admin panel)
  async getUsersWithConversationInfo() {
    try {
      const usersInfo = await firebaseService.getUsersWithLastMessage();
      
      logger.info('Users with conversation info retrieved', { 
        count: usersInfo.length 
      });
      return usersInfo;
    } catch (error) {
      logger.error('Failed to get users with conversation info', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Validate and convert email to userKey
  validateAndSanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const userKey = emailToKey(email);
    logger.info('Email validated and converted to userKey', { 
      email, 
      userKey 
    });

    return {
      email,
      userKey,
      isValid: true
    };
  }

  // Get user info by userKey
  async getUserInfo(userKey) {
    try {
      if (!userKey) {
        throw new Error('UserKey is required');
      }

      const email = keyToEmail(userKey);
      const messages = await firebaseService.getMessages(userKey);
      
      const userInfo = {
        userKey,
        email,
        messageCount: messages.length,
        joinedAt: messages.length > 0 ? messages[0].timestamp : null,
        lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      };

      logger.info('User info retrieved', { userKey, email });
      return userInfo;
    } catch (error) {
      logger.error('Failed to get user info', { 
        userKey, 
        error: error.message 
      });
      throw error;
    }
  }

  // Check if user exists (has sent at least one message)
  async userExists(userKey) {
    try {
      const messages = await firebaseService.getMessages(userKey);
      const exists = messages.length > 0;
      
      logger.debug('User existence check', { userKey, exists });
      return exists;
    } catch (error) {
      logger.error('Failed to check user existence', { 
        userKey, 
        error: error.message 
      });
      return false;
    }
  }
}

module.exports = new UserService();