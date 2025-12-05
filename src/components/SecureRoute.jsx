import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import PropTypes from 'prop-types';

/**
 * SecureRoute component to protect routes that require authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string|Array} [props.roles] - Required role(s) to access the route
 * @param {string|Array} [props.permissions] - Required permission(s) to access the route
 * @param {string} [props.redirectTo] - Path to redirect if access is denied
 * @returns {JSX.Element} Protected route or redirect
 */
const SecureRoute = ({ 
  children, 
  roles = null, 
  permissions = null, 
  redirectTo = '/unauthorized' 
}) => {
  const { isAuthenticated, loading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  // Check permission-based access
  if (permissions) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const hasRequiredPermission = requiredPermissions.every(perm => hasPermission(perm));
    
    if (!hasRequiredPermission) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  return children;
};

SecureRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  permissions: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  redirectTo: PropTypes.string
};

export default SecureRoute;
