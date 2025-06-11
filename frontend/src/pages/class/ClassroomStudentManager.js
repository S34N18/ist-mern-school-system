import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/ClassroomStudentManager.css';

const ClassroomStudentManager = ({ classroomId, token }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch classroom details
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get(`/api/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fix: Access the correct path for students
        // Backend returns: { success: true, data: classroom }
        // So students are at res.data.data.students
        const classroomData = res.data.data;
        setStudents(classroomData.students || []);
        
      } catch (err) {
        console.error('Failed to fetch classroom:', err);
        setError(err.response?.data?.message || 'Failed to fetch classroom');
      } finally {
        setLoading(false);
      }
    };

    if (classroomId && token) {
      fetchClassroom();
    }
  }, [classroomId, token]);

  const handleCheckboxChange = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleRemoveStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    try {
      await axios.put(
        `/api/classrooms/${classroomId}/remove-students`,
        { studentIds: selectedStudents },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents((prev) => prev.filter((s) => !selectedStudents.includes(s._id)));
      setSelectedStudents([]);
      alert('Students removed successfully');
    } catch (err) {
      console.error('Failed to remove students:', err);
      alert(err.response?.data?.message || 'Failed to remove students');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading classroom students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon"></div>
          <div>
            <h3 className="error-title">Error Loading Students</h3>
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-container">
      {/* Header */}
      <div className="classroom-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">👥</div>
            <div>
              <h3 className="header-title">Classroom Students</h3>
              <p className="header-subtitle">Manage your classroom enrollment</p>
            </div>
          </div>
          <div className="header-counter">
            <span className="counter-number">{students.length}</span>
            <span className="counter-label">Total</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="classroom-content">
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4 className="empty-title">No students in this classroom</h4>
            <p className="empty-subtitle">
              Students will appear here once they join the classroom
            </p>
          </div>
        ) : (
          <div>
            <div className="student-count">
              Total students: {students.length}
            </div>
            
            <div className="students-list">
              {students.map((student, index) => (
                <div
                  key={student._id}
                  className={`student-card ${selectedStudents.includes(student._id) ? 'selected' : ''}`}
                >
                  <label className="student-label">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => handleCheckboxChange(student._id)}
                      className="student-checkbox"
                    />
                    
                    <div className="student-info">
                      <div className="student-header">
                        <div>
                          <h4 className="student-name">{student.name}</h4>
                          <p className="student-email">{student.email}</p>
                          {student.studentId && (
                            <p className="student-id-container">
                              Student ID:
                              <span className="student-id-badge">
                                {student.studentId}
                              </span>
                            </p>
                          )}
                        </div>
                        
                        <div className="student-number">
                          <div className="student-index">Student #{index + 1}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedStudents.length > 0 && (
          <div className="action-bar">
            <div className="action-info">
              <span className="action-icon"></span>
              <span className="action-text">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={handleRemoveStudents}
              className="remove-button"
            >
              🗑️ Remove Selected ({selectedStudents.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomStudentManager;