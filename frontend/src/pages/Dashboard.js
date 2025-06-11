// Import necessary modules
import React, { useContext, useEffect } from 'react';
import './styles/Dashboard.css';            
import { AuthContext } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';       
import ClassroomList from './class/ClassroomList';

// ✅ Dashboard Component
const Dashboard = () => {
  const { user, token, logout, isAuthenticated } = useContext(AuthContext); // Get current user and logout function from Auth Context
  const navigate = useNavigate();                   // Create navigation instance for redirection

  // Redirect to login if not authenticated
  useEffect(() => {
    // Add a small delay to allow context to initialize
    const timer = setTimeout(() => {
      if (!isAuthenticated && !token && !localStorage.getItem('token')) {
        navigate('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, token, navigate]);

  // ✅ Handle logout click
  const handleLogout = () => {
    logout();         
    navigate('/login'); 
  };

  // Show loading while checking authentication
  if (!isAuthenticated && !token && !localStorage.getItem('token')) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-content">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <p>You are logged in as a <strong>{user?.role || 'Unknown role'}</strong>.</p>

        {/* Lecturer-specific content */}
        {user?.role === 'lecturer' && (
          <div style={{ marginTop: '20px' }}>
            <h2>Your Classrooms</h2>
            <ClassroomList token={token} />
          </div>
        )}

        <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '20px' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;