// controllers/userController.js
const userService = require('../services/userService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

class UserController {
  // Get all users (simple list for backward compatibility)
  async getUsers(req, res) {
    try {
      logger.info('Get users request');

      const users = await userService.getUsers();
      
      // Return just userKeys for backward compatibility with existing admin.js
      const userKeys = users.map(user => user.userKey);
      
      logger.success('Users retrieved successfully', { 
        count: userKeys.length 
      });
      
      res.status(200).json(userKeys);
    } catch (error) {
      logger.error('Error in getUsers controller', { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch users' 
      });
    }
  }

  // Get users with conversation information (for enhanced admin panel)
  async getUsersWithConversations(req, res) {
    try {
      logger.info('Get users with conversations request');

      const usersInfo = await userService.getUsersWithConversationInfo();
      
      logger.success('Users with conversation info retrieved', { 
        count: usersInfo.length 
      });
      
      res.status(200).json(usersInfo);
    } catch (error) {
      logger.error('Error in getUsersWithConversations controller', { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user conversations' 
      });
    }
  }

  // Validate and sanitize email
  async validateEmail(req, res) {
    try {
      const { email } = req.body;
      
      logger.info('Email validation request', { email });

      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email is required' 
        });
      }

      const result = userService.validateAndSanitizeEmail(email);
      
      logger.success('Email validated successfully', { 
        email: result.email,
        userKey: result.userKey
      });
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error in validateEmail controller', { 
        email: req.body.email, 
        error: error.message 
      });
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get detailed information about a specific user
  async getUserInfo(req, res) {
    try {
      const { userKey } = req.params;
      
      logger.info('Get user info request', { userKey });

      const userInfo = await userService.getUserInfo(userKey);
      
      logger.success('User info retrieved', { 
        userKey,
        email: userInfo.email,
        messageCount: userInfo.messageCount
      });
      
      res.status(200).json(userInfo);
    } catch (error) {
      logger.error('Error in getUserInfo controller', { 
        userKey: req.params.userKey, 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Check if user exists
  async checkUserExists(req, res) {
    try {
      const { userKey } = req.params;
      
      logger.info('Check user exists request', { userKey });

      const exists = await userService.userExists(userKey);
      
      logger.info('User existence check completed', { 
        userKey,
        exists
      });
      
      res.status(200).json({
        success: true,
        userKey,
        exists
      });
    } catch (error) {
      logger.error('Error in checkUserExists controller', { 
        userKey: req.params.userKey, 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get currently connected users
  async getConnectedUsers(req, res) {
    try {
      logger.info('Get connected users request');

      const connectedUsers = socketService.getConnectedUsers();
      
      logger.success('Connected users retrieved', { 
        count: connectedUsers.length 
      });
      
      res.status(200).json({
        success: true,
        count: connectedUsers.length,
        users: connectedUsers
      });
    } catch (error) {
      logger.error('Error in getConnectedUsers controller', { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = new UserController();