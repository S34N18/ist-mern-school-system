import React, { useState } from 'react';
import axios from 'axios';
import './styles/Register.css';
import { useNavigate } from 'react-router-dom';

// Register Component
const Register = () => {
  const navigate = useNavigate();

  // State to manage form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    phoneNumber: ''
  });

  // State for messages and loading
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes and update the formData state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (errorMsg || successMsg) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  // Validate form data
  const validateForm = () => {
    const { name, email, password, confirmPassword, role, studentId, phoneNumber } = formData;

    // Basic validation
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return false;
    }

    if (name.trim().length > 50) {
      setErrorMsg('Name cannot be more than 50 characters');
      return false;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email');
      return false;
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setErrorMsg('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    // Student ID validation for students
    if (role === 'student' && !studentId.trim()) {
      setErrorMsg('Student ID is required for student accounts');
      return false;
    }

    // Phone number validation (if provided)
    if (phoneNumber && phoneNumber.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        setErrorMsg('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Prepare data for API call
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      };

      // Add studentId only for students
      if (formData.role === 'student' && formData.studentId.trim()) {
        registrationData.studentId = formData.studentId.trim();
      }

      // Add phone number if provided
      if (formData.phoneNumber && formData.phoneNumber.trim()) {
        registrationData.phoneNumber = formData.phoneNumber.trim();
      }

      // Send registration data to backend
      const response = await axios.post('http://localhost:5000/api/users', registrationData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Show success message
      setSuccessMsg(`${formData.role === 'student' ? 'Student' : 'Lecturer'} registered successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        studentId: '',
        phoneNumber: ''
      });

      // Redirect to users list or dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      // Handle different types of errors
      if (error.response?.status === 401) {
        setErrorMsg('Unauthorized. Please login as a lecturer to register users.');
      } else if (error.response?.status === 403) {
        setErrorMsg('Access denied. Only lecturers can register new users.');
      } else {
        setErrorMsg(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel/back action
  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="register-page">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register New {formData.role === 'student' ? 'Student' : 'User'}</h2>

        {/* Display messages */}
        {errorMsg && <p className="error">{errorMsg}</p>}
        {successMsg && <p className="success">{successMsg}</p>}

        {/* Full Name Input */}
        <input
          name="name"
          type="text"
          placeholder="Full Name *"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isLoading}
          maxLength={50}
        />

        {/* Email Input */}
        <input
          name="email"
          type="email"
          placeholder="Email Address *"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />

        {/* Password Input */}
        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters) *"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
          minLength={6}
        />

        {/* Confirm Password Input */}
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password *"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
          minLength={6}
        />

        {/* Role Dropdown */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>

        {/* Student ID input - only show for students */}
        {formData.role === 'student' && (
          <input
            name="studentId"
            type="text"
            placeholder="Student ID *"
            value={formData.studentId}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        )}

        {/* Phone Number Input (Optional) */}
        <input
          name="phoneNumber"
          type="tel"
          placeholder="Phone Number (optional)"
          value={formData.phoneNumber}
          onChange={handleChange}
          disabled={isLoading}
        />

        {/* Action Buttons */}
        <div className="button-group">
          <button type="submit" disabled={isLoading} className="primary-button">
            {isLoading ? 'Registering...' : `Register ${formData.role === 'student' ? 'Student' : 'User'}`}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="secondary-button"
          >
            Cancel
          </button>
        </div>

        {/* Required fields note */}
        <p className="required-note">* Required fields</p>
      </form>
    </div>
  );
};

export default Register;