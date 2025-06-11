// Updated SubmissionList.js to handle both specific and general routes
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./styles/SubmissionList.css";
import { AuthContext } from "../context/AuthContext";

const SubmissionList = () => {
  const { token, user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { assignmentId } = useParams(); // This will be undefined for the general /submissions route

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        let url = "http://localhost:5000/api/submissions";
        
        // If we have an assignmentId parameter, use it to filter submissions
        if (assignmentId) {
          url = `http://localhost:5000/api/submissions?assignment=${assignmentId}`;
        }
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setSubmissions(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
        setError("Failed to load submissions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [token, assignmentId]);

const downloadFile = async (filename) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/submissions/download/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important: treats it as a file, not JSON
      }
    );

    // Create a blob URL and simulate download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Name the downloaded file
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('File download error:', err.response?.data || err.message);
    alert('Failed to download the file. Please try again.');
  }
};


  return (
    <div className="submission-page">
      <h2>{assignmentId ? "Assignment Submissions" : "All Submissions"}</h2>

      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>File(s)</th>
              {user.role === "lecturer" && <th>Grade</th>}
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s._id}>
                <td>{s.student?.name || "Unknown Student"}</td>
                <td>{s.assignment?.title || "Untitled Assignment"}</td>
                <td>{new Date(s.submittedAt).toLocaleString()}</td>
                <td>{s.isLate ? "Late" : "On Time"}</td>
                <td>
                  {Array.isArray(s.files) && s.files.length > 0
                    ? s.files.map((file, idx) => (
                        <div key={idx}>
                          <button 
                            className="download-btn"
                            onClick={() => downloadFile(file.filename)}
                          >
                            Download {file.filename || `File ${idx + 1}`}
                          </button>
                        </div>
                      ))
                    : "No files"}
                </td>
                {user.role === "lecturer" && (
                  <td>
                    {s.grade !== undefined ? `${s.grade}/100` : "Not graded"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SubmissionList;