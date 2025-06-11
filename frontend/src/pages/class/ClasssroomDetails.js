// Updated ClassroomDetails.js with comprehensive debugging
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../styles/ClassroomDetails.css';

const ClassroomDetails = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [classroom, setClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New states for adding students
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch classroom details and its assignments
  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        // Debug logs
        console.log('=== DEBUGGING CLASSROOM FETCH ===');
        console.log('Classroom ID:', id);
        console.log('User:', user);
        console.log('Token exists:', !!token);
        console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

        // Check if we have required data
        if (!token) {
          throw new Error('No authentication token found');
        }

        if (!id) {
          throw new Error('No classroom ID provided');
        }

        // Try HTTP first (most common for localhost)
        const baseURL = 'http://localhost:5000';
        console.log('Attempting to fetch from:', `${baseURL}/api/classrooms/${id}`);
        
        // Fetch classroom details
        const classroomRes = await axios.get(`${baseURL}/api/classrooms/${id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Classroom response status:', classroomRes.status);
        console.log('Classroom response data:', classroomRes.data);
        
        // Handle different response formats
        let classroomData;
        if (classroomRes.data.success && classroomRes.data.data) {
          classroomData = classroomRes.data.data;
        } else if (classroomRes.data.data) {
          classroomData = classroomRes.data.data;
        } else {
          classroomData = classroomRes.data;
        }
        
        console.log('Processed classroom data:', classroomData);
        setClassroom(classroomData);
        
        // Fetch classroom assignments
        console.log('Fetching assignments...');
        const assignmentsRes = await axios.get(`${baseURL}/api/classrooms/${id}/assignments`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Assignments response:', assignmentsRes.data);
        
        // Handle assignments response format
        let assignmentsData;
        if (assignmentsRes.data.success && assignmentsRes.data.data) {
          assignmentsData = assignmentsRes.data.data;
        } else if (assignmentsRes.data.data) {
          assignmentsData = assignmentsRes.data.data;
        } else {
          assignmentsData = assignmentsRes.data;
        }
        
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        
        setLoading(false);
        console.log('=== FETCH COMPLETED SUCCESSFULLY ===');
        
      } catch (err) {
        console.error('=== FETCH ERROR DETAILS ===');
        console.error('Error object:', err);
        console.error('Error message:', err.message);
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response?.data);
        console.error('Error response status:', err.response?.status);
        console.error('Error response headers:', err.response?.headers);
        
        let errorMessage = 'Failed to load classroom details. ';
        
        if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          const responseData = err.response.data;
          
          switch (status) {
            case 401:
              errorMessage = 'Authentication failed. Please login again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to view this classroom.';
              break;
            case 404:
              errorMessage = 'Classroom not found. Please check the classroom ID.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = `Server error (${status}): ${responseData?.message || 'Unknown error'}`;
          }
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = 'Cannot connect to server. Please check if the server is running on port 5000.';
        } else {
          // Something else happened
          errorMessage = `Request failed: ${err.message}`;
        }
        
        console.error('Final error message:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchClassroomDetails();
  }, [id, token]);

  // Fetch available students (not already in the classroom)
  const fetchAvailableStudents = async () => {
    setLoadingStudents(true);
    try {
      console.log('Fetching available students...');
      const response = await axios.get(`http://localhost:5000/api/classrooms/${id}/available-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Available students response:', response.data);
      const studentsData = response.data.data || response.data;
      setAvailableStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      console.error('Failed to fetch available students:', err);
      setError('Failed to load available students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle showing add students modal
  const handleShowAddStudents = () => {
    setShowAddStudents(true);
    fetchAvailableStudents();
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Add selected students to classroom
  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    setAddingStudents(true);
    try {
      await axios.post(`http://localhost:5000/api/classrooms/${id}/add-students`, {
        studentIds: selectedStudents
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh classroom data to show new students
      const classroomRes = await axios.get(`http://localhost:5000/api/classrooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle response format
      const classroomData = classroomRes.data.data || classroomRes.data;
      setClassroom(classroomData);
      
      // Reset states
      setSelectedStudents([]);
      setShowAddStudents(false);
      setSearchTerm('');
      
    } catch (err) {
      console.error('Failed to add students:', err);
      setError('Failed to add students. Please try again.');
    } finally {
      setAddingStudents(false);
    }
  };

  // Filter available students based on search term
  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state with debugging info
  if (loading) {
    return (
      <div className="loading">
        <p>Loading classroom details...</p>
        <p style={{fontSize: '12px', color: '#666'}}>
          Debug: ID={id}, Token={token ? 'Present' : 'Missing'}
        </p>
      </div>
    );
  }
  
  // Error state with debugging info
  if (error) {
    return (
      <div className="error">
        <h3>Error Loading Classroom</h3>
        <p>{error}</p>
        <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', fontSize: '12px'}}>
          <strong>Debug Information:</strong>
          <br />Classroom ID: {id}
          <br />User Role: {user?.role || 'Unknown'}
          <br />Token Present: {token ? 'Yes' : 'No'}
          <br />Check browser console for detailed logs
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{marginTop: '10px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!classroom) return <div className="error">Classroom not found</div>;

  return (
    <div className="classroom-details-container">
      {/* Rest of your existing JSX remains the same */}
      {/* Classroom Header */}
      <div className="classroom-header">
        <h2>{classroom.name}</h2>
        <div className="classroom-meta">
          <span className="classroom-code">Code: {classroom.code}</span>
          {classroom.lecturerId && (
            <span className="classroom-lecturer">
              Lecturer: {classroom.lecturerId.name || 'Unknown'}
            </span>
          )}
        </div>
      </div>

      {/* Description Section */}
      {classroom.description && (
        <div className="section-card classroom-description">
          <h3>Description</h3>
          <p>{classroom.description}</p>
        </div>
      )}

      {/* Management options for lecturers */}
      {(user?.role === 'lecturer' || user?.role === 'admin') && (
        <div className="section-card classroom-management">
          <h3>Classroom Management</h3>
          <div className="management-buttons">
            <Link to={`/classrooms/${id}/manage`} className="button">
              Manage Students
            </Link>
            <Link to={`/classrooms/${id}/assignments/create`} className="button">
              Create Assignment
            </Link>
          </div>
        </div>
      )}

      {/* Assignments section */}
      <div className="section-card classroom-assignments">
        <h3>Assignments</h3>
        {assignments.length === 0 ? (
          <div className="empty-state">
            <p>No assignments have been created for this classroom yet.</p>
            {(user?.role === 'lecturer' || user?.role === 'admin') && (
              <Link to={`/classrooms/${id}/assignments/create`} className="button">
                Create First Assignment
              </Link>
            )}
          </div>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="assignment-card">
                <h4>{assignment.title}</h4>
                <div className="assignment-card-content">
                  {assignment.description && (
                    <p className="assignment-description">{assignment.description}</p>
                  )}
                  
                  <div className="assignment-meta">
                    <span className="due-date">
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="assignment-actions">
                    {user?.role === 'student' && (
                      <Link to={`/assignments/${assignment._id}/submit`} className="button">
                        Submit Assignment
                      </Link>
                    )}
                    
                    {(user?.role === 'lecturer' || user?.role === 'admin') && (
                      <Link to={`/assignments/${assignment._id}/submissions`} className="button">
                        View Submissions
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students list for lecturers */}
      {(user?.role === 'lecturer' || user?.role === 'admin') && classroom.students && (
        <div className="section-card classroom-students">
          <div className="students-header">
            <h3>Students ({classroom.students.length})</h3>
            <button 
              onClick={handleShowAddStudents}
              className="button button-primary"
            >
              Add Students
            </button>
          </div>
          
          {classroom.students.length === 0 ? (
            <div className="empty-state">
              <p>No students have joined this classroom yet.</p>
            </div>
          ) : (
            <ul className="student-list">
              {classroom.students.map((student) => (
                <li key={student._id} className="student-item">
                  <div className="student-info">
                    <span className="student-name">{student.name}</span>
                    <span className="student-email">({student.email})</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add Students Modal - keeping your existing modal code */}
      {showAddStudents && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Students to Classroom</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddStudents(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="available-students-list">
                {loadingStudents ? (
                  <div className="loading">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="empty-state">
                    <p>No available students found.</p>
                  </div>
                ) : (
                  <div className="student-checkboxes">
                    {filteredStudents.map((student) => (
                      <label key={student._id} className="student-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleStudentSelect(student._id)}
                        />
                        <div className="student-checkbox-info">
                          <span className="student-name">{student.name}</span>
                          <span className="student-email">{student.email}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="button button-secondary"
                onClick={() => setShowAddStudents(false)}
              >
                Cancel
              </button>
              <button 
                className="button button-primary"
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0 || addingStudents}
              >
                {addingStudents ? 'Adding...' : `Add ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetails;