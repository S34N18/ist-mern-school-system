import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/GradingPage.css"; 
import { AuthContext } from "../../context/AuthContext";

const GradingPage = () => {
  const { token, user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]); // Initialize as empty array
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [filter, setFilter] = useState("ungraded"); // ungraded, graded, all
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "lecturer") {
      setError("Access denied. This page is for lecturers only.");
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, [token, user]);

  useEffect(() => {
    if (selectedAssignmentId || filter) {
      fetchSubmissions();
    }
  }, [selectedAssignmentId, filter]);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Ensure the response data is an array
      const assignmentsData = Array.isArray(res.data) ? res.data : 
                             res.data.assignments ? res.data.assignments : [];
      
      console.log("Assignments fetched:", assignmentsData); // Debug log
      setAssignments(assignmentsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      setError("Failed to load assignments. Please try again later.");
      setAssignments([]); // Set to empty array on error
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      let url = "http://localhost:5000/api/submissions";
      const params = new URLSearchParams();

      if (selectedAssignmentId) {
        params.append("assignment", selectedAssignmentId);
      }

      if (filter === "graded") {
        params.append("graded", "true");
      } else if (filter === "ungraded") {
        params.append("graded", "false");
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure the response data is an array
      const submissionsData = Array.isArray(res.data) ? res.data : 
                             res.data.submissions ? res.data.submissions : [];
      
      console.log("Submissions fetched:", submissionsData); // Debug log
      setSubmissions(submissionsData);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      setError("Failed to load submissions. Please try again later.");
      setSubmissions([]); // Set to empty array on error
    }
  };

  const startGrading = (submission) => {
    setEditingSubmission(submission._id);
    setGradeInput(submission.grade?.toString() || "");
    setFeedbackInput(submission.feedback || "");
    setSuccessMessage("");
  };

  const cancelGrading = () => {
    setEditingSubmission(null);
    setGradeInput("");
    setFeedbackInput("");
  };

  const submitGrade = async (submissionId) => {
    if (!gradeInput || gradeInput < 0 || gradeInput > 100) {
      alert("Please enter a valid grade between 0 and 100");
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(
        `http://localhost:5000/api/submissions/${submissionId}/grade`,
        {
          grade: parseInt(gradeInput),
          feedback: feedbackInput.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the submission in the local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === submissionId 
            ? { ...sub, grade: parseInt(gradeInput), feedback: feedbackInput.trim(), gradedBy: user }
            : sub
        )
      );

      setEditingSubmission(null);
      setGradeInput("");
      setFeedbackInput("");
      setSuccessMessage("Grade submitted successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error("Failed to submit grade:", err);
      alert("Failed to submit grade. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (filename) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/submissions/download/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
      console.error('File download error:', err);
      alert('Failed to download the file. Please try again.');
    }
  };

  const downloadAssignmentFile = async (filePath, filename) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/files/${encodeURIComponent(filePath)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
      console.error('Assignment file download error:', err);
      alert('Failed to download the assignment file. Please try again.');
    }
  };

  const getStatusColor = (submission) => {
    if (submission.grade !== undefined) return 'graded';
    if (submission.isLate) return 'late';
    return 'pending';
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'grade-excellent';
    if (grade >= 80) return 'grade-good';
    if (grade >= 70) return 'grade-satisfactory';
    if (grade >= 60) return 'grade-passing';
    return 'grade-failing';
  };

  if (loading) return <div className="loading">Loading grading interface...</div>;
  if (error) return <div className="error">{error}</div>;

  const ungradedCount = submissions.filter(s => s.grade === undefined).length;
  const gradedCount = submissions.filter(s => s.grade !== undefined).length;

  return (
    <div className="grading-page">
      <div className="grading-header">
        <h2>Grade Submissions</h2>
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
      </div>

      <div className="grading-controls">
        <div className="control-group">
          <label htmlFor="assignment-select">Filter by Assignment:</label>
          <select
            id="assignment-select"
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
          >
            <option value="">All Assignments</option>
            {assignments.map(assignment => (
              <option key={assignment._id} value={assignment._id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Filter by Status:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'ungraded' ? 'active' : ''}`}
              onClick={() => setFilter('ungraded')}
            >
              Ungraded ({ungradedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'graded' ? 'active' : ''}`}
              onClick={() => setFilter('graded')}
            >
              Graded ({gradedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({submissions.length})
            </button>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="no-submissions">
          <p>No submissions found for the selected criteria.</p>
        </div>
      ) : (
        <div className="submissions-container">
          {submissions.map((submission) => (
            <div key={submission._id} className={`submission-card ${getStatusColor(submission)}`}>
              <div className="submission-header">
                <div className="student-info">
                  <h3>{submission.student?.name || "Unknown Student"}</h3>
                  <p className="student-email">{submission.student?.email}</p>
                </div>
                <div className="submission-meta">
                  <span className="assignment-title">
                    {submission.assignment?.title || "Untitled Assignment"}
                  </span>
                  <span className={`status-badge ${getStatusColor(submission)}`}>
                    {submission.grade !== undefined ? 'Graded' : 
                     submission.isLate ? 'Late Submission' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="submission-details">
                <div className="detail-row">
                  <span className="label">Due Date:</span>
                  <span>{submission.assignment?.deadline 
                    ? new Date(submission.assignment.deadline).toLocaleDateString()
                    : "No deadline"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Submitted:</span>
                  <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                {submission.assignment?.description && (
                  <div className="detail-row">
                    <span className="label">Assignment Description:</span>
                    <p className="assignment-description">{submission.assignment.description}</p>
                  </div>
                )}
              </div>

              <div className="submission-files">
                <div className="files-section">
                  <h4>Student Files:</h4>
                  {Array.isArray(submission.files) && submission.files.length > 0 ? (
                    <div className="file-list">
                      {submission.files.map((file, idx) => (
                        <button
                          key={idx}
                          className="download-btn student-file"
                          onClick={() => downloadFile(file.filename)}
                        >
                          📎 {file.filename}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="no-files">No files submitted</p>
                  )}
                </div>

                {Array.isArray(submission.assignment?.files) && submission.assignment.files.length > 0 && (
                  <div className="files-section">
                    <h4>Assignment Files:</h4>
                    <div className="file-list">
                      {submission.assignment.files.map((file, idx) => (
                        <button
                          key={idx}
                          className="download-btn assignment-file"
                          onClick={() => downloadAssignmentFile(file.path, file.filename)}
                        >
                          📋 {file.filename}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grading-section">
                {editingSubmission === submission._id ? (
                  <div className="grading-form">
                    <div className="form-group">
                      <label htmlFor={`grade-${submission._id}`}>Grade (0-100):</label>
                      <input
                        id={`grade-${submission._id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="Enter grade"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`feedback-${submission._id}`}>Feedback:</label>
                      <textarea
                        id={`feedback-${submission._id}`}
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Enter feedback for the student..."
                        rows="4"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => submitGrade(submission._id)}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Grade'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={cancelGrading}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grade-display">
                    {submission.grade !== undefined ? (
                      <div className="existing-grade">
                        <div className="grade-info">
                          <span className={`grade-value ${getGradeColor(submission.grade)}`}>
                            {submission.grade}/100
                          </span>
                          {submission.gradedBy && (
                            <span className="graded-by">Graded by: {submission.gradedBy.name}</span>
                          )}
                        </div>
                        {submission.feedback && (
                          <div className="feedback-display">
                            <strong>Feedback:</strong>
                            <p>{submission.feedback}</p>
                          </div>
                        )}
                        <button
                          className="btn btn-outline"
                          onClick={() => startGrading(submission)}
                        >
                          Edit Grade
                        </button>
                      </div>
                    ) : (
                      <div className="no-grade">
                        <p>Not graded yet</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => startGrading(submission)}
                        >
                          Grade Submission
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradingPage;