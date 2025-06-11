// Import necessary modules
const Assignment = require('../models/Assignment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for multer (file upload handler)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/assignments';
    // Create the directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename using the current timestamp
    cb(null, `assignment-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Initialize multer with file size limit and file type filtering
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|txt/; // Allowed file types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: File upload only supports the following filetypes - pdf, doc, docx, txt');
    }
  }
}).single('file'); // Accept a single file with the field name 'file'

// Get all assignments (with optional filtering for lecturers)
exports.getAssignments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'lecturer' && req.query.mine === 'true') {
      filter.createdBy = req.user.id;
    }

    const assignments = await Assignment.find(filter)
      .populate({ path: 'createdBy', select: 'name email' })
      .populate({ path: 'classroomId', select: 'name code' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get assignments for a specific student (used in calendar view)
exports.getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own assignments.' });
    }

    const assignments = await Assignment.find({}) // Adjust with actual filtering logic
      .populate({ path: 'createdBy', select: 'name email' })
      .populate({ path: 'classroomId', select: 'name code' })
      .sort({ dueDate: 1 });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      classroom: { name: assignment.classroomId?.name || 'Unknown Course' },
      submitted: false, // Placeholder
      attachments: assignment.attachments
    }));

    res.status(200).json(formattedAssignments);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get a single assignment by ID
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate({ path: 'createdBy', select: 'name email' });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Create a new assignment
exports.createAssignment = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, message: typeof err === 'string' ? err : 'File upload error' });
      }

      const { title, description, deadline, classroomId } = req.body;
      if (!title || !description || !deadline || !classroomId) {
        return res.status(400).json({ success: false, message: 'Please provide title, description, deadline, and classroomId' });
      }

      let attachments = [];
      if (req.file) {
        attachments.push({
          filename: req.file.originalname,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
      }

      const assignment = await Assignment.create({
        title,
        description,
        dueDate: deadline,
        classroomId,
        createdBy: req.user.id,
        attachments,
        allowedFormats: req.body.allowedFormats ? req.body.allowedFormats.split(',') : undefined,
        maxFileSize: req.body.maxFileSize || undefined
      });

      res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create assignment' });
    }
  });
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this assignment' });
    }

    const { title, description, dueDate, allowedFormats, maxFileSize } = req.body;

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        dueDate,
        allowedFormats: allowedFormats ? allowedFormats.split(',') : assignment.allowedFormats,
        maxFileSize: maxFileSize || assignment.maxFileSize
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this assignment' });
    }

    // Remove associated files from storage
    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      });
    }

    await assignment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Download a specific file from an assignment
exports.downloadAssignmentFile = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const fileIndex = parseInt(req.params.fileIndex);
    if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= assignment.attachments.length) {
      return res.status(400).json({ success: false, message: 'Invalid file index' });
    }

    const file = assignment.attachments[fileIndex];
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimetype);

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
