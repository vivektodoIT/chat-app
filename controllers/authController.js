// controllers/authController.js
const logger = require('../utils/logger');

class AuthController {
  // Handle admin login
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        logger.warn('Login attempt with missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Check credentials (in a real app, this would be more secure)
      if (username === 'admin' && password === 'admin123') {
        logger.info('Admin login successful', { username });
        
        // For API calls, return JSON
        if (req.headers['content-type'] === 'application/json') {
          return res.status(200).json({ 
            success: true, 
            message: 'Login successful',
            redirectUrl: '/admin'
          });
        }
        
        // For form submissions, redirect
        return res.redirect('/admin');
      } else {
        logger.warn('Failed login attempt', { username });
        
        // For API calls, return JSON error
        if (req.headers['content-type'] === 'application/json') {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
          });
        }
        
        // For form submissions, redirect to user page
        return res.redirect('/user');
      }
    } catch (error) {
      logger.error('Login error', { error: error.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Handle logout (future use)
  async logout(req, res) {
    try {
      logger.info('User logged out');
      res.redirect('/');
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Check authentication status (future use)
  async checkAuth(req, res) {
    try {
      // In a real app, you'd check JWT tokens or session
      res.status(200).json({ 
        authenticated: false,
        message: 'Authentication check endpoint - not implemented yet'
      });
    } catch (error) {
      logger.error('Auth check error', { error: error.message });
      res.status(500).json({ error: 'Auth check failed' });
    }
  }
}

module.exports = new AuthController();