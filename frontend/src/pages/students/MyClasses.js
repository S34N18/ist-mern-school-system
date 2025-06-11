import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
// import '../styles/MyClasses.css';

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const response = await fetch(`/api/students/${user.id}/classrooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else {
        setError('Failed to fetch classes');
      }
    } catch (err) {
      setError('Error loading classes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveAssignmentsCount = (classroom) => {
    // This would typically come from the API response
    return classroom.activeAssignments || 0;
  };

  const getCompletedAssignmentsCount = (classroom) => {
    // This would typically come from the API response
    return classroom.completedAssignments || 0;
  };

  if (loading) {
    return (
      <div className="my-classes-container">
        <div className="loading">Loading your classes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-classes-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-classes-container">
      <div className="page-header">
        <h1>My Classes</h1>
        <p>View all the classes you're enrolled in</p>
      </div>

      {classes.length === 0 ? (
        <div className="no-classes">
          <h3>No Classes Found</h3>
          <p>You are not enrolled in any classes yet. Contact your instructor to get added to a class.</p>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((classroom) => (
            <div key={classroom.id} className="class-card">
              <div className="class-header">
                <h3>{classroom.name}</h3>
                <span className="class-code">{classroom.code}</span>
              </div>
              
              <div className="class-info">
                <p className="instructor">
                  <strong>Instructor:</strong> {classroom.lecturer?.name || 'Unknown'}
                </p>
                <p className="description">{classroom.description}</p>
              </div>

              <div className="class-stats">
                <div className="stat">
                  <span className="stat-number">{getActiveAssignmentsCount(classroom)}</span>
                  <span className="stat-label">Active Assignments</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{getCompletedAssignmentsCount(classroom)}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>

              <div className="class-actions">
                <Link 
                  to={`/classrooms/${classroom.id}`}
                  className="btn btn-primary"
                >
                  View Details
                </Link>
                <Link 
                  to={`/assignments?classroom=${classroom.id}`}
                  className="btn btn-secondary"
                >
                  View Assignments
                </Link>
              </div>

              <div className="class-footer">
                <small>Enrolled: {new Date(classroom.enrolledAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;