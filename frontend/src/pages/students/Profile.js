import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import '../styles/Profile.css' ; 

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    bio: '',
    avatar: null
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/students/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (profile[key] !== null && profile[key] !== '') {
          formData.append(key, profile[key]);
        }
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setMessage('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password updated successfully!');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update password');
      }
    } catch (err) {
      setError('Error updating password');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files && files[0]) {
      setProfile(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="profile-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and view your academic progress</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
   
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Academic Stats
        </button>
      </div>

      {/* Messages */}
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="avatar-section">
                <div className="avatar-preview">
                  {user?.avatar ? (
                    <img src={`/api/uploads/${user.avatar}`} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="avatar-upload">
                  <label htmlFor="avatar">Profile Picture</label>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={profile.studentId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

     
      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="tab-content">
          <div className="stats-section">
            <h3>Academic Statistics</h3>
            
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>{stats.totalAssignments || 0}</h4>
                  <p>Total Assignments</p>
                </div>
                <div className="stat-card">
                  <h4>{stats.completedAssignments || 0}</h4>
                  <p>Completed</p>
                </div>
                <div className="stat-card">
                  <h4>{stats.pendingAssignments || 0}</h4>
                  <p>Pending</p>
                </div>
                <div className="stat-card">
                  <h4>{stats.averageGrade || 0}%</h4>
                  <p>Average Grade</p>
                </div>
                <div className="stat-card">
                  <h4>{stats.enrolledClasses || 0}</h4>
                  <p>Enrolled Classes</p>
                </div>
                <div className="stat-card">
                  <h4>{stats.onTimeSubmissions || 0}</h4>
                  <p>On-Time Submissions</p>
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}

            <div className="recent-activity">
              <h4>Recent Activity</h4>
              {stats?.recentActivity ? (
                <ul className="activity-list">
                  {stats.recentActivity.map((activity, index) => (
                    <li key={index} className="activity-item">
                      <span className="activity-type">{activity.type}</span>
                      <span className="activity-description">{activity.description}</span>
                      <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activity to display.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;