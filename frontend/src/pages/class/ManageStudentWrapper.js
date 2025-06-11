import React from 'react';
import { useParams } from 'react-router-dom';
import ClassroomStudentManager from './ClassroomStudentManager';

const ManageStudentsWrapper = () => {
  const { id } = useParams();
  const token = localStorage.getItem('token');

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Manage Classroom Students</h2>
      <ClassroomStudentManager classroomId={id} token={token} />
    </div>
  );
};

export default ManageStudentsWrapper;
