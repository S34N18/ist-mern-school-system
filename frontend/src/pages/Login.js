import React, { useState, useContext } from 'react';
import axios from 'axios';
import './styles/Login.css'; 
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ForgotPassword from './Forgotpassword.js';
import ResetPassword from './Resetpassword.js';

// Login Page Component
const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, token } = useContext(AuthContext);

  // State hooks for form inputs and messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // View state management
  const [currentView, setCurrentView] = useState('login'); // 'login', 'forgot', 'reset'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Clear messages when switching between forms
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle Login Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    // Validate form data before sending
    if (!email || !password) {
      setErrorMsg('Please provide both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        email: email.trim().toLowerCase(),
        password: password
      };

      console.log('Attempting login for:', requestData.email);

      const res = await axios.post('http://localhost:5000/api/auth/login', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Full login response:', res.data);

      // Handle different possible response formats from your backend
      let userData = null;
      let authToken = null;

      // Check different possible response structures
      if (res.data.token && res.data.data) {
        // Format: { token, data: userData }
        authToken = res.data.token;
        userData = res.data.data;
      } else if (res.data.token && res.data.user) {
        // Format: { token, user: userData }
        authToken = res.data.token;
        userData = res.data.user;
      } else if (res.data.access_token && res.data.user) {
        // Format: { access_token, user: userData }
        authToken = res.data.access_token;
        userData = res.data.user;
      } else if (res.data.token && (res.data.name || res.data.email)) {
        // Format: { token, name, email, role, ... } (user data is at root level)
        authToken = res.data.token;
        userData = {
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          id: res.data.id || res.data._id,
          // Add any other fields your backend returns
        };
      } else {
        // Try to extract from whatever structure we got
        authToken = res.data.token || res.data.access_token || res.data.jwt;
        userData = res.data.user || res.data.data || res.data;
      }

      console.log('Extracted token:', authToken);
      console.log('Extracted user data:', userData);

      // Validate that we have both token and user data
      if (!authToken) {
        throw new Error('No authentication token received from server');
      }

      if (!userData || (!userData.name && !userData.email)) {
        throw new Error('No valid user data received from server');
      }

      // Ensure user data has required fields
      if (!userData.name) userData.name = userData.email?.split('@')[0] || 'User';
      if (!userData.role) userData.role = 'student'; // default role

      // Update context with logged in user
      login(userData, authToken);

      // Verify that login worked by checking context immediately
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        console.log('Verification - Stored user:', storedUser);
        console.log('Verification - Stored token:', storedToken);
        
        if (storedUser && storedToken) {
          setSuccessMsg('Login successful! Redirecting...');
          setTimeout(() => {
            console.log('Attempting to navigate to dashboard...');
            navigate('/dashboard');
          }, 500);
        } else {
          setErrorMsg('Login failed - data not saved properly');
        }
      }, 100);

    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      setErrorMsg(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const handleShowForgotPassword = () => {
    clearMessages();
    setCurrentView('forgot');
  };

  const handleBackToLogin = () => {
    clearMessages();
    setCurrentView('login');
    setForgotPasswordEmail('');
  };

  const handleMoveToReset = (email) => {
    setForgotPasswordEmail(email);
    setCurrentView('reset');
  };

  const handleBackToForgot = () => {
    clearMessages();
    setCurrentView('forgot');
  };

  const handleResetSuccess = () => {
    setCurrentView('login');
    setForgotPasswordEmail('');
    setSuccessMsg('Password reset successful! You can now login with your new password.');
  };

  // Render based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'forgot':
        return (
          <ForgotPassword
            onBackToLogin={handleBackToLogin}
            onMoveToReset={handleMoveToReset}
          />
        );
      
      case 'reset':
        return (
          <ResetPassword
            email={forgotPasswordEmail}
            onBackToForgot={handleBackToForgot}
            onBackToLogin={handleBackToLogin}
            onResetSuccess={handleResetSuccess}
          />
        );
      
      default:
        return (
          <div className="login-container">
           
            <form onSubmit={handleSubmit} className="login-form">
              <h2>Login</h2>

              {/* Display messages */}
              {errorMsg && <div className="error-message">{errorMsg}</div>}
              {successMsg && <div className="success-message">{successMsg}</div>}

              {/* Email Input Field */}
              <div className="input-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="email-input"
                />
              </div>

              {/* Password Input Field */}
              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="password-input"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="primary-button"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>


              {/* Forgot Password Link */}
              <div className="forgot-password-link">
                <button
                  type="button"
                  onClick={handleShowForgotPassword}
                  className="link-button"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="login-page">
      {renderCurrentView()}
    </div>
  );
};

export default Login;