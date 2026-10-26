/**
 * API Base URL configuration
 * @constant {string}
 */
import { showNotification } from './notificationService';

// Use empty string so requests go through Vite proxy (local) or Vercel rewrites (production)
const API_BASE_URL = '';

// Security configuration
const SECURITY_CONFIG = {
  MAX_RETRIES: 3,
  RATE_LIMIT_DELAY: 1000,
  CSRF_HEADER: 'X-CSRF-Token',
};

const secureStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }
};

const getAuthHeaders = () => {
  const token = secureStorage.get('token');
  // Only include headers that are allowed in CORS requests.
  // Browser-security headers (X-Frame-Options, CSP, HSTS, …) must NOT be sent
  // as request headers — browsers block the preflight when they are present.
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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

const handleResponse = async (response, { silent = false } = {}) => {
  if (response.status === 404) {
    return null;
  }

  if (response.status === 401) {
    secureStorage.remove('token');
    secureStorage.remove('csrfToken');
    const errorMessage = 'Session expired. Please log in again.';

    // Show error notification
    const lang = localStorage.getItem('language') || 'en';
    showNotification(errorMessage, { lang, type: 'error', statusCode: 401 });

    const error = new Error(errorMessage);
    error.status = 401;
    throw error;
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 5;
    const error = new Error(`Too many requests. Please try again after ${retryAfter} seconds.`);
    error.status = 429;
    throw error;
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }


    const errorMessage = errorData.message || errorData.error || `Connection error: ${response.status}`;

    // Show error notification (skipped for silent probes where non-OK is an expected answer)
    if (!silent) {
      const lang = localStorage.getItem('language') || 'en';
      showNotification(errorMessage, { lang, type: 'error', statusCode: response.status });
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const data = await response.json();

  const csrfToken = response.headers.get('x-csrf-token');
  if (csrfToken) {
    secureStorage.set('csrfToken', csrfToken);
  }

  // Show success notification if message exists
  if (!silent && data && (data.message || data.msg)) {
    const successMessage = data.message || data.msg;
    if (typeof successMessage === 'string' && successMessage.trim()) {
      const lang = localStorage.getItem('language') || 'en';
      showNotification(successMessage, { lang, type: 'success', statusCode: response.status });
    }
  }

  return data;
};

export const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint');
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const { silent = false, ...fetchOptions } = options;
  const headers = getAuthHeaders();
  const config = {
    method: fetchOptions.method || 'GET',
    headers: { ...headers, ...fetchOptions.headers },
    // 'omit' avoids the origin:'*' + credentials:true conflict in the backend CORS config
    credentials: 'omit',
    ...fetchOptions
  };

  if (options.body) {
    if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body;
    }
  }

  try {
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.RATE_LIMIT_DELAY * (retryCount + 1)));
    }

    const response = await fetch(url, config);
    return await handleResponse(response, { silent });

  } catch (error) {
    if (error.message.includes('Session expired') || error.status === 401) {
      secureStorage.remove('token');
      secureStorage.remove('csrfToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    const isIdempotent = !options.method || options.method.toUpperCase() === 'GET' || options.method.toUpperCase() === 'HEAD';
    if (isIdempotent && retryCount < SECURITY_CONFIG.MAX_RETRIES &&
      (!error.status || (error.status >= 500 && error.status < 600))) {
      return apiRequest(endpoint, options, retryCount + 1);
    }

    throw error;
  }
};

export const authAPI = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: credentials
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: userData
    });
  },

  forgotPassword: async (email) => {
    return apiRequest('/user/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  resetPassword: async (resetData) => {
    return apiRequest('/user/reset-password', {
      method: 'POST',
      body: resetData
    });
  },

  getProfile: async () => {
    const response = await apiRequest('/user');
    return response.data || response;
  },

  updateProfile: async (userId, profileData) => {
    return apiRequest(`/user/${userId}`, {
      method: 'PUT',
      body: profileData
    });
  },

  updatePassword: async (passwordData) => {
    return apiRequest('/user/update-password', {
      method: 'PATCH',
      body: passwordData
    });
  },

  deleteAccount: async () => {
    return apiRequest('/user', {
      method: 'DELETE'
    });
  }
};

export const lessonsAPI = {
  getAllLessons: async ({ page = 1, limit = 10, title, classLevel, sortBy, sortOrder } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (title) params.set('title', title);
    if (classLevel) params.set('classLevel', classLevel);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    const response = await apiRequest(`/lesson?${params.toString()}`);
    if (response === null) {
      const error = new Error('Lesson list request failed');
      error.code = 'LESSONS_FETCH_FAILED';
      throw error;
    }
    return response;
  },

  getLessonById: async (id) => {
    return apiRequest(`/lesson/${id}`);
  },

  getPurchasedLessons: async () => {
    const response = await apiRequest('/lesson/my/purchased');
    if (response === null) {
      throw new Error('Failed to fetch purchased lessons');
    }
    const lessons = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : null;
    if (!lessons) {
      throw new Error('Unexpected purchased lessons response');
    }
    return lessons.filter(lesson =>
      lesson && typeof lesson === 'object' && !Array.isArray(lesson) && typeof lesson._id === 'string'
    );
  },

  getUserProgress: async () => {
    return apiRequest('/lesson/progress');
  },

  payForLesson: async (lessonId) => {
    return apiRequest(`/lesson/pay/${lessonId}`, {
      method: 'POST'
    });
  },

  createLesson: async (lessonData) => {
    return apiRequest('/lesson', {
      method: 'POST',
      body: lessonData
    });
  },

  updateLesson: async (id, lessonData) => {
    return apiRequest(`/lesson/${id}`, {
      method: 'PUT',
      body: lessonData
    });
  },

  deleteLesson: async (id) => {
    return apiRequest(`/lesson/${id}`, {
      method: 'DELETE'
    });
  }
};

export const examsAPI = {
  getAllExams: async ({ page = 1, limit = 10 } = {}) => {
    const response = await apiRequest(`/exam?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);

    if (response === null) {
      throw new Error('Failed to fetch exams');
    }

    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else if (response && Array.isArray(response.exams)) {
      return response.exams;
    } else if (response && response.data && response.data.exams) {
      return response.data.exams;
    }

    if (response && typeof response === 'object') {
      const keys = Object.keys(response);
      for (const key of keys) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
      return [response];
    }

    throw new Error('Unexpected exams response');
  },

  getExamById: async (id) => {
    const response = await apiRequest(`/exam/get/${id}`);

    if (response === null) {
      throw new Error('Exam not found');
    }

    if (response.exam) {
      return { ...response, ...response.exam };
    } else if (response.data) {
      return response.data.exam || response.data;
    }

    return response;
  },

  getUserProgress: async () => {
    try {
      const response = await apiRequest('/studentExam/progress');
      return response || { completedExams: [], scores: [] };
    } catch (error) {
      return { completedExams: [], scores: [] };
    }
  },

  startExam: async (examId) => {
    return apiRequest(`/studentExam/start/${examId}`, {
      method: 'POST'
    });
  },

  submitExam: async (examId, answers) => {
    return apiRequest(`/studentExam/submit/${examId}`, {
      method: 'POST',
      body: answers
    });
  },

  getRemainingTime: async (examId) => {
    try {
      return await apiRequest(`/studentExam/exams/remaining-time/${examId}`);
    } catch (e) {
      return await apiRequest(`/studentExam/remaining-time/${examId}`);
    }
  },

  getExamScore: async (examId) => {
    return apiRequest(`/studentExam/exams/${examId}`);
  },

  getStudentScore: async (examId) => {
    try {
      const response = await apiRequest(`/studentExam/exams/score/${examId}`);

      if (response === null) {
        return null;
      }

      return response.data || response;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getExamResult: async (examId) => {
    return apiRequest(`/studentExam/exams/${examId}`);
  },

  getAdminExamScores: async (examId, studentName) => {
    const query = studentName ? `?${new URLSearchParams({ studentName }).toString()}` : '';
    let response;
    try {
      response = await apiRequest(`/studentExam/exams/${examId}${query}`);
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }

    if (response === null) return [];

    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.scores) {
      return response.scores;
    }

    throw new Error('Unexpected exam scores response');
  },

  checkExamAttempt: async (examId) => {
    try {
      const response = await apiRequest(`/studentExam/exams/score/${examId}`);
      return response !== null;
    } catch (error) {
      return false;
    }
  },

  createExam: async (examData) => {
    return apiRequest('/exam', {
      method: 'POST',
      body: examData
    });
  },

  updateExam: async (id, examData) => {
    return apiRequest(`/exam/${id}`, {
      method: 'PUT',
      body: examData
    });
  },

  deleteExam: async (id) => {
    return apiRequest(`/exam/${id}`, {
      method: 'DELETE'
    });
  }
};

export const questionsAPI = {
  getAllQuestions: async ({ page = 1, limit = 10 } = {}) => {
    const response = await apiRequest(`/question?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);
    if (response === null) {
      throw new Error('Failed to fetch questions');
    }
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.questions)) return response.questions;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.questions)) return response.data.questions;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (response && typeof response === 'object') {
      const keys = Object.keys(response);
      for (const key of keys) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    throw new Error('Unexpected questions response');
  },

  getQuestionById: async (id) => {
    return apiRequest(`/question/get/${id}`);
  },

  getQuestionsByIds: async (ids = []) => {
    return apiRequest('/question/batch', {
      method: 'POST',
      body: { ids }
    });
  },

  createQuestion: async (questionData) => {
    return apiRequest('/question', {
      method: 'POST',
      body: questionData
    });
  },

  updateQuestion: async (id, questionData) => {
    return apiRequest(`/question/${id}`, {
      method: 'PUT',
      body: questionData
    });
  },

  deleteQuestion: async (id) => {
    return apiRequest(`/question/${id}`, {
      method: 'DELETE'
    });
  }
};

export const adminAPI = {
  createAdmin: async (adminData) => {
    return apiRequest('/admin/create-admin', {
      method: 'POST',
      body: adminData
    });
  },

  getAllAdmins: async () => {
    try {
      const response = await apiRequest('/admin/all-admin');

      if (response === null) return [];

      if (Array.isArray(response)) return response;
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.admins)) return response.admins;

      throw new Error('Unexpected admins response');
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await apiRequest('/admin/all-user');

      if (response === null) return [];

      if (Array.isArray(response)) return response;
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.users)) return response.users;

      throw new Error('Unexpected users response');
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  },

  deleteUser: async (userId) => {
    return apiRequest(`/admin/delete-user/${userId}`, {
      method: 'DELETE'
    });
  },

  promoteToAdmin: async (userId) => {
    return apiRequest(`/admin/promote-to-admin/${userId}`, {
      method: 'PUT'
    });
  },

  demoteToUser: async (adminId) => {
    return apiRequest(`/admin/demote-to-user/${adminId}`, {
      method: 'PUT'
    });
  },

  deleteAdmin: async (adminId) => {
    return apiRequest(`/admin/delete-admin/${adminId}`, {
      method: 'DELETE'
    });
  }
};

export default {
  authAPI,
  lessonsAPI,
  examsAPI,
  questionsAPI,
  adminAPI
};
