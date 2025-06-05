// services/firebaseService.js
const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FirebaseService {
  constructor() {
    this.db = null;
  }

  // Initialize Firebase (called from server.js)
  initialize(serviceAccountPath, databaseURL) {
    try {
      if (!this.db) {
        const serviceAccount = require(`../${serviceAccountPath}`);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: databaseURL
        });
        
        this.db = admin.database();
        logger.success('Firebase initialized successfully');
      }
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize Firebase', { error: error.message });
      throw error;
    }
  }

  // Get database instance
  getDatabase() {
    if (!this.db) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Save a message to Firebase
  async saveMessage(userKey, messageData) {
    try {
      const ref = await this.db.ref(`messages/${userKey}`).push(messageData);
      logger.info('Message saved to Firebase', { 
        userKey, 
        messageId: ref.key,
        sender: messageData.sender 
      });
      return ref;
    } catch (error) {
      logger.error('Failed to save message to Firebase', { 
        userKey, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get all messages for a specific user
  async getMessages(userKey) {
    try {
      const snapshot = await this.db.ref(`messages/${userKey}`).once('value');
      const messages = snapshot.val() || {};
      const messageList = Object.values(messages);
      
      // Sort by timestamp ascending
      messageList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      logger.info('Messages retrieved from Firebase', { 
        userKey, 
        count: messageList.length 
      });
      return messageList;
    } catch (error) {
      logger.error('Failed to retrieve messages from Firebase', { 
        userKey, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get all users (who have sent messages)
  async getAllUsers() {
    try {
      const snapshot = await this.db.ref('messages').once('value');
      const users = Object.keys(snapshot.val() || {});
      
      logger.info('Users retrieved from Firebase', { count: users.length });
      return users;
    } catch (error) {
      logger.error('Failed to retrieve users from Firebase', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Get all messages from all users (for admin overview)
  async getAllMessages() {
    try {
      const snapshot = await this.db.ref('messages').once('value');
      const data = snapshot.val() || {};
      const allMessages = [];
      
      // Flatten all messages from all users
      Object.entries(data).forEach(([userKey, userMessages]) => {
        Object.values(userMessages).forEach(message => {
          allMessages.push({
            ...message,
            userKey // Add userKey to identify which user sent it
          });
        });
      });
      
      // Sort by timestamp ascending
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      logger.info('All messages retrieved from Firebase', { 
        count: allMessages.length 
      });
      return allMessages;
    } catch (error) {
      logger.error('Failed to retrieve all messages from Firebase', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Get users with their last message info (useful for admin sidebar)
  async getUsersWithLastMessage() {
    try {
      const snapshot = await this.db.ref('messages').once('value');
      const data = snapshot.val() || {};
      const usersInfo = [];
      
      Object.entries(data).forEach(([userKey, userMessages]) => {
        const messages = Object.values(userMessages);
        const lastMessage = messages.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        
        usersInfo.push({
          userKey,
          email: userKey.replace(/,/g, '.'), // Convert back to email format
          messageCount: messages.length,
          lastMessage,
          lastActivity: lastMessage ? lastMessage.timestamp : null
        });
      });
      
      // Sort by last activity (most recent first)
      usersInfo.sort((a, b) => {
        const aTime = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
        const bTime = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
        return bTime - aTime;
      });
      
      logger.info('Users with last message info retrieved', { 
        count: usersInfo.length 
      });
      return usersInfo;
    } catch (error) {
      logger.error('Failed to retrieve users with last message info', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new FirebaseService();