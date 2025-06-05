// admin.js - Updated to use backend APIs instead of direct Firebase

// ─── Helpers to sanitize email ↔ Firebase key ────────────────────────────────
function emailFromKey(key) {
  return key.replace(/,/g, '.');
}

// ─── DOM references ────────────────────────────────────────────────────────────
const usersSidebar = document.getElementById('usersList');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');

let selectedUserKey = null;  // The Firebase‐sanitized key of the currently‐open user

// ─── 1) Load sidebar user list from backend API ─────────────────────────────────
// Returns a Promise that resolves to "firstKey" if at least one user exists.
async function loadUserList() {
  try {
    // Use backend API instead of direct Firebase
    const response = await fetch('/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const userKeys = await response.json();
    usersSidebar.innerHTML = '';      // remove any old buttons
    let firstKey = null;

    userKeys.forEach(key => {
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
  } catch (error) {
    console.error('Error loading user list:', error);
    alert('Failed to load user list. Please refresh the page.');
    return null;
  }
}

// ─── 2) Load all messages for "userKey" and render them ──────────────────────
async function loadMessagesForUser(userKey) {
  selectedUserKey = userKey;
  messagesEl.innerHTML = '';  // clear the right‐side chat

  try {
    // Use backend API instead of direct Firebase
    const response = await fetch(`/messages/${encodeURIComponent(userKey)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const messages = await response.json();
    
    // Sort by timestamp ascending (backend should do this, but just in case)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Render each message bubble
    messages.forEach(displayMessage);
    
    // Highlight selected user in sidebar
    updateSelectedUser();
  } catch (error) {
    console.error('Error loading messages:', error);
    messagesEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">Failed to load messages for this user.</div>';
  }
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

// ─── 4) Handle "Send" (admin typing a new message) ───────────────────────────
async function handleSend() {
  if (!selectedUserKey) {
    return alert('Please select a user first.');
  }

  const text = messageInput.value.trim();
  const file = fileInput.files[0];
  if (!text && !file) {
    return alert('Cannot send an empty message.');
  }

  // Disable send button temporarily
  sendBtn.disabled = true;
  const originalText = sendBtn.textContent;
  sendBtn.textContent = 'Sending...';

  try {
    if (file) {
      // Handle file upload
      if (!file.type.startsWith('image/')) {
        throw new Error('Only images allowed.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Max 5MB.');
      }
      
      // Convert file to base64
      const imageBase64 = await fileToBase64(file);
      await sendMessageToBackend(text, imageBase64);
    } else {
      // Send text only
      await sendMessageToBackend(text, '');
    }

    // Clear inputs after successful send
    messageInput.value = '';
    fileInput.value = '';
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message: ' + error.message);
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;
  }
}

// ─── Helper function to send message to backend ───────────────────────────────
async function sendMessageToBackend(text, imageBase64) {
  const messageData = {
    userKey: selectedUserKey,
    text: text || '',
    imageBase64: imageBase64 || '',
    sender: 'admin'
  };

  const response = await fetch('/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || 'Failed to send message');
  }

  // Display message immediately (optimistic update)
  const msg = {
    text: messageData.text,
    imageBase64: messageData.imageBase64,
    sender: 'admin',
    timestamp: new Date().toISOString()
  };
  displayMessage(msg);
}

// ─── Helper function to convert file to base64 ────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// ─── Helper function to highlight selected user ───────────────────────────────
function updateSelectedUser() {
  // Remove active class from all user buttons
  const userButtons = usersSidebar.querySelectorAll('.user-btn');
  userButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected user
  const selectedBtn = Array.from(userButtons).find(btn => {
    const email = btn.textContent;
    const key = email.replace(/\./g, ',');
    return key === selectedUserKey;
  });
  
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
}

// ─── 5) Wire up Socket.IO for real-time "chat message" events ────────────────
const socket = io();
socket.on('connect', () => {
  console.log('Admin socket connected');
  // Join admin room to receive all messages
  socket.emit('join', 'admins');
});

// Whenever *any* new message arrives, we'll get "chat message" here.
// If it belongs to the currently open user, immediately append it:
socket.on('chat message', data => {
  if (data.userKey === selectedUserKey) {
    displayMessage(data);
  }
  
  // Update user list to show new activity (optional enhancement)
  updateUserActivityIndicator(data.userKey);
});

// Handle connection status
socket.on('disconnect', () => {
  console.log('Admin socket disconnected');
  showConnectionStatus('Disconnected', false);
});

socket.on('reconnect', () => {
  console.log('Admin socket reconnected');
  showConnectionStatus('Connected', true);
  socket.emit('join', 'admins');
});

// ─── 6) Enable Enter-key to send for the admin side ─────────────────────────
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// ─── 7) Additional helper functions ──────────────────────────────────────────

// Show connection status (optional)
function showConnectionStatus(status, isConnected) {
  // You can add a status indicator in your admin.html if desired
  console.log('Connection status:', status, isConnected);
}

// Update user activity indicator (optional)
function updateUserActivityIndicator(userKey) {
  const userButtons = usersSidebar.querySelectorAll('.user-btn');
  const userBtn = Array.from(userButtons).find(btn => {
    const email = btn.textContent;
    const key = email.replace(/\./g, ',');
    return key === userKey;
  });
  
  if (userBtn && userKey !== selectedUserKey) {
    // Add a visual indicator for new activity
    userBtn.classList.add('has-new-message');
    
    // Remove indicator after a short time
    setTimeout(() => {
      userBtn.classList.remove('has-new-message');
    }, 3000);
  }
}

// Handle image paste in message input
messageInput.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      // Set the file to the file input
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      
      // Show filename or preview
      console.log('Image pasted:', file.name);
      break;
    }
  }
});

// Auto-refresh user list periodically (optional)
setInterval(async () => {
  try {
    await loadUserList();
  } catch (error) {
    console.error('Error auto-refreshing user list:', error);
  }
}, 30000); // Refresh every 30 seconds

// ─── 8) Finally: on page load, build the sidebar → load the first user ───────
sendBtn.addEventListener('click', handleSend);

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const firstKey = await loadUserList();
    if (firstKey) {
      loadMessagesForUser(firstKey);
    } else {
      messagesEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">No users found. Users will appear here when they start chatting.</div>';
    }
  } catch (error) {
    console.error('Error initializing admin panel:', error);
    messagesEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: #f44336;">Failed to load admin panel. Please refresh the page.</div>';
  }
});