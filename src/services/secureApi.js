import axios from 'axios';
import { secureStorage, generateCSRFToken, validateCSRFToken } from '@/utils/security';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://edu-master-delta.vercel.app',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Important for cookies, authorization headers with HTTPS
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token to headers for all non-GET requests
    if (config.method !== 'get' && config.method !== 'GET') {
      let csrfToken = secureStorage.get('csrfToken');
      if (!csrfToken) {
        csrfToken = generateCSRFToken();
        secureStorage.set('csrfToken', csrfToken);
      }
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Add auth token if exists
    const token = secureStorage.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.headers['X-Request-Timestamp'] = Date.now();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Check for CSRF token in response headers
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      secureStorage.set('csrfToken', csrfToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = secureStorage.get('refreshToken');
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh-token', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          secureStorage.set('authToken', token);
          secureStorage.set('refreshToken', newRefreshToken);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        secureStorage.remove('authToken');
        secureStorage.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle CSRF token errors
    if (error.response?.status === 419) {
      // Generate new CSRF token and retry
      const newCsrfToken = generateCSRFToken();
      secureStorage.set('csrfToken', newCsrfToken);
      originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Wrapper for GET requests with security enhancements
 * @param {string} url - The API endpoint
 * @param {Object} params - Query parameters
 * @param {Object} config - Additional axios config
 * @returns {Promise} The API response
 */
export const secureGet = async (url, params = {}, config = {}) => {
  try {
    const response = await apiClient.get(url, { params, ...config });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Wrapper for POST requests with security enhancements
 * @param {string} url - The API endpoint
 * @param {Object} data - The request payload
 * @param {Object} config - Additional axios config
 * @returns {Promise} The API response
 */
export const securePost = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Wrapper for PUT requests with security enhancements
 * @param {string} url - The API endpoint
 * @param {Object} data - The request payload
 * @param {Object} config - Additional axios config
 * @returns {Promise} The API response
 */
export const securePut = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Wrapper for DELETE requests with security enhancements
 * @param {string} url - The API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise} The API response
 */
export const secureDelete = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Handles API errors consistently
 * @param {Error} error - The error object
 */
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside 2xx
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        console.error('Bad Request:', data.message || 'Invalid request');
        break;
      case 401:
        console.error('Unauthorized: Please log in again');
        secureStorage.remove('authToken');
        secureStorage.remove('refreshToken');
        window.location.href = '/login';
        break;
      case 403:
        console.error('Forbidden: You do not have permission');
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 429:
        console.error('Too many requests. Please try again later.');
        break;
      case 500:
        console.error('Server error. Please try again later.');
        break;
      default:
        console.error('An error occurred:', error.message);
    }
  } else if (error.request) {
    // Request was made but no response received
    console.error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request
    console.error('Request error:', error.message);
  }
};

export default {
  get: secureGet,
  post: securePost,
  put: securePut,
  delete: secureDelete,
  setAuthToken: (token) => {
    secureStorage.set('authToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  clearAuth: () => {
    secureStorage.remove('authToken');
    secureStorage.remove('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
  },
};
