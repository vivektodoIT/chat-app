// vivek 

require('dotenv').config();

// 1️⃣ Prompt once for a valid email, then sanitize into a Firebase-safe key
let rawEmail = localStorage.getItem('email');
if (!rawEmail) {
  rawEmail = prompt("Welcome! Please enter your email:");
  if (!rawEmail || !rawEmail.includes('@')) {
    alert("A valid email is required to chat.");
    throw new Error("Invalid email");
  }
  localStorage.setItem('email', rawEmail);
}

// sanitize: replace “.” → “,” so it works as a Firebase path
function emailKey(e) {
  return encodeURIComponent(e.trim().toLowerCase())
           .replace(/\./g, ',');
}
function emailFromKey(k) {
  return decodeURIComponent(k).replace(/,/g, '.');
}

const userEmail = rawEmail;
const userKey   = emailKey(userEmail);
console.log("🔑 Email:", userEmail, "→ userKey:", userKey);

// update URL so you can see it, e.g. /user?uid=foo%40bar,com
window.history.replaceState(
  null, '', `/user?uid=${encodeURIComponent(userKey)}`
);


// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ Firebase init
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

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ Socket.IO connect & join your room
const socket = io();
socket.on('connect', () => {
  console.log('✅ Socket connected as', socket.id);
  socket.emit('join', userKey);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣ State for image attachments
let selectedImageBase64 = '';


// ─────────────────────────────────────────────────────────────────────────────
// 5️⃣ Fetch & render existing messages ONCE on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res  = await fetch(`/messages/${encodeURIComponent(userKey)}`);
    const msgs = await res.json();
    msgs.forEach(addMessage);
    scrollToBottom();
  } catch (err) {
    console.error("Fetch messages failed:", err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6️⃣ Render a single message bubble
function addMessage(msg) {
  const li     = document.createElement('li');
  const isUser = msg.sender === 'user';
  li.className = `message ${isUser ? 'user-message' : 'admin-message'}`;

  li.innerHTML = `
    <div class="bubble">
      ${msg.text ? `<p>${msg.text}</p>` : ''}
      ${msg.imageBase64
         ? `<img src="${msg.imageBase64}" />`
         : ''}
      <div class="timestamp">
        <strong>${isUser ? 'You' : 'Support'}</strong>
        <span>${formatTime(msg.timestamp)}</span>
      </div>
    </div>
  `;

  document.getElementById('messages').appendChild(li);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7️⃣ Scroll helper
function scrollToBottom() {
  const c = document.getElementById('messages');
  c.scrollTop = c.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8️⃣ Format timestamps
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit'
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 9️⃣ Image file selection
document.getElementById('imageInput').addEventListener('change', () => {
  const f = document.getElementById('imageInput').files[0];
  if (!f || !f.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    selectedImageBase64 = reader.result;
    document.getElementById('cancelImage').style.display = 'inline-block';
  };
  reader.readAsDataURL(f);
});

// 🔟 Cancel selected image
document.getElementById('cancelImage').addEventListener('click', () => {
  selectedImageBase64 = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('cancelImage').style.display = 'none';
});

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣1️⃣ Send a new message
async function sendMessage() {
  const text = document.getElementById('message').value.trim();
  if (!text && !selectedImageBase64) {
    alert('Cannot send empty message.');
    return;
  }

  const payload = {
    userKey     : userKey,
    sender     : 'user',
    text,
    imageBase64: selectedImageBase64,
    email      : userEmail      // raw email included for admin
  };

  try {
    const resp = await fetch('/send', {
      method : 'POST',
      headers: {'Content-Type':'application/json'},
      body   : JSON.stringify(payload)
    });
    if (resp.ok) {
      document.getElementById('message').value = '';
      selectedImageBase64 = '';
      document.getElementById('cancelImage').style.display = 'none';
    }
  } catch (err) {
    console.error("Send failed:", err);
  }
}
document.getElementById('sendBtn').addEventListener('click', sendMessage);

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣2️⃣ Real-time incoming
socket.on('chat message', msg => {
  addMessage(msg);
  scrollToBottom();
});












// ─────────────────────────────────────────────────────────────────────────────from here 

// // 1️⃣ Grab userId from query string
// const urlParams = new URLSearchParams(window.location.search);
// const userId    = urlParams.get('uid');
// if (!userId) {
//   alert('❌ Missing ?uid=your_user_id in URL');
//   throw new Error('No userId provided');
// }



// // 2️⃣ Init Firebase
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

// // 3️⃣ Socket.IO — connect & join your room
// const socket = io();
// socket.on('connect', () => {
//   console.log('✅ Socket connected on user side:', socket.id);
//   socket.emit('join', userId);
// });

// // 4️⃣ State for image
// let selectedImageBase64 = '';

// // 5️⃣ Fetch & render existing messages ONCE on page load
// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     // ← FIXED: wrap URL in backticks
//     const response = await fetch(`/messages/${userId}`);
//     const messages = await response.json();
//     messages.forEach(addMessage);
//     scrollToBottom();
//     console.log('Messages fetched:', messages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//   }
// });

// // 6️⃣ Render a single message bubble
// function addMessage(message) {
//   const li = document.createElement('li');
//   const isUser = message.sender === 'user';

//   // ← FIXED: proper template string for className
//   li.className = `message ${isUser ? 'user-message' : 'admin-message'}`;

//   // ← FIXED: wrap innerHTML in backticks
//   li.innerHTML = `
//     <div class="bubble ${isUser ? 'user' : 'admin'}">
//       ${message.text ? `<p>${message.text}</p>` : ''}
//       ${message.imageBase64 ? `<img src="${message.imageBase64}" />` : ''}
//       <div class="timestamp">${formatTime(message.timestamp)}</div>
//     </div>
//   `;

//   document.getElementById('messages').appendChild(li);
// }

// // 7️⃣ Scroll helper
// function scrollToBottom() {
//   const c = document.getElementById('messages');
//   c.scrollTop = c.scrollHeight;
// }

// // 8️⃣ Timestamp formatting
// function formatTime(timestamp) {
//   return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// // 9️⃣ Image selection
// function handleImageSelect() {
//   const f = document.getElementById('imageInput').files[0];
//   if (!f || !f.type.startsWith('image/')) return;
//   const reader = new FileReader();
//   reader.onloadend = () => {
//     selectedImageBase64 = reader.result;
//     document.getElementById('cancelImage').style.display = 'inline';
//   };
//   reader.readAsDataURL(f);
// }

// // 🔟 Cancel image
// function cancelImage() {
//   selectedImageBase64 = '';
//   document.getElementById('imageInput').value = '';
//   document.getElementById('cancelImage').style.display = 'none';
// }

// // 1️⃣1️⃣ Send message
// async function sendMessage() {
//   const text = document.getElementById('message').value.trim();
//   if (!text && !selectedImageBase64) {
//     alert('Empty message not allowed.');
//     return;
//   }

//   const payload = { userId, sender: 'user', text, imageBase64: selectedImageBase64 };
//   try {
//     const response = await fetch('/send', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
//     if (response.ok) {
//       document.getElementById('message').value = '';
//       cancelImage();
//     }
//   } catch (error) {
//     console.error('Error sending message:', error);
//   }
// }

// // 1️⃣2️⃣ Real-time incoming
// socket.on('chat message', msg => {
//   addMessage(msg);
//   scrollToBottom();
// });

// // 1️⃣3️⃣ Hook up the Send button
// document.getElementById('sendBtn').addEventListener('click', sendMessage);

// to here 







