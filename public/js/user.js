// public/js/user.js                                                       

// ─────────────────────────────────────────────────────────────────────────────
// DOM refs
const messagesEl = document.getElementById('messages');
const msgInput = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('imageInput');
const cancelBtn = document.getElementById('cancelImage');

// Show/hide Send button when typing
msgInput.addEventListener('input', () => {
  const hasText = msgInput.value.trim().length > 0;
  if (hasText) {
    sendBtn.classList.add('show');
  } else {
    sendBtn.classList.remove('show');
  }
});


let userKey = localStorage.getItem('userKey');

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ On load: decide if we need to ask for email, or go straight to chat
document.addEventListener('DOMContentLoaded', () => {
  if (!userKey) {
    // no email stored → show welcome and enter‐email mode
    renderMessage({
      sender: 'admin',
      text: 'Welcome! Please enter your Email ID to join the chat.',
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
  fileInput.style.display = 'none';
  cancelBtn.style.display = 'none';
  msgInput.placeholder = 'Enter your email…';
  sendBtn.textContent = 'Join Chat';

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
  msgInput.value = '';
  msgInput.placeholder = 'Type a message…';
  sendBtn.textContent = 'Send';
  fileInput.style.display = '';
  cancelBtn.style.display = 'none';

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
    const res = await fetch(`/messages/${encodeURIComponent(userKey)}`);
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
let lastRenderedDate = null;  // track last date printed

// function renderMessage(msg) {
//   const messageDate = new Date(msg.timestamp).toDateString();
//   if (lastRenderedDate !== messageDate) {
//     lastRenderedDate = messageDate;
//     const dateDiv = document.createElement("div");
//     dateDiv.className = "chat-date-header";
//     dateDiv.textContent = formatFullDate(msg.timestamp);
//     messagesEl.appendChild(dateDiv);
//   }

//   const wrapper = document.createElement("div");
//   wrapper.className = "message-wrapper " + (msg.sender === "admin" ? "admin-wrapper" : "user-wrapper");

//   const bubble = document.createElement("div");
//   bubble.className = "message " + (msg.sender === "admin" ? "admin-message" : "user-message");

//   bubble.innerHTML = `
//     <div class="bubble">
//       ${msg.text ? `<p>${msg.text}</p>` : ""}
//       ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ""}
//       <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit"
//   })}</div>
//     </div>
//   `;

//   if (msg.sender === "admin") {
//     const avatar = document.createElement("img");
//     avatar.src = "/images/admin-avatar.png"; // Replace with your actual path
//     avatar.alt = "Admin";
//     avatar.className = "avatar";
//     wrapper.appendChild(avatar);
//   }

//   wrapper.appendChild(bubble);
//   messagesEl.appendChild(wrapper);
// }
function renderMessage(msg) {
  const messageDate = new Date(msg.timestamp).toDateString();
  if (lastRenderedDate !== messageDate) {
    lastRenderedDate = messageDate;
    const dateDiv = document.createElement("div");
    dateDiv.className = "chat-date-header";
    dateDiv.textContent = formatFullDate(msg.timestamp);
    messagesEl.appendChild(dateDiv);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper " + (msg.sender === "admin" ? "admin-wrapper" : "user-wrapper");

  const bubble = document.createElement("div");
  bubble.className = "message " + (msg.sender === "admin" ? "admin-message" : "user-message");

  // 🕓 Add title for hover info
  const now = new Date();
  const sentTime = new Date(msg.timestamp);
  const diffHours = Math.floor((now - sentTime) / (1000 * 60 * 60));
  let hoverText;

  if (diffHours < 24) {
    hoverText = `${diffHours === 0 ? "Just now" : `${diffHours} Hour${diffHours > 1 ? "s" : ""} Ago`}`;
  } else {
    hoverText = formatFullDate(msg.timestamp); // already in your code
  }

  // Assign hover effect
  // bubble.title = hoverText;
  bubble.setAttribute('data-hover', hoverText);


  bubble.innerHTML = `
    <div class="bubble">
      ${msg.text ? `<p>${msg.text}</p>` : ""}
      ${msg.imageBase64 ? `<img src="${msg.imageBase64}" />` : ""}
    </div>
  `;

  if (msg.sender === "admin") {
    const avatar = document.createElement("img");
    avatar.src = "/images/admin-avatar.png";
    avatar.alt = "Admin";
    avatar.className = "avatar";
    wrapper.appendChild(avatar);
  }

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
}






function formatFullDate(ts) {
  const dateObj = new Date(ts);
  const options = { weekday: 'long', day: 'numeric', month: 'long'/*, year: 'numeric'*/ };
  return dateObj.toLocaleDateString(undefined, options);
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
    sender: 'user',
    text,
    imageBase64: selectedImageBase64
  };

  try {
    const resp = await fetch('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
// allow Enter key to send message
msgInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

