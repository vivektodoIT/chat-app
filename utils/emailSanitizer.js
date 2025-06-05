// utils/emailSanitizer.js
/**
 * Utilities for converting between email addresses and Firebase-safe keys
 */

const emailToKey = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided');
  }
  return email.trim().toLowerCase().replace(/\./g, ',');
};

const keyToEmail = (key) => {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid key provided');
  }
  return key.replace(/,/g, '.');
};

// Legacy function names for backward compatibility
const emailKey = emailToKey;
const emailFromKey = keyToEmail;

module.exports = {
  emailToKey,
  keyToEmail,
  emailKey,      // Keep old name for compatibility
  emailFromKey   // Keep old name for compatibility
};