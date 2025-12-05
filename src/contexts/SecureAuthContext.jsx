import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { secureStorage } from '@/utils/security';
import secureApi from '@/services/secureApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = secureStorage.get('authToken');
        if (token) {
          const userData = await secureApi.get('/auth/me');
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApi.post('/auth/login', { email, password });
      const { token, refreshToken, user: userData } = response;
      
      // Store tokens securely
      secureStorage.set('authToken', token);
      secureStorage.set('refreshToken', refreshToken);
      
      // Set user data
      setUser(userData);
      secureApi.setAuthToken(token);
      
      // Redirect to intended location or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and clear session
   */
  const logout = () => {
    try {
      // Call logout API if token exists
      const token = secureStorage.get('authToken');
      if (token) {
        secureApi.post('/auth/logout').catch(console.error);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all auth data
      secureApi.clearAuth();
      secureStorage.remove('authToken');
      secureStorage.remove('refreshToken');
      secureStorage.remove('userData');
      
      // Reset state
      setUser(null);
      setError(null);
      
      // Redirect to login
      navigate('/login');
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registered user data
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApi.post('/auth/register', userData);
      const { token, refreshToken, user: registeredUser } = response;
      
      // Store tokens
      secureStorage.set('authToken', token);
      secureStorage.set('refreshToken', refreshToken);
      
      // Set user data
      setUser(registeredUser);
      secureApi.setAuthToken(token);
      
      // Redirect to home
      navigate('/');
      
      return registeredUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await secureApi.put('/auth/me', userData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response data
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      return await secureApi.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to change password.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has required role
   * @param {string|Array} requiredRole - Required role or array of roles
   * @returns {boolean} True if user has required role
   */
  const hasRole = (requiredRole) => {
    if (!user?.role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  };

  /**
   * Check if user has required permission
   * @param {string} permission - Required permission
   * @returns {boolean} True if user has required permission
   */
  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component to protect routes that require authentication
 * @param {React.Component} Component - The component to protect
 * @returns {React.Component} Protected component
 */
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        // Redirect to login page with the return url
        navigate('/login', { state: { from: location }, replace: true });
      }
    }, [isAuthenticated, loading, navigate, location]);

    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };
};

/**
 * Higher-order component to protect admin routes
 * @param {React.Component} Component - The component to protect
 * @returns {React.Component} Protected admin component
 */
export const withAdmin = (Component) => {
  return (props) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          navigate('/login', { state: { from: location }, replace: true });
        } else if (!isAdmin) {
          navigate('/unauthorized', { replace: true });
        }
      }
    }, [isAuthenticated, isAdmin, loading, navigate, location]);

    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    return isAuthenticated && isAdmin ? <Component {...props} /> : null;
  };
};

export default AuthContext;
