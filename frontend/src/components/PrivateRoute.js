import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, token } = useContext(AuthContext);
  
  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  
  // Role-based access control
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required role: {requiredRole}</p>
        <p>Your role: {user.role}</p>
      </div>
    );
  }
  
  return children;
};

export default PrivateRoute;