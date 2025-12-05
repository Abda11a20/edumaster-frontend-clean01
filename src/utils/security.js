/**
 * Security utility functions for the application
 */

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return '';
  
  // Remove any potentially dangerous characters
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates if a string is a valid URL
 * @param {string} string - The string to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Validates if a string is a valid email
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email, false otherwise
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Generates a CSRF token
 * @returns {string} A random CSRF token
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validates a CSRF token
 * @param {string} token - The token to validate
 * @returns {boolean} True if token is valid, false otherwise
 */
export const validateCSRFToken = (token) => {
  if (!token) return false;
  const storedToken = localStorage.getItem('csrfToken');
  return token === storedToken;
};

/**
 * Securely stores data in localStorage
 * @param {string} key - The key to store the data under
 * @param {any} value - The value to store
 * @param {number} ttl - Time to live in milliseconds
 */
export const secureStorage = {
  set: (key, value, ttl = 3600000) => {
    try {
      const now = new Date();
      const item = {
        value: JSON.stringify(value),
        expiry: now.getTime() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Error setting secure storage:', error);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return JSON.parse(item.value);
    } catch (error) {
      console.error('Error getting from secure storage:', error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from secure storage:', error);
      return false;
    }
  }
};

/**
 * Sanitizes HTML content to prevent XSS
 * @param {string} html - The HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Validates user input against a whitelist of allowed characters
 * @param {string} input - The input to validate
 * @param {string} type - The type of validation to perform (alphanumeric, numeric, email, etc.)
 * @returns {boolean} True if input is valid, false otherwise
 */
export const validateInput = (input, type = 'alphanumeric') => {
  if (typeof input !== 'string') return false;
  
  const patterns = {
    alphanumeric: /^[a-zA-Z0-9\s\u0600-\u06FF]*$/, // Supports Arabic and English letters, numbers, and spaces
    numeric: /^[0-9]*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+\d\s-()]*$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  };
  
  const pattern = patterns[type] || patterns.alphanumeric;
  return pattern.test(input);
};

/**
 * Hashes a string using SHA-256
 * @param {string} message - The string to hash
 * @returns {Promise<string>} The hashed string
 */
export const hashString = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default {
  sanitizeInput,
  isValidUrl,
  isValidEmail,
  generateCSRFToken,
  validateCSRFToken,
  secureStorage,
  sanitizeHTML,
  validateInput,
  hashString
};
