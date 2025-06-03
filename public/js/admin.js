// ─── Helpers to sanitize email ↔ Firebase key ────────────────────────────────                 
function emailFromKey(key) {
  return key.replace(/,/g, '.');
}

// ─── Firebase init (same config you already have) ────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBSCzfKZ2s3jE7CSyBlJiXwEkvQSOsjY54",
  authDomain: "chat-application-n.firebaseapp.com",
  databaseURL: "https://chat-application-n-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-application-n",
  storageBucket: "chat-application-n.appspot.com",
  messagingSenderId: "755206797335",
  appId: "1:755206797335:web:20c9cb1b8ed7e0bb7b4452",
  measurementId: "G-DLL61DHR1Q"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── DOM references ────────────────────────────────────────────────────────────
const usersSidebar = document.getElementById('usersList');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');

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
    hour: '2-digit',
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
      text: text || '',
      imageBase64: imgData || '',
      sender: 'admin',
      timestamp: new Date().toISOString()
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
