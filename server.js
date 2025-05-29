require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");

const serviceAccount = require('./chat-application-n-firebase-adminsdk-e39nr-20cc3ad62f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ─── Helpers to sanitize email ↔ Firebase key ───
function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ',');
}
function emailFromKey(key) {
  return key.replace(/,/g, '.');
}


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});
app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'user.html'));
});

// List all users
app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.ref('messages').once('value');
    const users = Object.keys(snapshot.val() || {});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Fetch all messages (admin overview)
app.get('/messages', async (req, res) => {
  try {
    const snapshot = await db.ref('messages').once('value');
    const data = snapshot.val() || {};
    const all = [];
    Object.values(data).forEach(userMsgs => {
      Object.values(userMsgs).forEach(msg => all.push(msg));
    });
    res.status(200).json(all);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Failed to load messages');
  }
});

// Fetch messages for a specific user
app.get('/messages/:userKey', async (req, res) => {
  const { userKey } = req.params;
  if (!userKey) {
    return res.status(400).json({ error: 'Missing userKey' });
  }
  try {
    const snapshot = await db.ref(`messages/${userKey}`).once('value');
    const messages = snapshot.val() || {};
    const list = Object.values(messages);
    res.status(200).json(list);
  } catch (err) {
    console.error(`Error fetching messages for ${userKey}:`, err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Login (redirect to admin or user)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.redirect('/admin');
  } else {
    res.redirect('/user');
  }
});

// Receive user messages
app.post('/send', (req, res) => {
  const { userKey, text, sender, imageBase64 } = req.body;
  if (!userKey) {
    return res.status(400).send('Missing userKey');
  }
  if ((!text || !text.trim()) && (!imageBase64 || !imageBase64.trim())) {
    return res.status(400).send('Empty message not allowed.');
  }

  const messageData = {
    text:        text         || '',
    sender:      sender       || 'user',
    timestamp:   new Date().toISOString(),
    imageBase64: imageBase64  || ''
  };

  // Save under that user's node
  db.ref(`messages/${userKey}`).push(messageData, error => {
    if (error) {
      console.error('Error saving message:', error);
      return res.status(500).send('Error sending message!');
    }

    // Emit only to that user's room, with explicit primitives
    io.to(userKey).emit('chat message', {
      text:        messageData.text,
      sender:      messageData.sender,
      timestamp:   messageData.timestamp,
      imageBase64: messageData.imageBase64,
      userKey
    });

    res.status(200).send('Message sent successfully!');
  });
});

// WebSocket handlers
io.on('connection', socket => {
  console.log('✅ New socket connected:', socket.id);

  // Client tells us which userId room to join
  socket.on('join', userKey => {
    socket.join(userKey);
    console.log(`🔑 Socket ${socket.id} joined room ${userKey}`);
  });

  // Admin sends a message to a specific user
  socket.on('admin message', msg => {
    const { userKey, text, imageBase64 } = msg;
    if (!userKey || (!text && !imageBase64)) {
      console.warn('⚠️ Invalid admin message, skipping.');
      return;
    }

    const messageData = {
      text:        text        || '',
      sender:      'admin',
      timestamp:   new Date().toISOString(),
      imageBase64: imageBase64 || ''
    };

    console.log(`📥 Admin → ${userKey}:`, messageData);

    // Emit only to that user's room, with explicit primitives
    io.to(userKey).emit('chat message', {
      text:        messageData.text,
      sender:      messageData.sender,
      timestamp:   new Date().toISOString(),
      imageBase64: messageData.imageBase64,
      userKey
    });

    // Save under that user's node
    db.ref(`messages/${userKey}`).push(messageData, error => {
      if (error) {
        console.error('Error saving admin message:', error);
      } else {
        console.log(`Saved admin message to messages/${userKey}`);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('🚪 Socket disconnected:', socket.id);
  });
});

// 404 fallback
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));




















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






