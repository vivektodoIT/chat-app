// services/socketService.js
const messageService = require('./messageService');
const { isValidUserKey } = require('../utils/validator');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Track user connections
  }

  // Initialize Socket.IO instance
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    logger.success('Socket service initialized');
  }

  // Set up all socket event handlers
  setupEventHandlers() {
    if (!this.io) {
      logger.error('Socket.IO not initialized');
      return;
    }

    this.io.on('connection', (socket) => {
      logger.info('New socket connection', { socketId: socket.id });

      // Handle user joining a room
      socket.on('join', (userKey) => {
        this.handleJoin(socket, userKey);
      });

      // Handle admin messages
      socket.on('admin message', (data) => {
        this.handleAdminMessage(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Handle user joining a room
  handleJoin(socket, userKey) {
    try {
      if (!isValidUserKey(userKey)) {
        logger.warn('Invalid userKey in join event', { 
          socketId: socket.id, 
          userKey 
        });
        return;
      }

      // Join the room
      socket.join(userKey);
      
      // Track the connection
      this.connectedUsers.set(socket.id, {
        userKey,
        joinedAt: new Date().toISOString()
      });

      logger.info('Socket joined room', { 
        socketId: socket.id, 
        userKey,
        isAdmin: userKey === 'admins'
      });

      // Notify admins about user connection (except admin connections)
      if (userKey !== 'admins') {
        this.notifyAdmins('user_connected', { 
          userKey, 
          email: userKey.replace(/,/g, '.'),
          socketId: socket.id
        });
      }
    } catch (error) {
      logger.error('Error in handleJoin', { 
        socketId: socket.id, 
        userKey, 
        error: error.message 
      });
    }
  }

  // Handle admin messages
  async handleAdminMessage(socket, data) {
    try {
      const { userKey, text, imageBase64 } = data;

      if (!isValidUserKey(userKey) || (!text && !imageBase64)) {
        logger.warn('Invalid admin message data', { 
          socketId: socket.id, 
          userKey, 
          hasText: !!text, 
          hasImage: !!imageBase64 
        });
        return;
      }

      // Use message service to save the message
      const result = await messageService.sendMessage({
        userKey,
        text,
        sender: 'admin',
        imageBase64
      });

      if (result.success) {
        // Emit to the specific user
        this.emitToUser(userKey, 'chat message', result.messageData);
        
        // Also emit to other admins for real-time updates
        this.notifyAdmins('chat message', result.messageData, socket.id);

        logger.success('Admin message processed and sent', { 
          userKey, 
          messageId: result.messageId 
        });
      }
    } catch (error) {
      logger.error('Error handling admin message', { 
        socketId: socket.id, 
        error: error.message 
      });
      
      // Notify the admin about the error
      socket.emit('message_error', { 
        error: 'Failed to send message', 
        details: error.message 
      });
    }
  }

  // Handle socket disconnection
  handleDisconnect(socket) {
    try {
      const userInfo = this.connectedUsers.get(socket.id);
      
      if (userInfo) {
        const { userKey } = userInfo;
        
        // Notify admins about user disconnection (except admin disconnections)
        if (userKey !== 'admins') {
          this.notifyAdmins('user_disconnected', { 
            userKey, 
            email: userKey.replace(/,/g, '.'),
            socketId: socket.id
          });
        }
        
        // Remove from tracking
        this.connectedUsers.delete(socket.id);
        
        logger.info('Socket disconnected', { 
          socketId: socket.id, 
          userKey 
        });
      } else {
        logger.info('Unknown socket disconnected', { 
          socketId: socket.id 
        });
      }
    } catch (error) {
      logger.error('Error in handleDisconnect', { 
        socketId: socket.id, 
        error: error.message 
      });
    }
  }

  // Emit message to a specific user
  emitToUser(userKey, event, data) {
    if (!this.io) {
      logger.error('Cannot emit - Socket.IO not initialized');
      return;
    }

    this.io.to(userKey).emit(event, data);
    logger.debug('Message emitted to user', { userKey, event });
  }

  // Emit message to all admins
  notifyAdmins(event, data, excludeSocketId = null) {
    if (!this.io) {
      logger.error('Cannot notify admins - Socket.IO not initialized');
      return;
    }

    const adminSocket = this.io.to('admins');
    
    if (excludeSocketId) {
      // Exclude the sender admin socket
      adminSocket.except(excludeSocketId).emit(event, data);
    } else {
      adminSocket.emit(event, data);
    }
    
    logger.debug('Notification sent to admins', { event });
  }

  // Broadcast message to both user and admins
  broadcastMessage(userKey, messageData) {
    if (!this.io) {
      logger.error('Cannot broadcast - Socket.IO not initialized');
      return;
    }

    // Send to the specific user
    this.emitToUser(userKey, 'chat message', messageData);
    
    // Send to all admins
    this.notifyAdmins('chat message', messageData);
    
    logger.info('Message broadcasted', { userKey });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users info
  getConnectedUsers() {
    const users = Array.from(this.connectedUsers.entries()).map(([socketId, info]) => ({
      socketId,
      ...info,
      email: info.userKey.replace(/,/g, '.')
    }));
    
    return users.filter(user => user.userKey !== 'admins');
  }
}

module.exports = new SocketService();