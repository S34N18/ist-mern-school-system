import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "../styles/AssignmentList.css";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const AssignmentList = () => {
  const { user, token } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/assignments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssignments(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
        setError("Failed to load assignments");
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  // Toggle expand/collapse
  const handleExpand = (id) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  // Function to handle file download
  const downloadFile = async (assignmentId, fileIndex) => {
    try {
      // Use axios to fetch the file with responseType 'blob'
      const response = await axios.get(
        `/api/assignments/${assignmentId}/download/${fileIndex}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' // Important for binary data
        }
      );

      // Create a URL for the blob
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link element
      const fileLink = document.createElement('a');
      fileLink.href = fileURL;
      
      // Get the filename from the response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else {
        // Fallback to using a generic name
        const assignment = assignments.find(a => a._id === assignmentId);
        if (assignment && assignment.attachments && assignment.attachments[fileIndex]) {
          filename = assignment.attachments[fileIndex].filename || `assignment-${assignmentId}-file-${fileIndex}`;
        }
      }
      
      fileLink.setAttribute('download', filename);
      document.body.appendChild(fileLink);
      
      // Trigger the download
      fileLink.click();
      
      // Clean up
      document.body.removeChild(fileLink);
      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading assignments...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="assignment-list">
      <h2>Assignments</h2>
      {assignments.length === 0 ? (
        <p>No assignments found.</p>
      ) : (
        <ul>
          {assignments.map((assignment) => (
            <li
              key={assignment._id}
              className={`assignment-card ${
                expandedId === assignment._id ? "expanded" : ""
              }`}
            >
              {/* Make only the header clickable for expand/collapse */}
              <div className="assignment-header" onClick={() => handleExpand(assignment._id)}>
                <h3>
                  {assignment.title} {expandedId === assignment._id ? "⬆️" : "⬇️"}
                </h3>
              </div>

              {/* Show description and deadline if expanded */}
              {expandedId === assignment._id && (
                <div className="assignment-details">
                  <p>{assignment.description}</p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>

                  {/* Show download buttons if there are files */}
                  {assignment.attachments &&
                    assignment.attachments.length > 0 && (
                      <div className="attachment-section">
                        <h4>Assignment Files</h4>
                        <ul className="attachment-list">
                          {assignment.attachments.map((attachment, index) => (
                            <li key={index} className="attachment-item">
                              <span className="file-name">
                                {attachment.filename || `File ${index + 1}`}
                              </span>
                              <button
                                className="download-button"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the expand/collapse
                                  downloadFile(assignment._id, index);
                                }}
                              >
                                Download
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  
                  {/* Add a view details link */}
                  <Link 
                    to={`/assignments/${assignment._id}`}
                    className="view-details-link"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering expand/collapse
                      console.log(`Navigating to: /assignments/${assignment._id}`);
                    }}
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#4a90e2",
                      color: "white",
                      borderRadius: "4px",
                      textDecoration: "none",
                      fontWeight: "bold"
                    }}
                  >
                    View Full Details
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssignmentList;