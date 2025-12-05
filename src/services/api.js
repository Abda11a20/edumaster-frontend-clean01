
/**
 * API Base URL configuration
 * @constant {string}
 */
const API_BASE_URL = 'https://edu-master-delta.vercel.app';

// Security configuration
const SECURITY_CONFIG = {
  MAX_RETRIES: 3,
  RATE_LIMIT_DELAY: 1000, // 1 second
  CSRF_HEADER: 'X-CSRF-Token',
  CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  X_FRAME_OPTIONS: 'DENY',
  X_XSS_PROTECTION: '1; mode=block',
};

// Secure token storage
const secureStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

/**
 * Get authentication headers with security enhancements
 * @returns {Object} Headers object with auth and security headers
 */
const getAuthHeaders = () => {
  const token = secureStorage.get('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': SECURITY_CONFIG.X_CONTENT_TYPE_OPTIONS,
    'X-Frame-Options': SECURITY_CONFIG.X_FRAME_OPTIONS,
    'X-XSS-Protection': SECURITY_CONFIG.X_XSS_PROTECTION,
    'Content-Security-Policy': SECURITY_CONFIG.CONTENT_SECURITY_POLICY,
    'Strict-Transport-Security': SECURITY_CONFIG.STRICT_TRANSPORT_SECURITY,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
    const csrfToken = secureStorage.get('csrfToken');
    if (csrfToken) {
      headers[SECURITY_CONFIG.CSRF_HEADER] = csrfToken;
    }
  }

  return headers;
};

/**
 * Handle API response with security checks
 * @param {Response} response - Fetch API response object
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} When response is not OK or security check fails
 */
const handleResponse = async (response) => {
  // Handle 404 responses
  if (response.status === 404) {
    return null;
  }

  // Handle unauthorized access
  if (response.status === 401) {
    secureStorage.remove('token');
    secureStorage.remove('csrfToken');
    throw new Error('Session expired. Please log in again.');
  }

  // Handle rate limiting (429 Too Many Requests)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 5;
    throw new Error(`Too many requests. Please try again after ${retryAfter} seconds.`);
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || errorData.error || `Connection error: ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  // Process successful response
  const data = await response.json();
  
  // Check for CSRF token in response headers and store it
  const csrfToken = response.headers.get('x-csrf-token');
  if (csrfToken) {
    secureStorage.set('csrfToken', csrfToken);
  }

  // Return the appropriate data structure
  return data.data || data.lessons || data.exams || data.questions || data.users || data.admins || data;
};

/**
 * Secure API request with retry logic and security enhancements
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry count (internal use)
 * @returns {Promise<any>} API response data
 */
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  // Input validation
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint');
  }

  // Sanitize endpoint to prevent XSS
  const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9-_?=&\/]/g, '');
  const url = `${API_BASE_URL}${sanitizedEndpoint}`;
  
  // Prepare request configuration
  const headers = getAuthHeaders();
  const config = {
    method: options.method || 'GET',
    headers: { ...headers, ...options.headers },
    credentials: 'same-origin',
    ...options
  };

  // Handle request body
  if (options.body) {
    if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body;
    }
  }

  try {
    // Add request delay for rate limiting
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.RATE_LIMIT_DELAY * (retryCount + 1)));
    }

    const response = await fetch(url, config);
    return await handleResponse(response);
    
  } catch (error) {
    // Handle session expiration
    if (error.message.includes('Session expired') || error.status === 401) {
      secureStorage.remove('token');
      secureStorage.remove('csrfToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Retry on network errors or 5xx responses
    if (retryCount < SECURITY_CONFIG.MAX_RETRIES &&
        (!error.status || (error.status >= 500 && error.status < 600))) {
      return apiRequest(endpoint, options, retryCount + 1);
    }

    throw error;
  }
};

// Security middleware for requests
const withSecurity = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log security-related errors
      if (error.status === 401 || error.status === 403) {
        console.warn('Security alert:', error.message);
      }
      throw error;
    }
  };
};

export const authAPI = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: credentials
    })
  },

  register: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: userData
    })
  },

  forgotPassword: async (email) => {
    return apiRequest('/user/forgot-password', {
      method: 'POST',
      body: { email }
    })
  },

  resetPassword: async (resetData) => {
    return apiRequest('/user/reset-password', {
      method: 'POST',
      body: resetData
    })
  },

  getProfile: async () => {
    const response = await apiRequest('/user/')
    return response.data || response
  },

  updateProfile: async (userId, profileData) => {
    return apiRequest(`/user/${userId}`, {
      method: 'PUT',
      body: profileData
    })
  },

  updatePassword: async (passwordData) => {
    return apiRequest('/user/update-password', {
      method: 'PATCH',
      body: passwordData
    })
  },

  deleteAccount: async () => {
    return apiRequest('/user/', {
      method: 'DELETE'
    })
  }
}

export const lessonsAPI = {
  getAllLessons: async ({ page = 1, limit = 10 } = {}) => {
    return apiRequest(`/lesson?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`)
  },

  getLessonById: async (id) => {
    return apiRequest(`/lesson/${id}`)
  },

  getPurchasedLessons: async () => {
    const resp = await apiRequest('/lesson/')
    let list = Array.isArray(resp) ? resp : (resp?.lessons || resp?.data || [])
    try {
      const localRaw = localStorage.getItem('purchasedLessonIds')
      const localIds = localRaw ? JSON.parse(localRaw) : []
      if (Array.isArray(localIds) && localIds.length > 0) {
        const existing = new Set((Array.isArray(list) ? list : []).map(l => l?._id))
        const extras = localIds
          .filter(id => id && !existing.has(id))
          .map(id => ({ _id: id, watched: false }))
        list = Array.isArray(list) ? [...list, ...extras] : extras
      }
    } catch (_) {}
    return list
  },

  getUserProgress: async () => {
    return apiRequest('/lesson/progress')
  },

  payForLesson: async (lessonId) => {
    return apiRequest(`/lesson/pay/${lessonId}`, {
      method: 'POST'
    })
  },

  createLesson: async (lessonData) => {
    return apiRequest('/lesson', {
      method: 'POST',
      body: lessonData
    })
  },

  updateLesson: async (id, lessonData) => {
    return apiRequest(`/lesson/${id}`, {
      method: 'PUT',
      body: lessonData
    })
  },

  deleteLesson: async (id) => {
    return apiRequest(`/lesson/${id}`, {
      method: 'DELETE'
    })
  }
}

export const examsAPI = {
  getAllExams: async ({ page = 1, limit = 10 } = {}) => {
    return apiRequest(`/exam?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`)
  },

  getExamById: async (id) => {
    return apiRequest(`/exam/get/${id}`)
  },

  getUserProgress: async () => {
    return apiRequest('/studentExam/progress')
  },

  startExam: async (examId) => {
    return apiRequest(`/studentExam/start/${examId}`, {
      method: 'POST'
    })
  },

  submitExam: async (examId, answers) => {
    return apiRequest(`/studentExam/submit/${examId}`, {
      method: 'POST',
      body: answers
    })
  },

  getRemainingTime: async (examId) => {
    try {
      // Prefer the backend's defined route first
      return await apiRequest(`/studentExam/exams/remaining-time/${examId}`)
    } catch (e) {
      // Fallback to alternative path if available on server
      return await apiRequest(`/studentExam/remaining-time/${examId}`)
    }
  },

  // Admin: get all scores for an exam
  getExamScore: async (examId) => {
    return apiRequest(`/studentExam/exams/${examId}`)
  },

  // Student-specific score endpoint - fixed to handle 404 properly
  getStudentScore: async (examId) => {
    // استخدام المسار الصحيح مباشرة - الـ 404 سيعالج في handleResponse
    return await apiRequest(`/studentExam/exams/score/${examId}`)
  },

  // Deprecated: use getStudentScore instead if present server-side
  getExamResult: async (examId) => {
    return apiRequest(`/studentExam/exams/${examId}`)
  },

  // Admin: get all students' scores for a given exam (optional studentName filter)
  getAdminExamScores: async (examId, studentName) => {
    const query = studentName ? `?${new URLSearchParams({ studentName }).toString()}` : ''
    return apiRequest(`/studentExam/exams/${examId}${query}`)
  },

  createExam: async (examData) => {
    return apiRequest('/exam', {
      method: 'POST',
      body: examData
    })
  },

  updateExam: async (id, examData) => {
    return apiRequest(`/exam/${id}`, {
      method: 'PUT',
      body: examData
    })
  },

  deleteExam: async (id) => {
    return apiRequest(`/exam/${id}`, {
      method: 'DELETE'
    })
  }
}

export const questionsAPI = {
  getAllQuestions: async ({ page = 1, limit = 10 } = {}) => {
    return apiRequest(`/question?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`)
  },

  getQuestionById: async (id) => {
    return apiRequest(`/question/get/${id}`)
  },

  // Optional: batch fetch by IDs (backend may not implement; callers should fallback on error)
  getQuestionsByIds: async (ids = []) => {
    return apiRequest('/question/batch', {
      method: 'POST',
      body: { ids }
    })
  },

  createQuestion: async (questionData) => {
    return apiRequest('/question', {
      method: 'POST',
      body: questionData
    })
  },

  updateQuestion: async (id, questionData) => {
    return apiRequest(`/question/${id}`, {
      method: 'PUT',
      body: questionData
    })
  },

  deleteQuestion: async (id) => {
    return apiRequest(`/question/${id}`, {
      method: 'DELETE'
    })
  }
}

export const adminAPI = {
  createAdmin: async (adminData) => {
    return apiRequest('/admin/create-admin', {
      method: 'POST',
      body: adminData
    })
  },

  getAllAdmins: async () => {
    return apiRequest('/admin/all-admin')
  },

  getAllUsers: async () => {
    return apiRequest('/admin/all-user')
  },

  deleteUser: async (userId) => {
    return apiRequest(`/admin/delete-user/${userId}`, {
      method: 'DELETE'
    })
  },

  promoteToAdmin: async (userId) => {
    return apiRequest(`/admin/promote-to-admin/${userId}`, {
      method: 'PUT'
    })
  },

  demoteToUser: async (adminId) => {
    return apiRequest(`/admin/demote-to-user/${adminId}`, {
      method: 'PUT'
    })
  },

  deleteAdmin: async (adminId) => {
    return apiRequest(`/admin/delete-admin/${adminId}`, {
      method: 'DELETE'
    })
  }
}

export default {
  authAPI,
  lessonsAPI,
  examsAPI,
  questionsAPI,
  adminAPI
}
