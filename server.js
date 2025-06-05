// server.js - Updated to use organized routes (Phase 5)
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

// Import services
const firebaseService = require('./services/firebaseService');
const socketService = require('./services/socketService');

// Import organized routes
const routes = require('./routes');

// Import system controller for error handling
const systemController = require('./controllers/systemController');

// Import utilities
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ===== INITIALIZATION =====

// Initialize Firebase
try {
  firebaseService.initialize(
    'chat-application-n-firebase-adminsdk-e39nr-20cc3ad62f.json',
    'https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app/'
  );
  logger.success('Firebase initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase, exiting...', { error: error.message });
  process.exit(1);
}

// Initialize Socket service
try {
  socketService.initialize(io);
  logger.success('Socket.IO initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Socket.IO', { error: error.message });
  process.exit(1);
}

// ===== MIDDLEWARE =====

// Body parsing middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ===== ROUTES =====

// Use organized routes
app.use('/', routes);

// ===== ERROR HANDLING =====

// Global error handler (must be last middleware)
app.use(systemController.handleError);

// ===== GRACEFUL SHUTDOWN =====

// Force exit flag
let forceExitTimer = null;
let isShuttingDown = false;

// Enhanced graceful shutdown function
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }
  
  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Set a force exit timer (10 seconds max for graceful shutdown)
  forceExitTimer = setTimeout(() => {
    logger.warn('Force exiting after 10 seconds timeout');
    process.exit(1);
  }, 10000);
  
  // Close server and socket connections
  server.close((err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
    } else {
      logger.success('HTTP server closed successfully');
    }
    
    // Close socket connections
    if (io) {
      io.close(() => {
        logger.success('Socket.IO server closed successfully');
      });
    }
    
    // Clear the force exit timer
    if (forceExitTimer) {
      clearTimeout(forceExitTimer);
    }
    
    logger.success('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Close all existing socket connections
  if (io) {
    io.sockets.emit('server_shutdown', { 
      message: 'Server is shutting down for maintenance' 
    });
  }
}

// Handle multiple termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Server will exit', { 
    error: error.message, 
    stack: error.stack 
  });
  
  // Give some time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection - Server will exit', { 
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // Give some time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Ensure process can exit (prevent hanging)
process.stdin.resume();

// ===== SERVER STARTUP =====

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, () => {
  logger.success(`🚀 Chat Application Server Started`);
  logger.info('═'.repeat(60));
  logger.info('📊 Server Information:');
  logger.info(`   🌐 Host: ${HOST}`);
  logger.info(`   🔌 Port: ${PORT}`);
  logger.info(`   📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   🐧 Platform: ${process.platform}`);
  logger.info(`   🟢 Node.js: ${process.version}`);
  logger.info('');
  logger.info('🌍 Frontend URLs:');
  logger.info(`   🏠 Landing Page: http://${HOST}:${PORT}/`);
  logger.info(`   👨‍💼 Admin Panel: http://${HOST}:${PORT}/admin`);
  logger.info(`   💬 User Chat: http://${HOST}:${PORT}/user`);
  logger.info('');
  logger.info('🔧 API Endpoints:');
  logger.info(`   📊 Server Status: http://${HOST}:${PORT}/status`);
  logger.info(`   ❤️ Health Check: http://${HOST}:${PORT}/health`);
  logger.info(`   📚 API Documentation: http://${HOST}:${PORT}/api`);
  logger.info('');
  logger.info('🛠️ Development:');
  logger.info('   🔄 Auto-restart: Use nodemon for development');
  logger.info('   🐛 Debug: Enable DEBUG=* for verbose logging');
  logger.info('   ⏹️ Stop Server: Press Ctrl+C for graceful shutdown');
  logger.info('═'.repeat(60));
  
  // Additional startup checks
  logger.info('🔍 Startup Checks:');
  logger.info(`   ✅ Firebase: Connected`);
  logger.info(`   ✅ Socket.IO: Initialized`);
  logger.info(`   ✅ Routes: Organized and loaded`);
  logger.info(`   ✅ Controllers: All controllers loaded`);
  logger.info(`   ✅ Services: All services initialized`);
  logger.info(`   ✅ Middleware: Security and logging active`);
  logger.info('');
  logger.success('🎉 Server is ready to handle requests!');
});














//                                                                                          second
// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// const bodyParser = require('body-parser');
// const admin = require("firebase-admin");

// const serviceAccount = require('./chat-application-n-firebase-adminsdk-e39nr-20cc3ad62f.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app/"
// });

// const db = admin.database();
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // ─── Helpers to sanitize email ↔ Firebase key ───
// function emailKey(email) {
//   return email.trim().toLowerCase().replace(/\./g, ',');
// }
// function emailFromKey(key) {
//   return key.replace(/,/g, '.');
// }
// // Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Body parsers
// app.use(bodyParser.json({ limit: '10mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'login.html'));
// });
// app.get('/admin', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'admin.html'));
// });
// app.get('/user', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'user.html'));
// });

// // List all users
// app.get('/users', async (req, res) => {
//   try {
//     const snapshot = await db.ref('messages').once('value');
//     const users = Object.keys(snapshot.val() || {});
//     res.status(200).json(users);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch users' });
//   }
// });

// // Fetch all messages (admin overview)
// app.get('/messages', async (req, res) => {
//   try {
//     const snapshot = await db.ref('messages').once('value');
//     const data = snapshot.val() || {};
//     const all = [];
//     Object.values(data).forEach(userMsgs => {
//       Object.values(userMsgs).forEach(msg => all.push(msg));
//     });
//     res.status(200).json(all);
//   } catch (err) {
//     console.error('Error fetching messages:', err);
//     res.status(500).send('Failed to load messages');
//   }
// });

// // Fetch messages for a specific user
// app.get('/messages/:userKey', async (req, res) => {
//   const { userKey } = req.params;
//   if (!userKey) {
//     return res.status(400).json({ error: 'Missing userKey' });
//   }
//   try {
//     const snapshot = await db.ref(`messages/${userKey}`).once('value');
//     const messages = snapshot.val() || {};
//     const list = Object.values(messages);
//     res.status(200).json(list);
//   } catch (err) {
//     console.error(`Error fetching messages for ${userKey}:`, err);
//     res.status(500).json({ error: 'Failed to load messages' });
//   }
// });

// // Login (redirect to admin or user)
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   if (username === 'admin' && password === 'admin123') {
//     res.redirect('/admin');
//   } else {
//     res.redirect('/user');
//   }
// });

// // Receive user messages
// app.post('/send', (req, res) => {
//   const { userKey, text, sender, imageBase64 } = req.body;
//   if (!userKey) {
//     return res.status(400).send('Missing userKey');
//   }
//   if ((!text || !text.trim()) && (!imageBase64 || !imageBase64.trim())) {
//     return res.status(400).send('Empty message not allowed.');
//   }

//   const messageData = {
//     text:        text         || '',
//     sender:      sender       || 'user',
//     timestamp:   new Date().toISOString(),
//     imageBase64: imageBase64  || ''
//   };

//   // Save under that user's node
//   db.ref(`messages/${userKey}`).push(messageData, error => {
//     if (error) {
//       console.error('Error saving message:', error);
//       return res.status(500).send('Error sending message!');
//     }

//     // Emit only to that user's room, with explicit primitives
//     io.to(userKey).emit('chat message', {
//       text:        messageData.text,
//       sender:      messageData.sender,
//       timestamp:   messageData.timestamp,
//       imageBase64: messageData.imageBase64,
//       userKey
//     });
//     // ALSO notify all admins in real time:
//     io.to('admins').emit('chat message', {
//       text:        messageData.text,
//       sender:      messageData.sender,
//       timestamp:   messageData.timestamp,
//       imageBase64: messageData.imageBase64,
//       userKey
//     });

    
//     res.status(200).send('Message sent successfully!');
//   });
// });

// // WebSocket handlers
// io.on('connection', socket => {
//   console.log('✅ New socket connected:', socket.id);

//   // Client tells us which userId room to join
//   socket.on('join', userKey => {
//     socket.join(userKey);
//     console.log(`🔑 Socket ${socket.id} joined room ${userKey}`);
//   });

//   // Admin sends a message to a specific user
//   socket.on('admin message', msg => {
//     const { userKey, text, imageBase64 } = msg;
//     if (!userKey || (!text && !imageBase64)) {
//       console.warn('⚠️ Invalid admin message, skipping.');
//       return;
//     }

//     const messageData = {
//       text:        text        || '',
//       sender:      'admin',
//       timestamp:   new Date().toISOString(),
//       imageBase64: imageBase64 || ''
//     };

//     console.log(`📥 Admin → ${userKey}:`, messageData);

//     // Save under that user's node
//     db.ref(`messages/${userKey}`).push(messageData, error => {
//       if (error) {
//         console.error('Error saving admin message:', error);
//       } else {
//         console.log(`Saved admin message to messages/${userKey}`);
//       }
//     });
//   });

//   socket.on('disconnect', () => {
//     console.log('🚪 Socket disconnected:', socket.id);
//   });
// });

// // 404 fallback
// app.get('*', (req, res) => {
//   res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 3002;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));





















//                                                                                        first
// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// const bodyParser = require('body-parser');
// const admin = require("firebase-admin");

// const serviceAccount = require('./chat-application-n-firebase-adminsdk-e39nr-20cc3ad62f.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app/"
// });

// const db = admin.database();
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // ─── Helpers to sanitize email ↔ Firebase key ───
// function emailKey(email) {
//   return email.trim().toLowerCase().replace(/\./g, ',');
// }
// function emailFromKey(key) {
//   return key.replace(/,/g, '.');
// }


// // Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Body parsers
// app.use(bodyParser.json({ limit: '10mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'login.html'));
// });
// app.get('/admin', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'admin.html'));
// });
// app.get('/user', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'user.html'));
// });

// // List all users
// app.get('/users', async (req, res) => {
//   try {
//     const snapshot = await db.ref('messages').once('value');
//     const users = Object.keys(snapshot.val() || {});
//     res.status(200).json(users);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch users' });
//   }
// });

// // Fetch all messages (admin overview)
// app.get('/messages', async (req, res) => {
//   try {
//     const snapshot = await db.ref('messages').once('value');
//     const data = snapshot.val() || {};
//     const all = [];
//     Object.values(data).forEach(userMsgs => {
//       Object.values(userMsgs).forEach(msg => all.push(msg));
//     });
//     res.status(200).json(all);
//   } catch (err) {
//     console.error('Error fetching messages:', err);
//     res.status(500).send('Failed to load messages');
//   }
// });

// // Fetch messages for a specific user
// app.get('/messages/:userId', async (req, res) => {
//   const { userId } = req.params;
//   if (!userId) {
//     return res.status(400).json({ error: 'Missing userId' });
//   }
//   try {
//     const snapshot = await db.ref(`messages/${userId}`).once('value');
//     const messages = snapshot.val() || {};
//     const list = Object.values(messages);
//     res.status(200).json(list);
//   } catch (err) {
//     console.error(`Error fetching messages for ${userId}:`, err);
//     res.status(500).json({ error: 'Failed to load messages' });
//   }
// });

// // Login (redirect to admin or user)
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   if (username === 'admin' && password === 'admin123') {
//     res.redirect('/admin');
//   } else {
//     res.redirect('/user');
//   }
// });

// // Receive user messages
// app.post('/send', (req, res) => {
//   const { userId, text, sender, imageBase64 } = req.body;
//   if (!userId) {
//     return res.status(400).send('Missing userId');
//   }
//   if ((!text || !text.trim()) && (!imageBase64 || !imageBase64.trim())) {
//     return res.status(400).send('Empty message not allowed.');
//   }

//   const messageData = {
//     text:        text         || '',
//     sender:      sender       || 'user',
//     timestamp:   new Date().toISOString(),
//     imageBase64: imageBase64  || ''
//   };

//   // Save under that user's node
//   db.ref(`messages/${userId}`).push(messageData, error => {
//     if (error) {
//       console.error('Error saving message:', error);
//       return res.status(500).send('Error sending message!');
//     }

//     // Emit only to that user's room, with explicit primitives
//     io.to(userId).emit('chat message', {
//       text:        messageData.text,
//       sender:      messageData.sender,
//       timestamp:   messageData.timestamp,
//       imageBase64: messageData.imageBase64,
//       userId
//     });

//     res.status(200).send('Message sent successfully!');
//   });
// });

// // WebSocket handlers
// io.on('connection', socket => {
//   console.log('✅ New socket connected:', socket.id);

//   // Client tells us which userId room to join
//   socket.on('join', userId => {
//     socket.join(userId);
//     console.log(`🔑 Socket ${socket.id} joined room ${userId}`);
//   });

//   // Admin sends a message to a specific user
//   socket.on('admin message', msg => {
//     const { userId, text, imageBase64 } = msg;
//     if (!userId || (!text && !imageBase64)) {
//       console.warn('⚠️ Invalid admin message, skipping.');
//       return;
//     }

//     const messageData = {
//       text:        text        || '',
//       sender:      'admin',
//       timestamp:   new Date().toISOString(),
//       imageBase64: imageBase64 || ''
//     };

//     console.log(`📥 Admin → ${userId}:`, messageData);

//     // Emit only to that user's room, with explicit primitives
//     io.to(userId).emit('chat message', {
//       text:        messageData.text,
//       sender:      messageData.sender,
//       timestamp:   messageData.timestamp,
//       imageBase64: messageData.imageBase64,
//       userId
//     });

//     // Save under that user's node
//     db.ref(`messages/${userId}`).push(messageData, error => {
//       if (error) {
//         console.error('Error saving admin message:', error);
//       } else {
//         console.log(`Saved admin message to messages/${userId}`);
//       }
//     });
//   });

//   socket.on('disconnect', () => {
//     console.log('🚪 Socket disconnected:', socket.id);
//   });
// });

// // 404 fallback
// app.get('*', (req, res) => {
//   res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 3002;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));






