import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AssignmentSubmit.css';
import { AuthContext } from '../../context/AuthContext';

const AssignmentSubmit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [assignment, setAssignment] = useState(null);
  const [files, setFiles] = useState([]); // ✅ Store multiple files
  const [comments, setComments] = useState(''); // Added comments field
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ✅ Fetch assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/assignments/${id}`, {

          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignment(res.data);
      } catch (err) {
        console.error('Error loading assignment:', err);
        setError('Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id && token) {
      fetchAssignment();
    }
  }, [id, token]);

  // ✅ Handle file input (multiple)
  const handleFileChange = (e) => {
    // Limit to 5 files max
    if (e.target.files.length > 5) {
      setError('You can upload a maximum of 5 files');
      return;
    }
    setFiles([...e.target.files]); // Convert FileList to array
    setError(''); // Clear any previous errors
  };

  // Handle comments input
  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError('Please select at least one file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('assignment', id); // ✅ match backend's expected field
    formData.append('comments', comments); // Add comments to submission

    // ✅ Append each file with the key 'files'
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/submissions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMsg('Assignment submitted successfully!');
      setFiles([]);
      setComments('');

      // Navigate after success
      setTimeout(() => {
        navigate('/submissions');
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to submit assignment');
    }
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!assignment || !assignment.deadline) return false;
    return new Date() > new Date(assignment.deadline);
  };

  if (loading) return <div className="loading">Loading assignment details...</div>;
  if (error && !assignment) return <div className="error">{error}</div>;
  if (!assignment) return <div className="error">Assignment not found</div>;

  return (
    <div className="submit-page">
      <h2>Submit Assignment</h2>

      <div className="assignment-details">
        <h3>{assignment.title}</h3>
        <p>{assignment.description}</p>
        <p className={isDeadlinePassed() ? "deadline-passed" : ""}>
          <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleString()}
          {isDeadlinePassed() && <span className="late-warning"> (Deadline passed - submission will be marked late)</span>}
        </p>

        {/* Optional assignment materials */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="assignment-attachment">
            <p><strong>Assignment Files:</strong></p>
            <a 
              href={`${process.env.REACT_APP_API_URL}/api/assignments/download/${assignment.attachments[0].filename}`}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                // Use the authenticated download method
                downloadAssignmentFile(assignment.attachments[0].filename);
              }}
            >
              Download Assignment Materials
            </a>
          </div>
        )}
      </div>

      <form className="submission-form" onSubmit={handleSubmit}>
        {successMsg && <p className="success-message">{successMsg}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="file-input-container">
          <label htmlFor="submission-file">Upload your work (max 5 files):</label>
          <input 
            type="file"
            id="submission-file"
            onChange={handleFileChange}
            multiple // ✅ allow multiple file selection
            required
          />
          <small>Selected files: {files.length > 0 ? files.map(f => f.name).join(', ') : 'None'}</small>
        </div>

        <div className="comments-container">
          <label htmlFor="comments">Comments (optional):</label>
          <textarea
            id="comments"
            value={comments}
            onChange={handleCommentsChange}
            placeholder="Add any notes about your submission here"
            rows="4"
          ></textarea>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Assignment'}
        </button>
      </form>
    </div>
  );
  
  // Helper function for downloading assignment files
  async function downloadAssignmentFile(filename) {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/assignments/download/${filename}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create a blob from the response data
      const blob = new Blob([response.data]);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // Release the object URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Failed to download assignment file. Please try again later.");
    }
  }
};

export default AssignmentSubmit;