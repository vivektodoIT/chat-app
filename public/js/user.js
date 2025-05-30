// public/js/user.js

// ─────────────────────────────────────────────────────────────────────────────
// DOM refs
const messagesEl = document.getElementById('messages');
const msgInput   = document.getElementById('message');
const sendBtn    = document.getElementById('sendBtn');
const fileInput  = document.getElementById('imageInput');
const cancelBtn  = document.getElementById('cancelImage');

let userKey = localStorage.getItem('userKey');

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ On load: decide if we need to ask for email, or go straight to chat
document.addEventListener('DOMContentLoaded', () => {
  if (!userKey) {
    // no email stored → show welcome and enter‐email mode
    renderMessage({
      sender:    'admin',
      text:      'Welcome! Please enter your Email ID to join the chat.',
      timestamp: Date.now()
    });
    enterEmailMode();
  } else {
    // already have a key → initialize chat as normal
    initChat();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ Switch UI into “enter email” mode
function enterEmailMode() {
  // hide file + cancel, switch placeholder + button text
  fileInput.style.display      = 'none';
  cancelBtn.style.display      = 'none';
  msgInput.placeholder         = 'Enter your email…';
  sendBtn.textContent          = 'Join Chat';

  // bind the NEW handler
  sendBtn.removeEventListener('click', sendMessage);
  sendBtn.addEventListener('click', captureEmail);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ Validate & persist the email when they click “Join Chat”
function captureEmail() {
  const raw = msgInput.value.trim();
  if (!raw || !raw.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }

  // sanitize into Firebase path key (dots → commas)
  userKey = raw.toLowerCase().replace(/\./g, ',');
  localStorage.setItem('userKey', userKey);

  // restore UI to chat mode
  msgInput.value           = '';
  msgInput.placeholder     = 'Type a message…';
  sendBtn.textContent      = 'Send';
  fileInput.style.display  = '';
  cancelBtn.style.display  = 'none';

  sendBtn.removeEventListener('click', captureEmail);
  sendBtn.addEventListener('click', sendMessage);

  initChat();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣ After we have userKey, wire up socket + fetch history
function initChat() {
  // 4a) join room
  socket.emit('join', userKey);

  // 4b) fetch & render history
  fetchAndRenderMessages();

  // 4c) hook up image handlers if not already
  fileInput.addEventListener('change', handleImageSelect);
  cancelBtn.addEventListener('click', cancelImage);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5️⃣ Fetch this user’s previous messages
async function fetchAndRenderMessages() {
  try {
    const res  = await fetch(`/messages/${encodeURIComponent(userKey)}`);
    const msgs = await res.json();
    messagesEl.innerHTML = '';  // clear the “enter email” bubble
    msgs.forEach(renderMessage);
    scrollToBottom();
  } catch (err) {
    console.error('Fetch messages failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6️⃣ Render a single bubble (works for both admin & user)
function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message ' + (msg.sender === 'user'
    ? 'user-message'
    : 'admin-message');

  div.innerHTML = `
    <div class="bubble">
      ${msg.text        ? `<p>${msg.text}</p>` : ''}
      ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ''}
      <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      })}</div>
    </div>
  `;
  messagesEl.appendChild(div);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: keep scroll at bottom
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7️⃣ Socket.IO real-time
const socket = io();
socket.on('connect', () => console.log('Socket connected as', socket.id));
socket.on('chat message', msg => {
  // only render if we’re in chat mode (i.e. after capturing email)
  if (userKey) {
    renderMessage(msg);
    scrollToBottom();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8️⃣ Sending a message (unchanged from your previous code)
async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text && !selectedImageBase64) {
    alert('Cannot send empty message.');
    return;
  }

  const payload = {
    userKey,
    sender:      'user',
    text,
    imageBase64: selectedImageBase64
  };

  try {
    const resp = await fetch('/send', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify(payload)
    });
    if (resp.ok) {
      msgInput.value = '';
      cancelImage();
    }
  } catch (err) {
    console.error('Send failed:', err);
  }
}

// 9️⃣ Image & cancel (unchanged from your previous code)
let selectedImageBase64 = '';
function handleImageSelect() {
  const f = fileInput.files[0];
  if (!f || !f.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    selectedImageBase64 = reader.result;
    cancelBtn.style.display = 'inline-block';
  };
  reader.readAsDataURL(f);
}
function cancelImage() {
  selectedImageBase64 = '';
  fileInput.value = '';
  cancelBtn.style.display = 'none';
}

// wire up sendBtn for the case where userKey already existed
sendBtn.addEventListener('click', sendMessage);




















//                                                                                                  second
// // public/js/user.js

// // ————————————————————————————————
// // 0️⃣ Sanity check: this should immediately fire in your console
// console.log("👋 user.js loaded; forcing email prompt");
// localStorage.removeItem('email');  // only for testing; remove this line once prompt works
// // ————————————————————————————————

// // 1️⃣ Prompt once for a valid email, then store it
// let rawEmail = localStorage.getItem('email');
// if (!rawEmail) {
//   rawEmail = prompt("👋 Welcome! Please enter your email to start chatting:");
//   if (!rawEmail || !rawEmail.includes("@")) {
//     alert("❌ A valid email is required.");
//     throw new Error("Invalid email");
//   }
//   localStorage.setItem("email", rawEmail);
// }

// // sanitize email → Firebase key (dots → commas)
// function emailKey(e) {
//   return e.trim().toLowerCase().replace(/\./g, ",");
// }
// const userEmail = rawEmail;
// const userKey   = emailKey(userEmail);

// console.log("🔑 Chatting as:", userEmail, "→ key:", userKey);

// // update URL so you see it reflected
// window.history.replaceState(null, "", `/user?uid=${encodeURIComponent(userKey)}`);

// // 2️⃣ Firebase init (hard-coded, no process.env here)
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
// socket.on("connect", () => {
//   console.log("✅ socket.io connected as", socket.id);
//   socket.emit("join", userKey);
// });

// // 4️⃣ State for image attachments
// let selectedImageBase64 = "";

// // 5️⃣ On load, fetch and render existing messages
// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     const res  = await fetch(`/messages/${encodeURIComponent(userKey)}`);
//     const msgs = await res.json();
//     console.log("Messages loaded:", msgs);
//     msgs.forEach(addMessage);
//     scrollToBottom();
//   } catch (err) {
//     console.error("❌ Fetch messages failed:", err);
//   }
// });

// // 6️⃣ Render a single message bubble
// function addMessage(msg) {
//   const li     = document.createElement("li");
//   const isUser = msg.sender === "user";
//   li.className = `message ${isUser ? "user-message" : "admin-message"}`;
//   li.innerHTML = `
//     <div class="bubble">
//       ${msg.text ? `<p>${msg.text}</p>` : ""}
//       ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ""}
//       <div class="timestamp">
//         <strong>${isUser ? "You" : "Support"}</strong>
//         <span>${formatTime(msg.timestamp)}</span>
//       </div>
//     </div>
//   `;
//   document.getElementById("messages").appendChild(li);
// }

// // 7️⃣ Scroll helper
// function scrollToBottom() {
//   const c = document.getElementById("messages");
//   c.scrollTop = c.scrollHeight;
// }

// // 8️⃣ Format timestamps
// function formatTime(ts) {
//   return new Date(ts).toLocaleTimeString([], {
//     hour:   "2-digit",
//     minute: "2-digit"
//   });
// }

// // 9️⃣ Image file selection
// document.getElementById("imageInput").addEventListener("change", () => {
//   const f = document.getElementById("imageInput").files[0];
//   if (!f || !f.type.startsWith("image/")) return;
//   const reader = new FileReader();
//   reader.onloadend = () => {
//     selectedImageBase64 = reader.result;
//     document.getElementById("cancelImage").style.display = "inline-block";
//   };
//   reader.readAsDataURL(f);
// });

// // 🔟 Cancel image
// document.getElementById("cancelImage").addEventListener("click", () => {
//   selectedImageBase64 = "";
//   document.getElementById("imageInput").value = "";
//   document.getElementById("cancelImage").style.display = "none";
// });

// // 1️⃣1️⃣ Send message
// async function sendMessage() {
//   const text = document.getElementById("message").value.trim();
//   if (!text && !selectedImageBase64) {
//     alert("Cannot send empty message.");
//     return;
//   }

//   const payload = {
//     userKey,
//     sender:      "user",
//     text,
//     imageBase64: selectedImageBase64,
//     email:       userEmail
//   };

//   try {
//     const resp = await fetch("/send", {
//       method:  "POST",
//       headers: {"Content-Type":"application/json"},
//       body:    JSON.stringify(payload)
//     });
//     if (resp.ok) {
//       document.getElementById("message").value = "";
//       selectedImageBase64 = "";
//       document.getElementById("cancelImage").style.display = "none";
//     }
//   } catch (err) {
//     console.error("❌ Send failed:", err);
//   }
// }
// document.getElementById("sendBtn").addEventListener("click", sendMessage);

// // 1️⃣2️⃣ Real-time incoming
// socket.on("chat message", msg => {
//   addMessage(msg);
//   scrollToBottom();
// });
















//                                                                                            first

// console.log("👋 user.js v2 loaded — clearing old 'email' to force prompt");
// localStorage.removeItem('email');  // remove any stale email so you always get the prompt



// require('dotenv').config();

// // 1️⃣ Prompt once for a valid email, then sanitize into a Firebase-safe key
// let rawEmail = localStorage.getItem('email');
// if (!rawEmail) {
//   rawEmail = prompt("Welcome! Please enter your email:");
//   if (!rawEmail || !rawEmail.includes('@')) {
//     alert("A valid email is required to chat.");
//     throw new Error("Invalid email");
//   }
//   localStorage.setItem('email', rawEmail);
// }

// // sanitize: replace “.” → “,” so it works as a Firebase path
// function emailKey(e) {
//   return encodeURIComponent(e.trim().toLowerCase())
//            .replace(/\./g, ',');
// }
// function emailFromKey(k) {
//   return decodeURIComponent(k).replace(/,/g, '.');
// }

// const userEmail = rawEmail;
// const userKey   = emailKey(userEmail);
// console.log("🔑 Email:", userEmail, "→ userKey:", userKey);

// // update URL so you can see it, e.g. /user?uid=foo%40bar,com
// window.history.replaceState(
//   null, '', `/user?uid=${encodeURIComponent(userKey)}`
// );


// // ─────────────────────────────────────────────────────────────────────────────
// // 2️⃣ Firebase init
// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.FIREBASE_DATABASE_URL,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID,
//   measurementId: process.env.FIREBASE_MEASUREMENT_ID
// };

// firebase.initializeApp(firebaseConfig);

// // ─────────────────────────────────────────────────────────────────────────────
// // 3️⃣ Socket.IO connect & join your room
// const socket = io();
// socket.on('connect', () => {
//   console.log('✅ Socket connected as', socket.id);
//   socket.emit('join', userKey);
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // 4️⃣ State for image attachments
// let selectedImageBase64 = '';


// // ─────────────────────────────────────────────────────────────────────────────
// // 5️⃣ Fetch & render existing messages ONCE on load
// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     const res  = await fetch(`/messages/${encodeURIComponent(userKey)}`);
//     const msgs = await res.json();
//     msgs.forEach(addMessage);
//     scrollToBottom();
//   } catch (err) {
//     console.error("Fetch messages failed:", err);
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // 6️⃣ Render a single message bubble
// function addMessage(msg) {
//   const li     = document.createElement('li');
//   const isUser = msg.sender === 'user';
//   li.className = `message ${isUser ? 'user-message' : 'admin-message'}`;

//   li.innerHTML = `
//     <div class="bubble">
//       ${msg.text ? `<p>${msg.text}</p>` : ''}
//       ${msg.imageBase64
//          ? `<img src="${msg.imageBase64}" />`
//          : ''}
//       <div class="timestamp">
//         <strong>${isUser ? 'You' : 'Support'}</strong>
//         <span>${formatTime(msg.timestamp)}</span>
//       </div>
//     </div>
//   `;

//   document.getElementById('messages').appendChild(li);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 7️⃣ Scroll helper
// function scrollToBottom() {
//   const c = document.getElementById('messages');
//   c.scrollTop = c.scrollHeight;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 8️⃣ Format timestamps
// function formatTime(ts) {
//   return new Date(ts).toLocaleTimeString([], {
//     hour:   '2-digit',
//     minute: '2-digit'
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 9️⃣ Image file selection
// document.getElementById('imageInput').addEventListener('change', () => {
//   const f = document.getElementById('imageInput').files[0];
//   if (!f || !f.type.startsWith('image/')) return;
//   const reader = new FileReader();
//   reader.onloadend = () => {
//     selectedImageBase64 = reader.result;
//     document.getElementById('cancelImage').style.display = 'inline-block';
//   };
//   reader.readAsDataURL(f);
// });

// // 🔟 Cancel selected image
// document.getElementById('cancelImage').addEventListener('click', () => {
//   selectedImageBase64 = '';
//   document.getElementById('imageInput').value = '';
//   document.getElementById('cancelImage').style.display = 'none';
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // 1️⃣1️⃣ Send a new message
// async function sendMessage() {
//   const text = document.getElementById('message').value.trim();
//   if (!text && !selectedImageBase64) {
//     alert('Cannot send empty message.');
//     return;
//   }

//   const payload = {
//     userKey     : userKey,
//     sender     : 'user',
//     text,
//     imageBase64: selectedImageBase64,
//     email      : userEmail      // raw email included for admin
//   };

//   try {
//     const resp = await fetch('/send', {
//       method : 'POST',
//       headers: {'Content-Type':'application/json'},
//       body   : JSON.stringify(payload)
//     });
//     if (resp.ok) {
//       document.getElementById('message').value = '';
//       selectedImageBase64 = '';
//       document.getElementById('cancelImage').style.display = 'none';
//     }
//   } catch (err) {
//     console.error("Send failed:", err);
//   }
// }
// document.getElementById('sendBtn').addEventListener('click', sendMessage);

// // ─────────────────────────────────────────────────────────────────────────────
// // 1️⃣2️⃣ Real-time incoming
// socket.on('chat message', msg => {
//   addMessage(msg);
//   scrollToBottom();
// });
















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







