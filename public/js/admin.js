require('dotenv').config();

// ─── Helpers to map between real email and Firebase key ───
function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ',');
}
function emailFromKey(key) {
  return key.replace(/,/g, '.');
}



// ✅ Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};


firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const userButtonsContainer = document.getElementById('userButtons');

// Load list of users from Firebase and display on the left
database.ref('messages').once('value', snapshot => {
  usersSidebar.innerHTML = '';
  snapshot.forEach(child => {
    const key   = child.key;           // the sanitized email‐key
    const email = emailFromKey(key);   // turn commas back to dots
    const btn   = document.createElement('button');
    btn.classList.add('user-btn');
    btn.textContent = email;
    btn.onclick     = () => loadMessagesForUser(key);
    usersSidebar.appendChild(btn);
  });
});



// ✅ Load messages of selected user
function loadMessagesForUser(userKey) {
  selectedUserKey = userKey;                // remember who’s selected
  messagesEl.innerHTML = '';                // clear old
  const userRef = database.ref(`messages/${userKey}`);
  userRef.once('value', snap => {
    const msgs = [];
    snap.forEach(child => msgs.push(child.val()));
    // sort by timestamp
    msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    msgs.forEach(displayMessage);
  });
}




const socket = io();
socket.on('connect', () => {
  console.log('✅ Admin socket connected');
});

socket.on('chat message', (data) => {
  console.log('message is MV', data);
  alert('message received');
});

// ✅ DOM elements
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');
const usersSidebar = document.getElementById('usersList');

let selectedUserKey = userKey; // Stores the currently selected user's ID

// ✅ Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ✅ Format timestamp
function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ✅ Display a message
function displayMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(message.sender === 'admin' ? 'admin-message' : 'user-message');

   // show the message.text, not the whole object
  let innerHTML = `<div>${escapeHtml(message.text || '')}</div>`;
  if (message.imageBase64) {
    innerHTML += `<img src="${message.imageBase64}" alt="image" style="max-width: 200px; display: block; margin-top: 5px;" />`;
  }
  if (message.timestamp) {
    innerHTML += `<small style="display: block; margin-top: 5px;">${formatTime(message.timestamp)}</small>`;
  }

  messageDiv.innerHTML = innerHTML;
  messagesEl.appendChild(messageDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ✅ Load users in sidebar
function loadUsers() {
  const usersRef = database.ref('messages');
  usersRef.once('value', snapshot => {
    usersSidebar.innerHTML = ''; // clear previous
    snapshot.forEach(child => {
      const userId = child.key;
      const btn = document.createElement('button');
      btn.classList.add('user-btn');
      btn.textContent = userId;
      btn.onclick = () => loadMessagesForUser(userId);
      usersSidebar.appendChild(btn);
    });
  });
}

// ✅ Load messages of selected user
function loadMessagesForUser(userId) {
  selectedUserKey = userId;
  messagesEl.innerHTML = '';
  const userRef = database.ref(`messages/${userId}`);
  userRef.once('value', snap => {
    const messages = [];
    snap.forEach(child => {
      messages.push(child.val());
    });
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    messages.forEach(displayMessage);
  });
}

// ✅ Send message
function sendMessage(text, imageBase64) {
  debugger;
  if (!selectedUserKey) {
    alert('Please select a user to chat with.');
    return;
  }

  const timestamp = new Date().toISOString();
  const message = {
    text,
    imageBase64: imageBase64 || '',
    sender: 'admin',
    timestamp
  };

  // Firebase
  database.ref(`messages/${selectedUserKey}`).push(message)
    .then(() => {
      messageInput.value = '';
      fileInput.value = '';
      displayMessage(message);
    })
    .catch(err => console.error('Error sending message:', err));

  // Real-time
  socket.emit('admin message', { ...message, userKey: selectedUserKey });
}


// ✅ Handle Send button click
// ✅ Handle Send button click
function handleSend() {
  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  // Make sure there's something to send
  if (!text && !file) {
    alert('Cannot send an empty message.');
    return;
  }

  // If it's an image, read it first
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5 MB
      alert('Please upload images smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(text, reader.result);
    };
    reader.readAsDataURL(file);

  // Otherwise just send the text
  } else {
    sendMessage(text, null);
  }
}

// wire it up
sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});













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
