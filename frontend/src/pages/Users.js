import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './styles/Users.css';
import { AuthContext } from '../context/AuthContext';

const Users = () => {
  // Grab the auth token from context for protected requests
  const { token } = useContext(AuthContext);

  // Store all users fetched from the API
  const [users, setUsers] = useState([]);

  // Form state for creating a new user
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',       // Default role
    studentId: ''          // Optional, only used if role is student
  });

  // State for showing/hiding create user modal
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State for tracking which user's role is being edited
  const [editingRole, setEditingRole] = useState({});

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
  headers: { Authorization: `Bearer ${token}` }
});

      
      // Ensure each user has a role property with a default value
      const usersWithDefaults = (res.data.data || []).map(user => ({
        ...user,
        role: user.role || 'student', // Default to 'student' if role is undefined
        name: user.name || 'Unknown User',
        email: user.email || 'No Email',
        createdAt: user.createdAt || new Date().toISOString()
      }));
      
      setUsers(usersWithDefaults);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Run fetchUsers on component mount and whenever the token changes
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  // Handle form input changes (for controlled form inputs)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission to create a new user
  const handleCreate = async (e) => {
    e.preventDefault(); // Prevent page reload
    try {
     await axios.post(`${process.env.REACT_APP_API_URL}/api/users`, form, {
  headers: { Authorization: `Bearer ${token}` }
});

      fetchUsers();  // Refresh the user list
      setForm({ name: '', email: '', password: '', role: 'student', studentId: '' });  // Clear form
      setShowCreateForm(false); // Hide form after creation
    } catch (err) {
      alert(err.response?.data?.message || 'User creation failed');
    }
  };

  // Handle role change for inline editing
  const handleRoleChange = (userId, newRole) => {
    setEditingRole({ ...editingRole, [userId]: newRole });
  };

  // Handle update user role
  const handleUpdateUser = async (userId) => {
    try {
      const newRole = editingRole[userId];
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${userId}`, 
  { role: newRole }, 
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

      fetchUsers(); // Refresh the user list
      // Clear the editing state for this user
      const updatedEditing = { ...editingRole };
      delete updatedEditing[userId];
      setEditingRole(updatedEditing);
    } catch (err) {
      alert(err.response?.data?.message || 'User update failed');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Safe role display function
  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case 'student': return 'Student';
      case 'lecturer': return 'Lecturer';
      case 'admin': return 'Admin';
      default: return 'Student'; // Default fallback
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="users-page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="users-page">
        <div className="error">
          {error}
          <button onClick={fetchUsers} style={{ marginLeft: '10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>User Management</h2>
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          Create New User
        </button>
      </div>

      {/* User creation form - shown conditionally */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="user-form">
          <h3>Create New User</h3>

          {/* Input for full name */}
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />

          {/* Input for email */}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />

          {/* Input for password */}
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />

          {/* Dropdown for user role selection */}
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Admin</option>
          </select>

          {/* Only show Student ID input if the role is 'student' */}
          {form.role === 'student' && (
            <input
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              placeholder="Student ID"
              required={form.role === 'student'} // Only required if role is student
            />
          )}

          <div className="form-buttons">
            <button type="submit">Create User</button>
            <button type="button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      <div className="user-table-container">
        {users.length === 0 ? (
          <div className="no-users">No users found.</div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                // Ensure user object has required properties
                const safeUser = {
                  _id: user._id || `temp-${index}`,
                  name: user.name || 'Unknown User',
                  email: user.email || 'No Email',
                  role: user.role || 'student',
                  createdAt: user.createdAt
                };

                return (
                  <tr key={safeUser._id}>
                    <td>{index + 1}</td>
                    <td>{safeUser.name}</td>
                    <td>{safeUser.email}</td>
                    <td>
                      <select
                        value={editingRole[safeUser._id] || safeUser.role}
                        onChange={(e) => handleRoleChange(safeUser._id, e.target.value)}
                        className={`role-select ${safeUser.role.toLowerCase()}`}
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{formatDate(safeUser.createdAt)}</td>
                    <td>
                      <button
                        className="update-btn"
                        onClick={() => handleUpdateUser(safeUser._id)}
                        disabled={!editingRole[safeUser._id] || editingRole[safeUser._id] === safeUser.role}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;