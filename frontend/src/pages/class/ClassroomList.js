import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import AddClassroomForm from './AddClassRoomForm';
import '../styles/ClassroomList.css';

const ClassroomList = () => {
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Fetch classrooms
  const fetchClassrooms = async () => {
    setLoading(true);
    setError('');
    
    // Add debug logging
    console.log('Fetching classrooms for user:', user);
    console.log('Token exists:', !!token);
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/classrooms`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Full API response:', response.data);
      
      // Fix: Access the nested data array
      if (response.data.success && response.data.data) {
        setClassrooms(response.data.data);
      } else {
        // Handle case where response structure is different
        setClassrooms(Array.isArray(response.data) ? response.data : []);
      }
      
    } catch (err) {
      // Enhanced error logging
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.statusText || 
                      err.message || 
                      'Failed to fetch classrooms';
      setError(`Error: ${errorMsg} (Status: ${err.response?.status || 'Unknown'})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user and token exist before making request
    if (!user) {
      console.log('No user found, skipping classroom fetch');
      setLoading(false);
      return;
    }
    
    if (!token) {
      console.log('No token found, skipping classroom fetch');
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    // Allow all authenticated users to fetch their classrooms
    fetchClassrooms();
  }, [user, token]);

  // Enhanced error and loading states
  if (loading) return <div className="loading">Loading classrooms...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="classroom-list-container">
      {(user?.role === 'lecturer') && (
        <div className="add-classroom-section">
          <AddClassroomForm onClassroomAdded={fetchClassrooms} />
        </div>
      )}

      <h3>
        {user?.role === 'lecturer' ? 'Your Classrooms' : 
         user?.role === 'student' ? 'Your Enrolled Classrooms' : 
         'All Classrooms'}
      </h3>

      {classrooms.length === 0 ? (
        <p className="no-classrooms">
          {user?.role === 'lecturer' 
            ? 'You have not created any classrooms yet.' 
            : user?.role === 'student'
            ? 'You are not enrolled in any classrooms yet.'
            : 'No classrooms are available.'}
        </p>
      ) : (
        <div className="classrooms-grid">
          {classrooms.map((classroom) => (
            <div key={classroom._id} className="classroom-card">
              <div className="classroom-header">
                <h4>{classroom.name}</h4>
                <span className="classroom-code">Code: {classroom.code}</span>
              </div>
              
              {classroom.description && (
                <p className="classroom-description">
                  {classroom.description}
                </p>
              )}

              {classroom.lecturerId && (
                <div className="classroom-lecturer">
                  <small>
                    Lecturer: {classroom.lecturerId.name || 'Unknown'}
                  </small>
                </div>
              )}

              <div className="classroom-actions">
                <Link 
                  to={`/classrooms/${classroom._id}`} 
                  className="view-classroom-link"
                >
                  View Classroom Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomList;