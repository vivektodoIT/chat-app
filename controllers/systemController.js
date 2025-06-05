// controllers/systemController.js
const socketService = require('../services/socketService');
const messageService = require('../services/messageService');
const userService = require('../services/userService');
const logger = require('../utils/logger');
const path = require('path');

class SystemController {
  // Serve main pages
  async serveLandingPage(req, res) {
    try {
      res.sendFile(path.join(__dirname, '../views', 'login.html'));
    } catch (error) {
      logger.error('Error serving landing page', { error: error.message });
      res.status(500).send('Error loading page');
    }
  }

  async serveAdminPage(req, res) {
    try {
      logger.info('Admin page accessed', { ip: req.ip });
      res.sendFile(path.join(__dirname, '../views', 'admin.html'));
    } catch (error) {
      logger.error('Error serving admin page', { error: error.message });
      res.status(500).send('Error loading admin page');
    }
  }

  async serveUserPage(req, res) {
    try {
      logger.info('User page accessed', { ip: req.ip });
      res.sendFile(path.join(__dirname, '../views', 'user.html'));
    } catch (error) {
      logger.error('Error serving user page', { error: error.message });
      res.status(500).send('Error loading user page');
    }
  }

  // Get comprehensive server status
  async getServerStatus(req, res) {
    try {
      logger.info('Server status requested');

      const connectedUsers = socketService.getConnectedUsers();
      const totalUsers = await userService.getUsers();
      const totalMessages = await messageService.getAllMessages();

      const status = {
        server: {
          status: 'running',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        connections: {
          total: connectedUsers.length,
          users: connectedUsers
        },
        statistics: {
          totalUsers: totalUsers.length,
          totalMessages: totalMessages.length,
          messagesLastHour: totalMessages.filter(msg => {
            const msgTime = new Date(msg.timestamp);
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return msgTime > hourAgo;
          }).length
        },
        health: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      logger.success('Server status retrieved', { 
        connectedUsers: status.connections.total,
        totalUsers: status.statistics.totalUsers,
        totalMessages: status.statistics.totalMessages
      });

      res.status(200).json(status);
    } catch (error) {
      logger.error('Error getting server status', { error: error.message });
      res.status(500).json({ 
        success: false,
        error: 'Failed to get server status' 
      });
    }
  }

  // Health check endpoint
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };

      res.status(200).json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(500).json({ 
        status: 'unhealthy',
        error: error.message 
      });
    }
  }

  // API information
  async getApiInfo(req, res) {
    try {
      const apiInfo = {
        name: 'Chat Application API',
        version: '2.0.0',
        description: 'Real-time chat application with admin panel',
        endpoints: {
          auth: [
            'POST /login - Admin login',
            'POST /logout - Logout (future)',
            'GET /auth/check - Check authentication status'
          ],
          messages: [
            'POST /send - Send a message',
            'GET /messages - Get all messages',
            'GET /messages/:userKey - Get messages for specific user',
            'GET /messages/:userKey/summary - Get conversation summary'
          ],
          users: [
            'GET /users - Get all users',
            'GET /users/conversations - Get users with conversation info',
            'POST /validate-email - Validate and convert email',
            'GET /users/:userKey/info - Get user information',
            'GET /users/:userKey/exists - Check if user exists',
            'GET /users/connected - Get currently connected users'
          ],
          system: [
            'GET /status - Get server status',
            'GET /health - Health check',
            'GET /api - API information'
          ],
          pages: [
            'GET / - Landing page',
            'GET /admin - Admin panel',
            'GET /user - User chat page'
          ]
        },
        documentation: 'https://your-docs-url.com',
        support: 'your-email@domain.com'
      };

      res.status(200).json(apiInfo);
    } catch (error) {
      logger.error('Error getting API info', { error: error.message });
      res.status(500).json({ 
        success: false,
        error: 'Failed to get API information' 
      });
    }
  }

  // 404 handler
  async notFound(req, res) {
    logger.warn('404 - Route not found', { 
      url: req.url, 
      method: req.method,
      ip: req.ip
    });
    
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.url,
      method: req.method,
      message: 'The requested resource was not found on this server'
    });
  }

  // Global error handler
  async handleError(err, req, res, next) {
    logger.error('Unhandled error in route', { 
      error: err.message, 
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new SystemController();