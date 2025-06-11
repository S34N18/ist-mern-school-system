import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Resetpassword.css';

const ResetPassword = ({ initialEmail = '', onBackToForgot, onBackToLogin, onResetSuccess }) => {
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  // Update email when initialEmail changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // Check password strength
  useEffect(() => {
    if (newPassword) {
      if (newPassword.length < 6) {
        setPasswordStrength('weak');
      } else if (newPassword.length < 8) {
        setPasswordStrength('medium');
      } else {
        setPasswordStrength('strong');
      }
    } else {
      setPasswordStrength('');
    }
  }, [newPassword]);

  // Clear messages
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 100) {
      return 'Password is too long';
    }
    return null;
  };

  // Verify reset code (optional step)
  const verifyResetCode = async () => {
    if (!email.trim() || !resetCode.trim()) {
      setErrorMsg('Please enter email and reset code');
      return;
    }

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setErrorMsg('Reset code should be 6 digits');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-reset-code', {
        email: email.trim().toLowerCase(),
        resetCode: resetCode.trim()
      });

      setSuccessMsg('Reset code verified! You can now set your new password.');
      setCodeVerified(true);
    } catch (error) {
      console.error('Verify code error:', error);
      setErrorMsg(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Invalid or expired reset code'
      );
      setCodeVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    // Validate all fields are filled
    if (!email.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Validate reset code format (should be 6 digits)
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setErrorMsg('Reset code should be 6 digits');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrorMsg(passwordError);
      setIsLoading(false);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        email: email.trim().toLowerCase(),
        passwordResetCode: resetCode.trim(), // This matches your backend expectation
        newPassword: newPassword
      };

      console.log('Sending request with data:', requestData);

      const response = await axios.post('http://localhost:5000/api/auth/reset-password', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Reset password response:', response.data);

      setSuccessMsg('Password reset successfully! Redirecting to login...');
      
      // Wait for user to see success message, then redirect to login
      setTimeout(() => {
        onResetSuccess();
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      console.error('Error response:', error.response?.data);
      
      setErrorMsg(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });
      console.log('Resend code response:', response.data);
      setSuccessMsg('New reset code sent! Check your server console for the code.');
      setCodeVerified(false); // Reset verification status
    } catch (error) {
      console.error('Resend code error:', error);
      setErrorMsg(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to resend code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <h2>Reset Password</h2>
        <p className="reset-password-description">
          Enter your email, the 6-digit code, and create a new password.
          <br />
          <small><strong>Note:</strong> Reset codes are currently logged to the server console.</small>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Display messages */}
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {/* Email Input */}
          <div className="input-group">
            <label htmlFor="reset-email">Email Address</label>
            <input
              id="reset-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="email-input"
            />
          </div>

          {/* Reset Code Input */}
          <div className="input-group">
            <label htmlFor="reset-code">Reset Code</label>
            <div className="code-input-group">
              <input
                id="reset-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={resetCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setResetCode(value);
                  setCodeVerified(false); // Reset verification when code changes
                }}
                required
                disabled={isLoading}
                className={`code-input ${codeVerified ? 'verified' : ''}`}
                maxLength="6"
                pattern="\d{6}"
              />
              <button
                type="button"
                onClick={verifyResetCode}
                disabled={isLoading || !resetCode || resetCode.length !== 6}
                className="verify-button"
              >
                Verify
              </button>
            </div>
            {codeVerified && <small className="verification-status">✓ Code verified</small>}
          </div>

          {/* New Password Input */}
          <div className="input-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type={showPasswords ? "text" : "password"}
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              className="password-input"
              minLength="6"
            />
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength}`}>
                Password strength: {passwordStrength}
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="password-input"
              minLength="6"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <small className="password-mismatch">Passwords do not match</small>
            )}
          </div>

          {/* Show/Hide Password Toggle */}
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                disabled={isLoading}
              />
              Show passwords
            </label>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button 
              type="submit" 
              disabled={isLoading}
              className="primary-button"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          {/* Additional Actions */}
          <div className="additional-actions">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="link-button"
            >
              Send/Resend Code
            </button>
            
            {onBackToForgot && (
              <button
                type="button"
                onClick={onBackToForgot}
                disabled={isLoading}
                className="link-button"
              >
                Back to Forgot Password
              </button>
            )}
            
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={isLoading}
              className="link-button"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;