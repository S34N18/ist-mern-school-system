import React, { useState } from 'react';
import axios from 'axios';
import './styles/Forgotpassword.css';

const ForgotPassword = ({ onBackToLogin, onMoveToReset }) => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear messages
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    // Validate email
    if (!email) {
      setErrorMsg('Please enter your email address');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setSuccessMsg('Password reset code sent to your email!');
      
      // Wait a moment for user to see success message, then move to reset step
      setTimeout(() => {
        onMoveToReset(email.trim().toLowerCase());
      }, 1500);

    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMsg(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to send reset code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h2>Forgot Password</h2>
        <p className="forgot-password-description">
          Enter your email address and we'll send you a code to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Display messages */}
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {/* Email Input */}
          <div className="input-group">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="email-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button 
              type="submit" 
              disabled={isLoading}
              className="primary-button"
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
            
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={isLoading}
              className="secondary-button"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;