import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Grades.css"; 
import { AuthContext }  from "../../context/AuthContext"; 

const Grades = () => {
  const { token, user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { studentId } = useParams(); // For specific student route

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // If lecturer and no specific student selected, fetch all students first
        if (user.role === "lecturer" && !studentId && !selectedStudentId) {
          await fetchStudents();
        } else {
          await fetchSubmissions();
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load grades. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user, studentId, selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      throw err;
    }
  };

  const fetchSubmissions = async () => {
    try {
      let url = "http://localhost:5000/api/submissions";
      
      // Determine which student's submissions to fetch
      if (user.role === "student") {
        // Students see only their own submissions
        url += `?graded=true`;
      } else if (user.role === "lecturer") {
        if (studentId) {
          // Specific student route
          url = `http://localhost:5000/api/students/${studentId}/submissions`;
        } else if (selectedStudentId) {
          // Selected from dropdown
          url = `http://localhost:5000/api/students/${selectedStudentId}/submissions`;
        } else {
          // All graded submissions
          url += `?graded=true`;
        }
      }
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSubmissions(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      throw err;
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
  };

  const downloadFile = async (filename) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/submissions/download/${filename}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File download error:', err.response?.data || err.message);
      alert('Failed to download the file. Please try again.');
    }
  };

  const downloadAssignmentFile = async (filePath, filename) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/files/${encodeURIComponent(filePath)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Assignment file download error:', err.response?.data || err.message);
      alert('Failed to download the assignment file. Please try again.');
    }
  };

  const calculateGPA = () => {
    if (submissions.length === 0) return 0;
    
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined && s.grade !== null);
    if (gradedSubmissions.length === 0) return 0;
    
    const total = gradedSubmissions.reduce((sum, s) => sum + s.grade, 0);
    return (total / gradedSubmissions.length).toFixed(2);
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'grade-excellent';
    if (grade >= 80) return 'grade-good';
    if (grade >= 70) return 'grade-satisfactory';
    if (grade >= 60) return 'grade-passing';
    return 'grade-failing';
  };

  const getSelectedStudentName = () => {
    if (studentId) {
      const student = students.find(s => s._id === studentId);
      return student ? student.name : 'Unknown Student';
    }
    if (selectedStudentId) {
      const student = students.find(s => s._id === selectedStudentId);
      return student ? student.name : 'Selected Student';
    }
    return null;
  };

  if (loading) return <div className="loading">Loading grades...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="grades-page">
      <div className="grades-header">
        <h2>
          {user.role === "student" 
            ? "My Grades" 
            : studentId || selectedStudentId 
              ? `Grades for ${getSelectedStudentName()}`
              : "Student Grades"
          }
        </h2>
        
        {user.role === "lecturer" && !studentId && (
          <div className="student-selector">
            <label htmlFor="student-select">Select Student:</label>
            <select 
              id="student-select"
              value={selectedStudentId} 
              onChange={(e) => handleStudentSelect(e.target.value)}
            >
              <option value="">-- All Students --</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="no-grades">
          <p>No graded submissions found.</p>
        </div>
      ) : (
        <>
          {(user.role === "student" || selectedStudentId || studentId) && (
            <div className="grade-summary">
              <div className="summary-card">
                <h3>Grade Summary</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Assignments:</span>
                    <span className="stat-value">{submissions.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Graded:</span>
                    <span className="stat-value">
                      {submissions.filter(s => s.grade !== undefined).length}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Average Grade:</span>
                    <span className={`stat-value grade-average ${getGradeColor(calculateGPA())}`}>
                      {calculateGPA()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grades-table-container">
            <table className="grades-table">
              <thead>
                <tr>
                  {user.role === "lecturer" && !selectedStudentId && !studentId && (
                    <th>Student</th>
                  )}
                  <th>Assignment</th>
                  <th>Due Date</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>Feedback</th>
                  <th>Files</th>
                  <th>Assignment Files</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    {user.role === "lecturer" && !selectedStudentId && !studentId && (
                      <td className="student-cell">
                        {submission.student?.name || "Unknown Student"}
                      </td>
                    )}
                    <td className="assignment-cell">
                      <div className="assignment-info">
                        <span className="assignment-title">
                          {submission.assignment?.title || "Untitled Assignment"}
                        </span>
                      </div>
                    </td>
                    <td className="date-cell">
                      {submission.assignment?.deadline 
                        ? new Date(submission.assignment.deadline).toLocaleDateString()
                        : "No deadline"
                      }
                    </td>
                    <td className="date-cell">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </td>
                    <td className={`status-cell ${submission.isLate ? 'late' : 'on-time'}`}>
                      {submission.isLate ? "Late" : "On Time"}
                    </td>
                    <td className="grade-cell">
                      {submission.grade !== undefined ? (
                        <span className={`grade-value ${getGradeColor(submission.grade)}`}>
                          {submission.grade}/100
                        </span>
                      ) : (
                        <span className="not-graded">Not graded</span>
                      )}
                    </td>
                    <td className="feedback-cell">
                      {submission.feedback ? (
                        <div className="feedback-content">
                          <span className="feedback-text">{submission.feedback}</span>
                          {submission.gradedBy && (
                            <small className="graded-by">
                              - {submission.gradedBy.name}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span className="no-feedback">No feedback</span>
                      )}
                    </td>
                    <td className="files-cell">
                      {Array.isArray(submission.files) && submission.files.length > 0 ? (
                        <div className="file-downloads">
                          {submission.files.map((file, idx) => (
                            <button 
                              key={idx}
                              className="download-btn submission-file"
                              onClick={() => downloadFile(file.filename)}
                              title={`Download ${file.filename}`}
                            >
                              📎 {file.filename}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="no-files">No files</span>
                      )}
                    </td>
                    <td className="assignment-files-cell">
                      {Array.isArray(submission.assignment?.files) && submission.assignment.files.length > 0 ? (
                        <div className="file-downloads">
                          {submission.assignment.files.map((file, idx) => (
                            <button 
                              key={idx}
                              className="download-btn assignment-file"
                              onClick={() => downloadAssignmentFile(file.path, file.filename)}
                              title={`Download assignment file: ${file.filename}`}
                            >
                              📋 {file.filename}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="no-files">No files</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Grades;