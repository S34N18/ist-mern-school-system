import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../styles/AssignmentDetails.css';

const AssignmentDetails = () => {
  const { assignmentId } = useParams();
  const { token, user } = useContext(AuthContext);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/assignments/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Assignment data received:', res.data); // Debug: Log full response
        setAssignment(res.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignment details');
        setLoading(false);
        console.error(err);
      }
    };

    fetchAssignment();
  }, [assignmentId, token]);

  // Function to handle file download
  const downloadFile = async (fileIndex) => {
    try {
      // Use axios to fetch the file with responseType 'blob'
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/assignments/${assignmentId}/download/${fileIndex}`,
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
      } else if (assignment.attachments && assignment.attachments[fileIndex]) {
        // Fallback to using the filename from the assignment data
        filename = assignment.attachments[fileIndex].filename;
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!assignment) return <div className="not-found">Assignment not found</div>;

  // Debug: Log assignment object with attachments info
  console.log('Assignment object:', assignment);
  console.log('Has attachments?', !!assignment.attachments);
  console.log('Attachments array:', assignment.attachments);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="assignment-details-container">
      <div className="assignment-header">
        <h2>{assignment.title}</h2>
        <div className="assignment-meta">
          <span>Due: {formatDate(assignment.dueDate)}</span>
          {assignment.createdBy && (
            <span>Created by: {assignment.createdBy.name}</span>
          )}
        </div>
      </div>

      <div className="assignment-description">
        <h3>Description</h3>
        <p>{assignment.description}</p>
      </div>

  
      {/* Check if attachments exist and have length */}
      {assignment.attachments && assignment.attachments.length > 0 ? (
        <div className="assignment-files">
          <h3>Assignment Files</h3>
          <ul className="file-list">
            {assignment.attachments.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.filename}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <button 
                  className="download-button"
                  onClick={() => downloadFile(index)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="no-attachments">
          <p>This assignment has no attached files.</p>
        </div>
      )}

      {/* Add a submission section if user is a student */}
      {user && user.role === 'student' && (
        <div className="assignment-submission">
          <h3>Submit Assignment</h3>
          <Link to={`/assignments/${assignmentId}/submit`} className="submit-button">
            Go to submission page
          </Link>
        </div>
      )}
      
      {/* Add an edit button if user is the creator */}
      {user && 
       user.role === 'lecturer' && 
       assignment.createdBy && 
       user.id === assignment.createdBy._id && (
        <div className="assignment-actions">
          <Link to={`/assignments/${assignmentId}/edit`} className="edit-button">
            Edit Assignment
          </Link>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetails;