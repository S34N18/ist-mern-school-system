// Complete updated submissions controller
const Submission = require('../models/submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all submissions with filtering options
// @route   GET /api/submissions
// @access  Private
exports.getSubmissions = async (req, res) => {
  try {
    let query = {};
    
    // Filter by assignment if provided
    if (req.query.assignment) {
      query.assignment = req.query.assignment;
    }
    
    // If user is a student, only show their submissions
    if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    // Additional filters if needed
    if (req.query.graded === 'true') {
      query.grade = { $exists: true };
    } else if (req.query.graded === 'false') {
      query.grade = { $exists: false };
    }

    const submissions = await Submission.find(query)
      .populate('assignment', 'title deadline classroomId')
      .populate('student', 'name email')
      .populate('gradedBy', 'name');

    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error fetching submissions' });
  }
};

// @desc    Get single submission by ID
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment', 'title deadline')
      .populate('student', 'name email')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Security check: only allow access if user is the student who submitted or a lecturer
    if (req.user.role !== 'lecturer' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this submission' });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new submission (student uploads)
// @route   POST /api/submissions
// @access  Private (Student only)
exports.createSubmission = async (req, res) => {
  try {
    const { assignment } = req.body;

    // Check if assignment exists
    const assignmentDoc = await Assignment.findById(assignment);
    if (!assignmentDoc) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check for deadline
    const now = new Date();
    const isLate = now > new Date(assignmentDoc.deadline);

    // Process uploaded files
    const files = req.files.map(file => ({
      filename: file.filename,
      path: `uploads/submissions/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size
    }));

    // Check if student already has a submission for this assignment
    const existingSubmission = await Submission.findOne({
      assignment,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: 'You already have a submission for this assignment. Please update your existing submission instead.' 
      });
    }

    const submission = new Submission({
      assignment,
      student: req.user.id,
      files,
      comments: req.body.comments || '',
      submittedAt: now,
      isLate
    });

    await submission.save();

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update submission (before deadline)
// @route   PUT /api/submissions/:id
// @access  Private (Student only)
exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Make sure student owns it
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already graded
    if (submission.grade !== undefined) {
      return res.status(400).json({ message: 'Cannot update a graded submission' });
    }

    // Update fields
    submission.comments = req.body.comments || submission.comments;
    
    // Handle file updates if any
    if (req.files && req.files.length > 0) {
      // Delete old files from storage
      submission.files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      
      // Add new files
      submission.files = req.files.map(file => ({
        filename: file.filename,
        path: `uploads/submissions/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
      
      submission.submittedAt = new Date();
    }
    
    await submission.save();

    res.status(200).json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Error updating submission' });
  }
};

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private (Student only)
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Make sure student owns it
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already graded
    if (submission.grade !== undefined) {
      return res.status(400).json({ message: 'Cannot delete a graded submission' });
    }

    // Delete files from storage
    submission.files.forEach(file => {
      const filePath = path.join(__dirname, '..', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Submission.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Error deleting submission' });
  }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Lecturer only)
exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    // Validate grade
    if (grade < 0 || grade > 100) {
      return res.status(400).json({ message: 'Grade must be between 0 and 100' });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();

    await submission.save();

    res.status(200).json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Error grading submission' });
  }
};

// @desc    Download a specific submitted file
// @route   GET /api/submissions/download/:filename
// @access  Private (Both students and lecturers)
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/submissions', filename);

    // First check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Security check - verify user has permission to access this file
    // Find the submission that contains this file
    const submission = await Submission.findOne({
      'files.filename': filename
    }).populate('student', '_id');

    if (!submission) {
      return res.status(404).json({ message: 'Associated submission not found' });
    }

    // Allow if user is a lecturer OR if the student owns the submission
    if (req.user.role !== 'lecturer' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to download this file' });
    }

    // All checks passed, send the file
  res.download(filePath, filename, (err) => {
  if (err) {
    console.error('Error sending file:', err);
    res.status(500).json({ message: 'Failed to send file' });
  }
});

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};



//  GET /api/submissions

// 🔒 Private – Role: Student or Lecturer

//     Filters submissions by:

//         assignment (query param)

//         graded (true or false)

//     Students only see their own submissions.

//     Populates assignment, student, and grader details.

//     Returns all matching submissions.

// 📄 GET /api/submissions/:id

// 🔒 Private – Only Author or Lecturer

//     Fetches a single submission by ID.

//     Populates assignment, student, and grader details.

//     Only accessible by:

//         The student who submitted it, or

//         A lecturer

//     Unauthorized users receive a 403 Forbidden.

// 🆕 POST /api/submissions

// 🔒 Private – Student Only

//     Validates assignment existence and checks deadline.

//     Prevents multiple submissions for the same assignment.

//     Saves file uploads and submission metadata.

//     Automatically flags late submissions.

//     Returns the created submission.

// ✏️ PUT /api/submissions/:id

// 🔒 Private – Student Only

//     Allows updates to ungraded submissions only.

//     Deletes and replaces uploaded files if new ones are provided.

//     Updates comments and submittedAt timestamp.

//     Validates ownership before update.

// ❌ DELETE /api/submissions/:id

// 🔒 Private – Student Only

//     Allows deletion only if:

//         The submission is owned by the student

//         It is not graded

//     Deletes associated files from the file system.

//     Deletes the submission from the database.

// 🧑‍🏫 PUT /api/submissions/:id/grade

// 🔒 Private – Lecturer Only

//     Grades a submission:

//         Validates grade (0–100)

//         Stores feedback, gradedBy, and gradedAt

//     Returns the updated submission.

// 📥 GET /api/submissions/download/:filename

// 🔒 Private – Student (owner) or Lecturer

//     Sends a file to the user if:

//         File exists

//         The user is the submission’s owner or a lecturer

//     Validates filename presence and permissions.

//     Sends file using res.download().

// ✅ Additional Implementation Highlights

//     Security: Strict checks on user roles for access/modification.

//     File Handling:

//         Upload and storage handled securely.

//         Old files are deleted on update.

//     Populated References:

//         Assignments, students, and graders are enriched with relevant fields for frontend use.

//     Robust Error Handling:

//         Graceful error messages for missing submissions, permission denials, etc.

