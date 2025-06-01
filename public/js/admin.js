// ─── Helpers to sanitize email ↔ Firebase key ────────────────────────────────                 
function emailFromKey(key) {
  return key.replace(/,/g, '.');
}

// ─── Firebase init (same config you already have) ────────────────────────────
const firebaseConfig = {
  apiKey:          "AIzaSyBSCzfKZ2s3jE7CSyBlJiXwEkvQSOsjY54",
  authDomain:      "chat-application-n.firebaseapp.com",
  databaseURL:     "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:       "chat-application-n",
  storageBucket:   "chat-application-n.appspot.com",
  messagingSenderId:"755206797335",
  appId:           "1:755206797335:web:20c9cb1b8ed7e0bb7b4452",
  measurementId:   "G-DLL61DHR1Q"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── DOM references ────────────────────────────────────────────────────────────
const usersSidebar = document.getElementById('usersList');
const messagesEl   = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const fileInput    = document.getElementById('imageInput');
const sendBtn      = document.getElementById('sendBtn');

let selectedUserKey = null;  // The Firebase‐sanitized key of the currently‐open user

// ─── 1) Load sidebar user list from Firebase ─────────────────────────────────
// Returns a Promise that resolves to “firstKey” if at least one user exists.
function loadUserList() {
  return db.ref('messages').once('value').then(snap => {
    usersSidebar.innerHTML = '';      // remove any old buttons
    let firstKey = null;

    snap.forEach(childSnap => {
      const key = childSnap.key;               // e.g. "foo,bar@gmail,com"
      const email = emailFromKey(key);         // → "foo.bar@gmail.com"
      const btn = document.createElement('button');
      btn.className = 'user-btn';
      btn.textContent = email;
      btn.onclick = () => loadMessagesForUser(key);
      usersSidebar.appendChild(btn);

      if (!firstKey) {
        firstKey = key;
      } 
    });

    return firstKey;  // may be null if no users exist yet
  });
}

// ─── 2) Load all messages for “userKey” and render them ──────────────────────
function loadMessagesForUser(userKey) {
  selectedUserKey = userKey;
  messagesEl.innerHTML = '';  // clear the right‐side chat

  db.ref(`messages/${userKey}`)
    .once('value')
    .then(snapshot => {
      const data = snapshot.val() || {};
      // Convert the object { key1: {…}, key2: {…}, … } → an array of message objects
      const list = Object.values(data);

      // Sort by timestamp ascending
      list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Render each message bubble
      list.forEach(displayMessage);
    })
    .catch(console.error);
}

// ─── 3) Render one message bubble on the right ────────────────────────────────
function displayMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message ' + (msg.sender === 'admin' ? 'admin-message' : 'user-message');

  div.innerHTML = `
    <div class="bubble">
      ${msg.text ? `<p>${msg.text}</p>` : ''}
      ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ''}
      <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString([], {
        hour:   '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight; 
}

// ─── 4) Handle “Send” (admin typing a new message) ───────────────────────────
function handleSend() {
  if (!selectedUserKey) {
    return alert('Please select a user first.');
  }

  const text = messageInput.value.trim();
  const file = fileInput.files[0];
  if (!text && !file) {
    return alert('Cannot send an empty message.');
  }

  const sendToFirebase = imgData => {
    const msg = {
      text:        text || '',
      imageBase64: imgData || '',
      sender:      'admin',
      timestamp:   new Date().toISOString()
    };

    // 4a) Push to Firebase
    // db.ref(`messages/${selectedUserKey}`)
    //   .push(msg)
    //   .then(() => {
    //     displayMessage(msg);  // show it immediately on the right
    //   })
    //   .catch(console.error);

    // 4b) Emit over Socket.IO so the user side sees it in real time
    socket.emit('admin message', { ...msg, userKey: selectedUserKey });
    displayMessage(msg);
  };

  if (file) {
    if (!file.type.startsWith('image/')) {
      return alert('Only images allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return alert('Max 5MB.');
    }
    const reader = new FileReader();
    reader.onload = () => sendToFirebase(reader.result);
    reader.readAsDataURL(file);
  } else {
    sendToFirebase(null);
  }

  messageInput.value = '';
  fileInput.value = '';
}

// ─── 5) Wire up Socket.IO for real-time “chat message” events ────────────────
const socket = io();
socket.on('connect', () => console.log('Admin socket connected'));

// Whenever *any* new message arrives, we’ll get “chat message” here.
// If it belongs to the currently open user, immediately append it:
socket.on('chat message', data => {
  if (data.userKey === selectedUserKey) {
    displayMessage(data);
  }
});

// ─── 6) Enable Enter-key to send for the admin side ─────────────────────────
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// ─── 7) Finally: on page load, build the sidebar → load the first user ───────
sendBtn.addEventListener('click', handleSend);
loadUserList().then(firstKey => {
  if (firstKey) {
    loadMessagesForUser(firstKey);
  }
});                                                        














// // public/js/admin.js

// // ─── Helpers to map between email ↔ Firebase key ─────────────────────────────
// function emailKey(email) {
//   return email.trim().toLowerCase().replace(/\./g, ',');
// }
// function emailFromKey(key) {
//   return key.replace(/,/g, '.');
// }

// // ─── Firebase init ────────────────────────────────────────────────────────────
// const firebaseConfig = {
//   apiKey:          "AIzaSyBSCzfKZ2s3jE7CSyBlJiXwEkvQSOsjY54",
//   authDomain:      "chat-application-n.firebaseapp.com",
//   databaseURL:     "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId:       "chat-application-n",
//   storageBucket:   "chat-application-n.appspot.com",
//   messagingSenderId:"755206797335",
//   appId:           "1:755206797335:web:20c9cb1b8ed7e0bb7b4452",
//   measurementId:   "G-DLL61DHR1Q"
// };
// firebase.initializeApp(firebaseConfig);
// const db = firebase.database();

// // ─── DOM references ────────────────────────────────────────────────────────────
// const usersSidebar  = document.getElementById('usersList');
// const messagesEl    = document.getElementById('messages');
// const messageInput  = document.getElementById('messageInput');
// const fileInput     = document.getElementById('imageInput');
// const sendBtn       = document.getElementById('sendBtn');

// let selectedUserKey = null;

// // ─── Load sidebar user list ───────────────────────────────────────────────────
// // ─── Load sidebar user list ───────────────────────────────────────────────────
// function loadUserList() {
//   return db.ref('messages')
//     .once('value')
//     .then(snap => {
//       usersSidebar.innerHTML = '';
//       let firstKey = null;

//       snap.forEach(child => {
//         const key   = child.key;           // e.g. "foo,bar@gmail,com"
//         const email = emailFromKey(key);   // → "foo.bar@gmail.com"
//         const btn   = document.createElement('button');
//         btn.className = 'user-btn';
//         btn.textContent = email;
//         btn.onclick = () => loadMessagesForUser(key);
//         usersSidebar.appendChild(btn);

//         if (!firstKey) firstKey = key;
//       });

//       return firstKey;
//     });
// }

// function loadMessagesForUser(userKey) {
//   selectedUserKey = userKey;
//   messagesEl.innerHTML = '';            // clear

//   db.ref(`messages/${userKey}`)
//     .once('value')
//     .then(snapshot => {
//       // Pull the snapshot as a plain object, then turn into an array:
//       const data = snapshot.val() || {};
//       const list = Object.values(data);

//       // sort by timestamp ascending
//       list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

//       // render every message
//       list.forEach(displayMessage);
//     })
//     .catch(console.error);
// }

// // ─── Render one message bubble ────────────────────────────────────────────────
// function displayMessage(msg) {
//   const div = document.createElement('div');
//   div.className = 'message ' + (msg.sender === 'admin' ? 'admin-message' : 'user-message');
//   div.innerHTML = `
//     <div class="bubble">
//       ${msg.text ? `<p>${msg.text}</p>` : ''}
//       ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ''}
//       <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString([], {
//         hour: '2-digit', minute: '2-digit'
//       })}</div>
//     </div>
//   `;
//   messagesEl.appendChild(div);
//   messagesEl.scrollTop = messagesEl.scrollHeight;
// }

// // ─── Send reply to selected user ──────────────────────────────────────────────
// function handleSend() {
//   if (!selectedUserKey) {
//     return alert('Please select a user first.');
//   }

//   const text = messageInput.value.trim();
//   const file = fileInput.files[0];

//   if (!text && !file) {
//     return alert('Cannot send empty message.');
//   }

//   const sendToFirebase = (imgData) => {
//     const msg = {
//       text:        text || '',
//       imageBase64: imgData || '',
//       sender:      'admin',
//       timestamp:   new Date().toISOString()
//     };
//     // push & emit
//     db.ref(`messages/${selectedUserKey}`).push(msg)
//       .then(() => displayMessage(msg))
//       .catch(console.error);

//     socket.emit('admin message', { ...msg, userKey: selectedUserKey });
//   };

//   if (file) {
//     if (!file.type.startsWith('image/')) {
//       return alert('Only images allowed.');
//     }
//     if (file.size > 5*1024*1024) {
//       return alert('Max 5MB.');
//     }
//     const reader = new FileReader();
//     reader.onload = () => sendToFirebase(reader.result);
//     reader.readAsDataURL(file);
//   } else {
//     sendToFirebase(null);
//   }

//   messageInput.value = '';
//   fileInput.value = '';
// }

// // ─── Socket.io real-time hook ────────────────────────────────────────────────
// const socket = io();
// socket.on('connect', () => console.log('Admin socket connected'));
// socket.emit('join','admins');
// socket.on('chat message', data => {
//   // Only show if it’s for the currently open user
//   if (data.userKey === selectedUserKey) {
//     displayMessage(data);
//   }
// });

// // ─── Wire up send & initial load ──────────────────────────────────────────────
// sendBtn.addEventListener('click', handleSend);
// // allow Enter key to send for admin
// messageInput.addEventListener('keydown', function(e) {
//   if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault();
//     handleSend();
//   }
// });

// loadUserList().then(firstKey => {
//   if (firstKey) loadMessagesForUser(firstKey);
// });































//                                                                                                second
// // public/js/admin.js

// // ─── Helpers to map between email ↔ Firebase key ─────────────────────────────
// function emailKey(email) {
//   return email.trim().toLowerCase().replace(/\./g, ',');
// }
// function emailFromKey(key) {
//   return key.replace(/,/g, '.');
// }

// // ─── Firebase init ────────────────────────────────────────────────────────────
// const firebaseConfig = {
//   apiKey:          "AIzaSyBSCzfKZ2s3jE7CSyBlJiXwEkvQSOsjY54",
//   authDomain:      "chat-application-n.firebaseapp.com",
//   databaseURL:     "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId:       "chat-application-n",
//   storageBucket:   "chat-application-n.appspot.com",
//   messagingSenderId:"755206797335",
//   appId:           "1:755206797335:web:20c9cb1b8ed7e0bb7b4452",
//   measurementId:   "G-DLL61DHR1Q"
// };
// firebase.initializeApp(firebaseConfig);
// const db = firebase.database();

// // ─── DOM references ────────────────────────────────────────────────────────────
// const usersSidebar  = document.getElementById('usersList');
// const messagesEl    = document.getElementById('messages');
// const messageInput  = document.getElementById('messageInput');
// const fileInput     = document.getElementById('imageInput');
// const sendBtn       = document.getElementById('sendBtn');

// let selectedUserKey = null;

// // ─── Load sidebar user list ───────────────────────────────────────────────────
// // ─── Load sidebar user list ───────────────────────────────────────────────────
// function loadUserList() {
//   return db.ref('messages')
//     .once('value')
//     .then(snap => {
//       usersSidebar.innerHTML = '';
//       let firstKey = null;

//       snap.forEach(child => {
//         const key   = child.key;           // e.g. "foo,bar@gmail,com"
//         const email = emailFromKey(key);   // → "foo.bar@gmail.com"
//         const btn   = document.createElement('button');
//         btn.className = 'user-btn';
//         btn.textContent = email;
//         btn.onclick = () => loadMessagesForUser(key);
//         usersSidebar.appendChild(btn);

//         if (!firstKey) firstKey = key;
//       });

//       return firstKey;
//     });
// }

// function loadMessagesForUser(userKey) {
//   selectedUserKey = userKey;
//   messagesEl.innerHTML = '';            // clear

//   db.ref(`messages/${userKey}`)
//     .once('value')
//     .then(snapshot => {
//       // Pull the snapshot as a plain object, then turn into an array:
//       const data = snapshot.val() || {};
//       const list = Object.values(data);

//       // sort by timestamp ascending
//       list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

//       // render every message
//       list.forEach(displayMessage);
//     })
//     .catch(console.error);
// }



// // ─── Render one message bubble ────────────────────────────────────────────────
// function displayMessage(msg) {
//   const div = document.createElement('div');
//   div.className = 'message ' + (msg.sender === 'admin' ? 'admin-message' : 'user-message');
//   div.innerHTML = `
//     <div class="bubble">
//       ${msg.text ? `<p>${msg.text}</p>` : ''}
//       ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ''}
//       <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString([], {
//         hour: '2-digit', minute: '2-digit'
//       })}</div>
//     </div>
//   `;
//   messagesEl.appendChild(div);
//   messagesEl.scrollTop = messagesEl.scrollHeight;
// }

// // ─── Send reply to selected user ──────────────────────────────────────────────
// function handleSend() {
//   if (!selectedUserKey) {
//     return alert('Please select a user first.');
//   }

//   const text = messageInput.value.trim();
//   const file = fileInput.files[0];

//   if (!text && !file) {
//     return alert('Cannot send empty message.');
//   }

//   const sendToFirebase = (imgData) => {
//     const msg = {
//       text:        text || '',
//       imageBase64: imgData || '',
//       sender:      'admin',
//       timestamp:   new Date().toISOString()
//     };
//     // push & emit
//     db.ref(`messages/${selectedUserKey}`).push(msg)
//       .then(() => displayMessage(msg))
//       .catch(console.error);

//     socket.emit('admin message', { ...msg, userKey: selectedUserKey });
//   };

//   if (file) {
//     if (!file.type.startsWith('image/')) {
//       return alert('Only images allowed.');
//     }
//     if (file.size > 5*1024*1024) {
//       return alert('Max 5MB.');
//     }
//     const reader = new FileReader();
//     reader.onload = () => sendToFirebase(reader.result);
//     reader.readAsDataURL(file);
//   } else {
//     sendToFirebase(null);
//   }

//   messageInput.value = '';
//   fileInput.value = '';
// }

// // ─── Socket.io real-time hook ────────────────────────────────────────────────
// const socket = io();
// socket.on('connect', () => console.log('Admin socket connected'));
// socket.emit('join','admins');
// socket.on('chat message', data => {
//   // Only show if it’s for the currently open user
//   if (data.userKey === selectedUserKey) {
//     displayMessage(data);
//   }
// });

// // ─── Wire up send & initial load ──────────────────────────────────────────────
// sendBtn.addEventListener('click', handleSend);
// loadUserList().then(firstKey => {
//   if (firstKey) loadMessagesForUser(firstKey);
// });

















//                                                                                    first
// // ✅ Firebase config
// const firebaseConfig = {
//   apiKey: "AIzaSyBSCzfKZ2s3jE7CSyBlJiXwEkvQSOsjY54",
//   authDomain: "chat-application-n.firebaseapp.com",
//   databaseURL: "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "chat-application-n",
//   storageBucket: "chat-application-n.appspot.com",
//   messagingSenderId: "755206797335",
//   appId: "1:755206797335:web:20c9cb1b8ed7e0bb7b4452",
//   measurementId: "G-DLL61DHR1Q"
// };

// firebase.initializeApp(firebaseConfig);
// const database = firebase.database();

// const userButtonsContainer = document.getElementById('userButtons');

// // Load list of users from Firebase and display on the left
// firebase.database().ref('messages').once('value', (snapshot) => {
//   const users = new Set();

//   snapshot.forEach((childSnapshot) => {
//     const path = childSnapshot.ref.toString();
//     const match = path.match(/messages\/([^/]+)/);
//     if (match && match[1]) users.add(match[1]);
//   });

//   userButtonsContainer.innerHTML = ''; // Clear before adding
//   users.forEach((userId) => {
//     const btn = document.createElement('button');
//     btn.classList.add('user-btn');
//     btn.innerText = userId;
//     btn.onclick = () => loadMessagesForUser(userId);
//     userButtonsContainer.appendChild(btn);
//   });
// });
// function loadMessagesForUser(userId) {
//   window.alert('click event called', userId);
//   const messagesRef = firebase.database().ref(`messages/${userId}`);

//   messagesRef.once('value', (snapshot) => {
//     messagesEl.innerHTML = ''; // Clear current messages

//     const messages = [];
//     snapshot.forEach(child => {
//       messages.push(child.val());
//     });

//     messages.sort((a, b) => a.timestamp - b.timestamp);
//     messages.forEach(displayMessage);
//   });
// }


// const socket = io();
// socket.on('connect', () => {
//   console.log('✅ Admin socket connected');
// });

// socket.on('chat message', (data) => {
//   console.log('message is MV', data);
//   alert('message received');
// });

// // ✅ DOM elements
// const messagesEl = document.getElementById('messages');
// const messageInput = document.getElementById('messageInput');
// const fileInput = document.getElementById('imageInput');
// const sendBtn = document.getElementById('sendBtn');
// const usersSidebar = document.getElementById('usersList');

// let selectedUserId = null; // Stores the currently selected user's ID

// // ✅ Escape HTML
// function escapeHtml(text) {
//   const div = document.createElement('div');
//   div.textContent = text;
//   return div.innerHTML;
// }

// // ✅ Format timestamp
// function formatTime(ts) {
//   const date = new Date(ts);
//   return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// // ✅ Display a message
// function displayMessage(message) {
//   const messageDiv = document.createElement('div');
//   messageDiv.classList.add('message');
//   messageDiv.classList.add(message.sender === 'admin' ? 'admin-message' : 'user-message');

//    // show the message.text, not the whole object
//   let innerHTML = `<div>${escapeHtml(message.text || '')}</div>`;
//   if (message.imageBase64) {
//     innerHTML += `<img src="${message.imageBase64}" alt="image" style="max-width: 200px; display: block; margin-top: 5px;" />`;
//   }
//   if (message.timestamp) {
//     innerHTML += `<small style="display: block; margin-top: 5px;">${formatTime(message.timestamp)}</small>`;
//   }

//   messageDiv.innerHTML = innerHTML;
//   messagesEl.appendChild(messageDiv);
//   messagesEl.scrollTop = messagesEl.scrollHeight;
// }

// // ✅ Load users in sidebar
// function loadUsers() {
//   const usersRef = database.ref('messages');
//   usersRef.once('value', snapshot => {
//     usersSidebar.innerHTML = ''; // clear previous
//     snapshot.forEach(child => {
//       const userId = child.key;
//       const btn = document.createElement('button');
//       btn.classList.add('user-btn');
//       btn.textContent = userId;
//       btn.onclick = () => loadMessagesForUser(userId);
//       usersSidebar.appendChild(btn);
//     });
//   });
// }

// // ✅ Load messages of selected user
// function loadMessagesForUser(userId) {
//   selectedUserId = userId;
//   messagesEl.innerHTML = '';
//   const userRef = database.ref(`messages/${userId}`);
//   userRef.once('value', snap => {
//     const messages = [];
//     snap.forEach(child => {
//       messages.push(child.val());
//     });
//     messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
//     messages.forEach(displayMessage);
//   });
// }

// // ✅ Send message
// function sendMessage(text, imageBase64) {
//   debugger;
//   if (!selectedUserId) {
//     alert('Please select a user to chat with.');
//     return;
//   }

//   const timestamp = new Date().toISOString();
//   const message = {
//     text,
//     imageBase64: imageBase64 || '',
//     sender: 'admin',
//     timestamp
//   };

//   // Firebase
//   database.ref(`messages/${selectedUserId}`).push(message)
//     .then(() => {
//       messageInput.value = '';
//       fileInput.value = '';
//       displayMessage(message);
//     })
//     .catch(err => console.error('Error sending message:', err));

//   // Real-time
//   socket.emit('admin message', { ...message, userId: selectedUserId });
// }


// // ✅ Handle Send button click
// // ✅ Handle Send button click
// function handleSend() {
//   const text = messageInput.value.trim();
//   const file = fileInput.files[0];

//   // Make sure there's something to send
//   if (!text && !file) {
//     alert('Cannot send an empty message.');
//     return;
//   }

//   // If it's an image, read it first
//   if (file) {
//     if (!file.type.startsWith('image/')) {
//       alert('Only image files are allowed!');
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) { // 5 MB
//       alert('Please upload images smaller than 5MB.');
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = () => {
//       sendMessage(text, reader.result);
//     };
//     reader.readAsDataURL(file);

//   // Otherwise just send the text
//   } else {
//     sendMessage(text, null);
//   }
// }

// // wire it up
// sendBtn.addEventListener('click', handleSend);
// messageInput.addEventListener('keydown', e => {
//   if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault();
//     handleSend();
//   }
// });
