import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AssignmentCreate from "./pages/Assignment/AssignmentCreate.js";
import AssignmentList from "./pages/Assignment/AssignmentList.js";
import AssignmentSubmit from "./pages/Assignment/AssignmentSubmit.js";
import Users from "./pages/Users.js";
import SubmissionList from "./pages/SubmissionList.js";
import ProtectedLayout from "./components/ProtectedLayout.js";
import ManageStudentWrapper from "./pages/class/ManageStudentWrapper.js";
import ClassroomList from "./pages/class/ClassroomList.js";
import ClassroomDetails from "./pages/class/ClasssroomDetails.js";
import AssignmentDetails from "./pages/Assignment/AssignmentDetails.js";
import ClassroomStudentManager from "./pages/class/ClassroomStudentManager.js";

// Student-specific components
import MyClasses from "./pages/students/MyClasses.js";
import Grades from "./pages/students/Grades.js";
import GradingPage from "./pages/students/GradingPage.js";
import Calendar from "./pages/students/Calendar.js";
import Profile from "./pages/students/Profile.js";

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* Student-specific Routes */}
        <Route
          path="/my-classes"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <MyClasses />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        
        {/* Grades Routes */}
        <Route
          path="/grades"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <Grades />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        
        {/* Lecturer viewing specific student grades */}
        <Route
          path="/grades/student/:studentId"
          element={
            <PrivateRoute requiredRole="lecturer">
              <ProtectedLayout>
                <Grades />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        
        {/* Grading Page - Lecturer Only */}
        <Route
          path="/grading"
          element={
            <PrivateRoute requiredRole="lecturer">
              <ProtectedLayout>
                <GradingPage />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <Calendar />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <Profile />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* Classroom Routes */}
        <Route
          path="/classrooms"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <ClassroomList />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/classrooms/:id"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <ClassroomDetails />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/classrooms/:id/manage"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <ManageStudentWrapper />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* Assignment Routes */}
        <Route
          path="/classrooms/:classroomId/assignments/create"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <AssignmentCreate />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <AssignmentList />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        <Route 
          path="/assignments/:assignmentId"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <AssignmentDetails />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/assignments/:id/submit"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <AssignmentSubmit />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* Submissions Routes */}
        <Route
          path="/assignments/:assignmentId/submissions"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <SubmissionList />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        
        {/* General submissions route */}
        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <SubmissionList />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* User Management */}
        <Route 
          path="/users" 
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <Users />
              </ProtectedLayout>
            </PrivateRoute>
          } 
        />
        
        {/* 404 Route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;