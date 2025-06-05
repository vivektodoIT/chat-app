// utils/validator.js
/**
 * Input validation utilities
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidMessage = (text, imageBase64) => {
  if (!text && !imageBase64) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (text && text.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  return { valid: true };
};

const sanitizeInput = (text) => {
  if (!text) return '';
  // Basic XSS prevention - remove script tags
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const isValidUserKey = (userKey) => {
  return userKey && typeof userKey === 'string' && userKey.trim().length > 0;
};

module.exports = {
  isValidEmail,
  isValidMessage,
  sanitizeInput,
  isValidUserKey
};