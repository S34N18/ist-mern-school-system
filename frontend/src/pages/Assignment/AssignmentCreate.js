// Import necessary modules
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AssignmentCreate.css';  // Import CSS for styling
import { AuthContext } from '../../context/AuthContext';  // Import Authentication context

// ✅ Assignment Create Component
const AssignmentCreate = () => {
  const { classroomId } = useParams(); // Get classroom ID from URL
  const navigate = useNavigate();
  const { token } = useContext(AuthContext); // Get the token from Auth Context
  const [classroom, setClassroom] = useState(null);

  // State to manage form input fields
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  // State to manage file upload
  const [file, setFile] = useState(null);

  // State to show success message
  const [successMsg, setSuccessMsg] = useState('');
  
  // Fetch classroom details
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassroom(res.data);
      } catch (err) {
        console.error('Failed to fetch classroom:', err);
      }
    };

    if (classroomId) {
      fetchClassroom();
    }
  }, [classroomId, token]);

  // ✅ Handle changes in input fields
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Store only the first file selected
    console.log('File selected:', e.target.files[0]); // Debug: Log file info
  };

  // ✅ Handle form submission with enhanced debugging
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit

    // Prepare data to send
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('deadline', form.deadline); // Backend will map this to dueDate
    formData.append('classroomId', classroomId); // Classroom association
    
    // Log formData contents before appending file
    console.log('FormData before file:', {
      title: form.title,
      description: form.description,
      deadline: form.deadline,
      classroomId: classroomId
    });
    
    if (file) {
      formData.append('file', file);
      console.log('File appended to FormData:', file.name, file.size, file.type);
    } else {
      console.log('No file selected for upload');
    }

    try {
      console.log('Sending request to create assignment...');
      
      // Send POST request to backend to create assignment
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/assignments`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,  // Send token for authentication
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Assignment created successfully:', response.data);

      // Clear the form after success
      setForm({ title: '', description: '', deadline: '' });
      setFile(null);
      setSuccessMsg('Assignment created successfully!');
      
      // Navigate back to classroom details after 2 seconds
      setTimeout(() => {
        navigate(`/classrooms/${classroomId}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating assignment:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
      }
      alert('Failed to create assignment: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="create-assignment-page">
      {classroom && (
        <div className="classroom-header">
          <h3>Creating assignment for: {classroom.name}</h3>
        </div>
      )}
      
      <form className="assignment-form" onSubmit={handleSubmit}>
        <h2>Create Assignment</h2>

        {/* Show success message if assignment is created */}
        {successMsg && <p className="success">{successMsg}</p>}

        {/* Assignment Title */}
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Assignment Title"
          required
        />

        {/* Assignment Description */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Assignment Description"
          required
        />

        {/* Assignment Deadline */}
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          required
        />

        {/* File Upload with debug info */}
        <div className="file-upload-section">
          <label>Assignment File (Optional):</label>
          <input type="file" onChange={handleFileChange} />
          {file && (
            <div className="file-preview">
              <p>Selected file: {file.name} ({(file.size/1024).toFixed(2)} KB)</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit">Publish Assignment</button>
      </form>
    </div>
  );
};

export default AssignmentCreate;